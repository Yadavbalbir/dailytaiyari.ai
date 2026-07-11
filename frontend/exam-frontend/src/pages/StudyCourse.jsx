import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { courseService } from '../services/courseService'
import { useAuthStore } from '../context/authStore'
import Loading from '../components/common/Loading'
import {
  BookOpen, Atom, FlaskConical, Calculator, Leaf, Bug,
  ChevronRight, ChevronDown, GraduationCap, ArrowLeft, Settings2,
  PlayCircle, PenTool, ClipboardList, Code2, Trophy, CheckCircle2,
} from 'lucide-react'

const iconMap = {
  'atom': Atom,
  'flask-conical': FlaskConical,
  'calculator': Calculator,
  'leaf': Leaf,
  'bug': Bug,
}

/** Lighten (amt>0) or darken (amt<0) a #rrggbb hex color. Falls back to the input. */
const shade = (hex, amt) => {
  const h = (hex || '').replace('#', '')
  if (h.length < 6) return hex || '#3B82F6'
  const num = parseInt(h.slice(0, 6), 16)
  const clamp = (v) => Math.max(0, Math.min(255, v))
  const r = clamp((num >> 16) + amt)
  const g = clamp(((num >> 8) & 0xff) + amt)
  const b = clamp((num & 0xff) + amt)
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

const progressColor = (p) =>
  p >= 80 ? 'bg-success-500' : p >= 40 ? 'bg-primary-500' : p > 0 ? 'bg-warning-500' : 'bg-surface-200 dark:bg-surface-600'

/** Thin progress bar reused at every level of the accordion. */
const Bar = ({ value, color }) => (
  <div className="w-full h-1.5 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
    <div
      className={`h-full rounded-full transition-all ${color || progressColor(value)}`}
      style={{ width: `${value}%`, backgroundColor: undefined }}
    />
  </div>
)

/** Leaf row: a single topic with an Enter button. */
const TopicRow = ({ item, index, onEnter }) => {
  const { topic, reading = [], videos = [], quizzes = [], assignments = [], coding = [] } = item
  const readingDone = reading.filter((r) => r.is_completed).length
  const videosDone = videos.filter((v) => v.is_completed).length
  const quizzesDone = quizzes.filter((q) => q.attempts_count > 0).length
  const assignmentsDone = assignments.filter((a) => a.is_completed).length
  const codingDone = coding.filter((c) => c.is_completed).length
  const total = reading.length + videos.length + quizzes.length + assignments.length + coding.length
  const done = readingDone + videosDone + quizzesDone + assignmentsDone + codingDone
  const progress = total > 0 ? Math.round((done / total) * 100) : 0

  const stats = [
    { icon: BookOpen, done: readingDone, total: reading.length, label: 'read' },
    { icon: PlayCircle, done: videosDone, total: videos.length, label: 'watched' },
    { icon: PenTool, done: quizzesDone, total: quizzes.length, label: 'quizzes' },
    { icon: Code2, done: codingDone, total: coding.length, label: 'coding' },
    { icon: ClipboardList, done: assignmentsDone, total: assignments.length, label: 'tasks' },
  ].filter((s) => s.total > 0)

  return (
    <div className="flex items-center gap-3 pl-4 pr-3 py-2.5 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-800/60 transition-colors">
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
        progress === 100
          ? 'bg-success-100 text-success-600 dark:bg-success-900/30'
          : 'bg-surface-100 text-surface-500 dark:bg-surface-700'
      }`}>
        {progress === 100 ? <CheckCircle2 size={15} /> : index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{topic.name}</p>
        {stats.length > 0 && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 text-[11px] text-surface-400">
            {stats.map((s, i) => {
              const Icon = s.icon
              return (
                <span key={i} className="flex items-center gap-1">
                  <Icon size={11} /> {s.done}/{s.total} {s.label}
                </span>
              )
            })}
          </div>
        )}
      </div>
      <span className="text-xs font-semibold text-surface-500 w-9 text-right flex-shrink-0">{progress}%</span>
      <button
        type="button"
        onClick={onEnter}
        className="btn-primary text-xs px-3 py-1.5 flex-shrink-0"
      >
        Enter
      </button>
    </div>
  )
}

/** Middle level: a chapter that expands to reveal its topics (lazy loaded). */
const ChapterRow = ({ chapter, index, courseColor, navigate }) => {
  const [open, setOpen] = useState(false)
  const { data, isLoading } = useQuery({
    queryKey: ['studyChapterDetail', chapter.id],
    queryFn: () => courseService.getStudyChapterDetail(chapter.id),
    enabled: open,
  })
  const topics = data?.topics || []

  return (
    <div className="border border-surface-100 dark:border-surface-700 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-surface-50 dark:hover:bg-surface-800/60 transition-colors"
      >
        <ChevronRight
          size={16}
          className={`text-surface-400 flex-shrink-0 transition-transform ${open ? 'rotate-90' : ''}`}
        />
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${
          chapter.progress === 100
            ? 'bg-success-100 text-success-600 dark:bg-success-900/30'
            : 'bg-surface-100 text-surface-500 dark:bg-surface-700'
        }`}>
          {chapter.progress === 100 ? <CheckCircle2 size={16} /> : index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{chapter.name}</p>
          <p className="text-xs text-surface-400 mt-0.5">
            {chapter.topics_count ?? '—'} topics
          </p>
        </div>
        <div className="w-28 hidden sm:block flex-shrink-0">
          <Bar value={chapter.progress} />
        </div>
        <span className="text-xs font-semibold text-surface-500 w-9 text-right flex-shrink-0">
          {chapter.progress}%
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-surface-100 dark:border-surface-700"
          >
            <div className="p-1.5 space-y-0.5">
              {isLoading ? (
                <div className="py-4"><Loading /></div>
              ) : topics.length === 0 ? (
                <p className="text-sm text-surface-400 px-4 py-3">No topics in this chapter yet.</p>
              ) : (
                topics.map((item, i) => (
                  <TopicRow
                    key={item.topic.id}
                    item={item}
                    index={i}
                    onEnter={() => navigate(`/study/chapter/${chapter.id}/topic/${item.topic.id}`)}
                  />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** Top level: a subject that expands to reveal its chapters (lazy loaded). */
const SubjectRow = ({ subject, defaultOpen, courseColor, navigate }) => {
  const [open, setOpen] = useState(defaultOpen)
  const { data, isLoading } = useQuery({
    queryKey: ['studyChapters', subject.id],
    queryFn: () => courseService.getStudyChapters(subject.id),
    enabled: open,
  })
  const chapters = data?.chapters || []
  const IconComp = iconMap[subject.icon] || BookOpen

  return (
    <div className="card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-4 p-4 text-left hover:bg-surface-50 dark:hover:bg-surface-800/40 transition-colors"
      >
        <ChevronDown
          size={20}
          className={`text-surface-400 flex-shrink-0 transition-transform ${open ? '' : '-rotate-90'}`}
        />
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${subject.color}18` }}
        >
          <IconComp size={24} style={{ color: subject.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold truncate">{subject.name}</h3>
          <p className="text-sm text-surface-500 mt-0.5">
            {subject.total_chapters} chapters · {subject.total_topics} topics
          </p>
        </div>
        <div className="w-40 hidden md:block flex-shrink-0">
          <Bar value={subject.progress} />
          <p className="text-[11px] text-surface-400 mt-1 text-right">
            {subject.completed_content}/{subject.total_content} completed
          </p>
        </div>
        <span className="text-lg font-bold w-12 text-right flex-shrink-0" style={{ color: subject.color }}>
          {subject.progress}%
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-surface-100 dark:border-surface-700"
          >
            <div className="p-3 space-y-2 bg-surface-50/50 dark:bg-surface-900/30">
              {isLoading ? (
                <div className="py-6"><Loading /></div>
              ) : chapters.length === 0 ? (
                <p className="text-sm text-surface-400 px-2 py-3">No chapters available yet.</p>
              ) : (
                chapters.map((chapter, i) => (
                  <ChapterRow
                    key={chapter.id}
                    chapter={chapter}
                    index={i}
                    courseColor={courseColor}
                    navigate={navigate}
                  />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const StudyCourse = () => {
  const navigate = useNavigate()
  const { courseId } = useParams()
  const { user, profile } = useAuthStore()
  const isAdmin = (user?.role || profile?.user?.role) === 'admin'

  const { data: studyData = { courses: [], pending: [] }, isLoading: coursesLoading } = useQuery({
    queryKey: ['studyCourses'],
    queryFn: () => courseService.getStudyCourses(),
  })
  const courses = studyData.courses || []
  const course = courses.find((c) => c.id === courseId)

  const { data: subjects, isLoading: subjectsLoading } = useQuery({
    queryKey: ['studySubjects', courseId],
    queryFn: () => courseService.getStudySubjects(courseId),
    enabled: !!courseId,
  })

  const { data: leaderboard = [] } = useQuery({
    queryKey: ['studyLeaderboard', 'course', courseId],
    queryFn: () => courseService.getStudyLeaderboard('course', courseId),
    enabled: !!courseId,
  })

  useEffect(() => {
    if (courseId) localStorage.setItem('study:lastCourseId', courseId)
  }, [courseId])

  // Course-wide completion summary aggregated from the subjects payload.
  const summary = useMemo(() => {
    const list = subjects || []
    const totals = list.reduce(
      (acc, s) => {
        acc.total += s.total_content || 0
        acc.done += s.completed_content || 0
        acc.reading.total += s.reading?.total || 0
        acc.reading.done += s.reading?.completed || 0
        acc.videos.total += s.videos?.total || 0
        acc.videos.done += s.videos?.completed || 0
        acc.quizzes.total += s.quizzes?.total || 0
        acc.quizzes.done += s.quizzes?.attempted || 0
        acc.coding.total += s.coding?.total || 0
        acc.coding.done += s.coding?.completed || 0
        acc.assignments.total += s.assignments?.total || 0
        acc.assignments.done += s.assignments?.completed || 0
        return acc
      },
      {
        total: 0, done: 0,
        reading: { total: 0, done: 0 }, videos: { total: 0, done: 0 },
        quizzes: { total: 0, done: 0 }, coding: { total: 0, done: 0 },
        assignments: { total: 0, done: 0 },
      },
    )
    const progress = totals.total > 0 ? Math.round((totals.done / totals.total) * 100) : 0
    const chapters = list.reduce((s, x) => s + (x.total_chapters || 0), 0)
    const topics = list.reduce((s, x) => s + (x.total_topics || 0), 0)
    return { ...totals, progress, subjects: list.length, chapters, topics }
  }, [subjects])

  if (coursesLoading) return <Loading fullScreen />

  const breakdown = [
    { icon: BookOpen, color: 'text-blue-500', label: 'Reading', ...summary.reading },
    { icon: PlayCircle, color: 'text-red-500', label: 'Videos', ...summary.videos },
    { icon: PenTool, color: 'text-green-500', label: 'Quizzes', ...summary.quizzes },
    { icon: Code2, color: 'text-primary-500', label: 'Coding', ...summary.coding },
    { icon: ClipboardList, color: 'text-purple-500', label: 'Assignments', ...summary.assignments },
  ].filter((b) => b.total > 0)

  return (
    <div className="space-y-6">
      {/* Banner */}
      {(() => {
        const color = course?.color || '#3B82F6'
        return (
          <div
            className="relative overflow-hidden rounded-3xl p-6 sm:p-8 text-white shadow-lg"
            style={{ background: `linear-gradient(135deg, ${shade(color, 25)} 0%, ${shade(color, -45)} 100%)` }}
          >
            {/* Decorative glow */}
            <div className="pointer-events-none absolute -top-16 -right-10 w-64 h-64 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-10 w-56 h-56 rounded-full bg-black/10 blur-2xl" />

            <div className="relative">
              <div className="flex items-start gap-4">
                <button
                  type="button"
                  onClick={() => navigate('/study')}
                  className="p-2 rounded-xl bg-white/15 hover:bg-white/25 transition-colors backdrop-blur-sm"
                  aria-label="Back to my courses"
                >
                  <ArrowLeft size={20} />
                </button>

                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {course?.thumbnail ? (
                    <img src={course.thumbnail} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <GraduationCap size={30} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl sm:text-3xl font-display font-bold leading-tight">
                      {course?.name || 'Course'}
                    </h1>
                    {course?.code && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm">
                        {course.code}
                      </span>
                    )}
                    {course?.course_type && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/15 backdrop-blur-sm capitalize">
                        {course.course_type}
                      </span>
                    )}
                  </div>
                  {course?.description ? (
                    <p className="text-white/80 text-sm mt-1.5 max-w-2xl line-clamp-2">
                      {course.description}
                    </p>
                  ) : (
                    <p className="text-white/80 text-sm mt-1.5">
                      Expand a subject to jump straight into any topic
                    </p>
                  )}
                </div>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => navigate(`/courses/${courseId}/manage`)}
                    className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 transition-colors backdrop-blur-sm font-medium flex-shrink-0"
                  >
                    <Settings2 size={16} /> <span className="hidden sm:inline">Manage</span>
                  </button>
                )}
              </div>

              {/* Quick stats */}
              <div className="mt-6 flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/15 backdrop-blur-sm">
                  <span className="text-lg font-bold">{summary.progress}%</span>
                  <span className="text-xs text-white/80">complete</span>
                </div>
                {[
                  { icon: GraduationCap, value: summary.subjects, label: 'Subjects' },
                  { icon: BookOpen, value: summary.chapters, label: 'Chapters' },
                  { icon: PenTool, value: summary.topics, label: 'Topics' },
                ].map((s) => {
                  const Icon = s.icon
                  return (
                    <div key={s.label} className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-sm">
                      <Icon size={15} className="text-white/80" />
                      <span className="text-sm font-semibold">{s.value}</span>
                      <span className="text-xs text-white/70">{s.label}</span>
                    </div>
                  )
                })}
              </div>

              {/* Progress bar */}
              <div className="mt-4 w-full h-2 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${summary.progress}%` }}
                  transition={{ duration: 0.9 }}
                  className="h-full rounded-full bg-white"
                />
              </div>
            </div>
          </div>
        )
      })()}

      {subjectsLoading ? (
        <Loading />
      ) : (!subjects || subjects.length === 0) ? (
        <div className="card p-8 text-center text-surface-500">
          <GraduationCap size={48} className="mx-auto mb-3 text-surface-300" />
          <p>No subjects configured for this course yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
          {/* Accordion */}
          <div className="space-y-3 order-1">
            {subjects.map((subject, index) => (
              <SubjectRow
                key={subject.id}
                subject={subject}
                defaultOpen={index === 0}
                courseColor={course?.color}
                navigate={navigate}
              />
            ))}
          </div>

          {/* Sidebar: completion summary + leaderboard */}
          <aside className="order-2 space-y-4 lg:sticky lg:top-6">
            {/* Completion summary */}
            <div className="card p-5">
              <h3 className="font-semibold mb-4">Course completion</h3>
              <div className="flex items-end justify-between mb-2">
                <span className="text-3xl font-bold" style={{ color: course?.color || undefined }}>
                  {summary.progress}%
                </span>
                <span className="text-xs text-surface-500">
                  {summary.done}/{summary.total} items
                </span>
              </div>
              <div className="w-full h-2.5 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${summary.progress}%` }}
                  transition={{ duration: 0.8 }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: course?.color || '#3B82F6' }}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                {[
                  { label: 'Subjects', value: summary.subjects },
                  { label: 'Chapters', value: summary.chapters },
                  { label: 'Topics', value: summary.topics },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl bg-surface-50 dark:bg-surface-800 py-2">
                    <p className="text-lg font-bold">{s.value}</p>
                    <p className="text-[11px] text-surface-500">{s.label}</p>
                  </div>
                ))}
              </div>

              {breakdown.length > 0 && (
                <div className="mt-4 pt-4 border-t border-surface-100 dark:border-surface-700 space-y-2">
                  {breakdown.map((b) => {
                    const Icon = b.icon
                    return (
                      <div key={b.label} className="flex items-center gap-2 text-sm">
                        <Icon size={14} className={b.color} />
                        <span className="flex-1 text-surface-500">{b.label}</span>
                        <span className="font-medium">{b.done}/{b.total}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Leaderboard by completion */}
            {leaderboard && leaderboard.length > 0 && (
              <div className="card p-5">
                <h3 className="font-semibold flex items-center gap-2 mb-4">
                  <Trophy size={18} className="text-warning-500" /> Course Leaderboard
                </h3>
                <ol className="space-y-1.5">
                  {leaderboard.slice(0, 8).map((entry) => (
                    <li
                      key={entry.rank}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl ${
                        entry.is_current_user
                          ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800'
                          : 'hover:bg-surface-50 dark:hover:bg-surface-800'
                      }`}
                    >
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        entry.rank === 1 ? 'bg-warning-100 text-warning-700 dark:bg-warning-900/30' :
                        entry.rank <= 3 ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/20' :
                        'bg-surface-100 text-surface-400 dark:bg-surface-800'
                      }`}>
                        {entry.rank}
                      </span>
                      <span className="font-medium text-sm truncate flex-1">{entry.student_name}</span>
                      <span className="text-xs font-semibold text-surface-500 flex-shrink-0">
                        {entry.completion}%
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  )
}

export default StudyCourse
