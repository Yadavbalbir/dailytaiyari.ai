import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { courseService } from '../services/courseService'
import { useAuthStore } from '../context/authStore'
import Loading from '../components/common/Loading'
import {
  BookOpen, Atom, FlaskConical, Calculator, Leaf, Bug,
  ChevronRight, GraduationCap, ArrowLeft, Settings2,
  PlayCircle, PenTool, ClipboardList, Code2
} from 'lucide-react'

const iconMap = {
  'atom': Atom,
  'flask-conical': FlaskConical,
  'calculator': Calculator,
  'leaf': Leaf,
  'bug': Bug,
}

const StudyCourse = () => {
  const navigate = useNavigate()
  const { courseId } = useParams()
  const { user, profile } = useAuthStore()
  const isAdmin = (user?.role || profile?.user?.role) === 'admin'

  // Enrolled courses — used to resolve the course header and to guard access.
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

  useEffect(() => {
    if (courseId) localStorage.setItem('study:lastCourseId', courseId)
  }, [courseId])

  if (coursesLoading) return <Loading fullScreen />

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/study')}
          className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
          aria-label="Back to my courses"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-display font-bold" style={{ color: course?.color || undefined }}>
            {course?.name || 'Course'}
          </h1>
          <p className="text-surface-500 mt-1">Choose a subject to start learning</p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={() => navigate(`/courses/${courseId}/manage`)}
            className="ml-auto btn-secondary text-sm px-3 py-2"
          >
            <Settings2 size={16} /> <span className="hidden sm:inline">Manage course</span>
          </button>
        )}
      </div>

      {subjectsLoading ? (
        <Loading />
      ) : (!subjects || subjects.length === 0) ? (
        <div className="card p-8 text-center text-surface-500">
          <GraduationCap size={48} className="mx-auto mb-3 text-surface-300" />
          <p>No subjects configured for this course yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {subjects.map((subject, index) => {
            const IconComp = iconMap[subject.icon] || BookOpen
            return (
              <motion.div
                key={subject.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.07 }}
                onClick={() => navigate(`/study/${subject.id}`)}
                className="card p-5 cursor-pointer hover:border-primary-300 hover:shadow-lg transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: `${subject.color}18` }}
                  >
                    <IconComp size={28} style={{ color: subject.color }} />
                  </div>
                  <ChevronRight
                    size={20}
                    className="text-surface-300 group-hover:text-primary-500 transition-colors mt-1"
                  />
                </div>

                <h3 className="text-lg font-semibold">{subject.name}</h3>
                <p className="text-sm text-surface-500 mt-1">
                  {subject.total_chapters} chapters · {subject.total_topics} topics
                </p>

                <div className="mt-4">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-surface-500">Progress</span>
                    <span className="font-semibold" style={{ color: subject.color }}>
                      {subject.progress}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${subject.progress}%` }}
                      transition={{ duration: 0.8, delay: index * 0.1 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: subject.color }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 text-xs text-surface-400">
                  <span>{subject.completed_content}/{subject.total_content} completed</span>
                  {subject.total_content > subject.completed_content && (
                    <span className="text-surface-400">
                      {subject.total_content - subject.completed_content} left
                    </span>
                  )}
                </div>

                {/* Content breakdown — only show categories that have content */}
                {(() => {
                  const stats = [
                    { icon: BookOpen, color: 'text-blue-500', done: subject.reading?.completed ?? 0, total: subject.reading?.total ?? 0, label: 'read' },
                    { icon: PlayCircle, color: 'text-red-500', done: subject.videos?.completed ?? 0, total: subject.videos?.total ?? 0, label: 'watched' },
                    { icon: PenTool, color: 'text-green-500', done: subject.quizzes?.attempted ?? 0, total: subject.quizzes?.total ?? 0, label: 'quizzes' },
                    { icon: Code2, color: 'text-primary-500', done: subject.coding?.completed ?? 0, total: subject.coding?.total ?? 0, label: 'coding' },
                    { icon: ClipboardList, color: 'text-purple-500', done: subject.assignments?.completed ?? 0, total: subject.assignments?.total ?? 0, label: 'tasks' },
                  ].filter((s) => s.total > 0)
                  if (!stats.length) return null
                  return (
                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-surface-100 dark:border-surface-700 text-xs text-surface-500">
                      {stats.map((s, i) => {
                        const Icon = s.icon
                        return (
                          <span key={i} className="flex items-center gap-1.5">
                            <Icon size={13} className={s.color} />
                            {s.done}/{s.total} {s.label}
                          </span>
                        )
                      })}
                    </div>
                  )
                })()}
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default StudyCourse
