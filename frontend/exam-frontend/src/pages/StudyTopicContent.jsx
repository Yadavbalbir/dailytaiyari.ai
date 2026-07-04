import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { courseService } from '../services/courseService'
import Loading from '../components/common/Loading'
import {
  BookOpen, PlayCircle, PenTool, ArrowLeft, CheckCircle2, Clock,
  Bookmark, FileText, RefreshCw, BarChart3, Eye, Star, LayoutList,
  Circle, ChevronRight, Trophy
} from 'lucide-react'

const TABS = [
  { key: 'all', label: 'All', icon: LayoutList },
  { key: 'reading', label: 'Reading', icon: BookOpen },
  { key: 'videos', label: 'Videos', icon: PlayCircle },
  { key: 'quizzes', label: 'Quizzes', icon: PenTool },
]

/**
 * Shows notes and quizzes for a single topic within a chapter.
 * Flow: Study → Subject → Chapters → Topics → [this page: topic content]
 */
const StudyTopicContent = () => {
  const { chapterId, topicId } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('all')

  const { data, isLoading } = useQuery({
    queryKey: ['studyChapterDetail', chapterId],
    queryFn: () => courseService.getStudyChapterDetail(chapterId),
    enabled: !!chapterId,
  })

  if (isLoading) return <Loading fullScreen />

  const chapter = data?.chapter
  const topics = data?.topics || []
  const topicData = topics.find(t => t.topic.id === topicId)
  const topic = topicData?.topic
  const reading = topicData?.reading || []
  const videos = topicData?.videos || []
  const quizzes = topicData?.quizzes || []

  if (!topic) {
    return (
      <div className="card p-8 text-center">
        <p className="text-surface-500">Topic not found.</p>
        <button
          onClick={() => navigate(`/study/chapter/${chapterId}`)}
          className="btn-outline mt-4"
        >
          Back to topics
        </button>
      </div>
    )
  }

  const readingDone = reading.filter(r => r.is_completed).length
  const videosDone = videos.filter(v => v.is_completed).length
  const quizzesAttempted = quizzes.filter(q => q.attempts_count > 0).length

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm flex-wrap">
        <button
          onClick={() => navigate('/study')}
          className="text-surface-500 hover:text-primary-600 flex items-center gap-1"
        >
          <ArrowLeft size={16} /> Study
        </button>
        <span className="text-surface-400">/</span>
        <button
          onClick={() => navigate(`/study/${chapter?.subject_id}`)}
          className="text-surface-500 hover:text-primary-600"
        >
          {chapter?.subject_name}
        </button>
        <span className="text-surface-400">/</span>
        <button
          onClick={() => navigate(`/study/chapter/${chapterId}`)}
          className="text-surface-500 hover:text-primary-600"
        >
          {chapter?.name}
        </button>
        <span className="text-surface-400">/</span>
        <span className="font-medium">{topic.name}</span>
      </div>

      {/* Topic header */}
      <div className="card p-6">
        <h1 className="text-2xl font-display font-bold">{topic.name}</h1>
        <p className="text-surface-500 text-sm mt-1">
          Notes and quizzes for this topic
        </p>
        <div className="flex flex-wrap items-center gap-5 mt-4 text-sm text-surface-500">
          <span className="flex items-center gap-1.5">
            <BookOpen size={16} className="text-blue-500" />
            {readingDone}/{reading.length} read
          </span>
          <span className="flex items-center gap-1.5">
            <PlayCircle size={16} className="text-red-500" />
            {videosDone}/{videos.length} watched
          </span>
          <span className="flex items-center gap-1.5">
            <PenTool size={16} className="text-green-500" />
            {quizzesAttempted}/{quizzes.length} quizzes
          </span>
          {topic.estimated_study_hours > 0 && (
            <span className="flex items-center gap-1.5">
              <Clock size={16} className="text-warning-500" />
              Est. {topic.estimated_study_hours}h
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-100 dark:bg-surface-800 rounded-xl overflow-x-auto scrollbar-hide">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const count = tab.key === 'all' ? reading.length + videos.length + quizzes.length
            : tab.key === 'reading' ? reading.length
            : tab.key === 'videos' ? videos.length
            : tab.key === 'quizzes' ? quizzes.length
            : 0
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 min-w-[100px] flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-white dark:bg-surface-700 shadow-sm text-primary-600'
                  : 'text-surface-500 hover:text-surface-700'
              }`}
            >
              <Icon size={16} />
              {tab.label}
              <span className="text-xs bg-surface-200 dark:bg-surface-600 px-1.5 py-0.5 rounded-full">
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'all' && <AllTab reading={reading} videos={videos} quizzes={quizzes} navigate={navigate} />}
          {activeTab === 'reading' && <ReadingTab items={reading} navigate={navigate} />}
          {activeTab === 'videos' && <VideosTab items={videos} navigate={navigate} />}
          {activeTab === 'quizzes' && <QuizzesTab items={quizzes} navigate={navigate} />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// ── Tab components ───────────────────────────────────────────────────────

const EmptyState = ({ icon: Icon, message }) => (
  <div className="text-center py-12 text-surface-500">
    <Icon size={48} className="mx-auto mb-3 text-surface-300" />
    <p>{message}</p>
  </div>
)

// Shared type metadata for the unified list view
const READ_TYPE = {
  notes: { icon: FileText, color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30', label: 'Notes' },
  pdf: { icon: FileText, color: 'bg-green-50 text-green-600 dark:bg-green-900/30', label: 'PDF' },
  revision: { icon: RefreshCw, color: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30', label: 'Revision' },
  formula: { icon: BarChart3, color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30', label: 'Formulas' },
}

const StatusPill = ({ tone, icon: Icon, label }) => {
  const tones = {
    success: 'bg-success-50 text-success-700 dark:bg-success-900/30 dark:text-success-300',
    progress: 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300',
    score: 'bg-warning-50 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300',
    idle: 'bg-surface-100 text-surface-500 dark:bg-surface-700 dark:text-surface-400',
  }
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${tones[tone]}`}>
      {Icon && <Icon size={12} />}
      {label}
    </span>
  )
}

const AllTab = ({ reading, videos, quizzes, navigate }) => {
  // Reading + videos share a real `order`; interleave them, quizzes go last.
  const materials = [...reading, ...videos]
    .map(item => ({ ...item, _kind: item.content_type === 'video' ? 'video' : 'reading' }))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  const rows = [
    ...materials,
    ...quizzes.map(q => ({ ...q, _kind: 'quiz' })),
  ]

  if (rows.length === 0) {
    return <EmptyState icon={LayoutList} message="No content has been added to this topic yet" />
  }

  return (
    <div className="card divide-y divide-surface-100 dark:divide-surface-700 overflow-hidden">
      {rows.map((item, idx) => {
        const isQuiz = item._kind === 'quiz'
        const isVideo = item._kind === 'video'

        let cfg
        if (isQuiz) cfg = { icon: PenTool, color: 'bg-green-50 text-green-600 dark:bg-green-900/30', label: 'Quiz' }
        else if (isVideo) cfg = { icon: PlayCircle, color: 'bg-red-50 text-red-600 dark:bg-red-900/30', label: 'Video' }
        else cfg = READ_TYPE[item.content_type] || READ_TYPE.notes
        const Icon = cfg.icon

        // Status
        let status
        if (isQuiz) {
          status = item.attempts_count > 0
            ? <StatusPill tone="score" icon={Trophy} label={`Best ${Math.round(item.best_score)}%`} />
            : <StatusPill tone="idle" icon={Circle} label="Not attempted" />
        } else if (item.is_completed) {
          status = <StatusPill tone="success" icon={CheckCircle2} label={isVideo ? 'Watched' : 'Completed'} />
        } else if (isVideo && item.progress_percentage > 0) {
          status = <StatusPill tone="progress" icon={PlayCircle} label={`${Math.round(item.progress_percentage)}%`} />
        } else {
          status = <StatusPill tone="idle" icon={Circle} label="Not started" />
        }

        // Meta line
        const meta = []
        if (isQuiz) {
          meta.push(`${item.total_questions} Qs`)
          if (item.duration_minutes) meta.push(`${item.duration_minutes}m`)
          if (item.attempts_count > 0) meta.push(`${item.attempts_count} attempt${item.attempts_count > 1 ? 's' : ''}`)
        } else if (isVideo) {
          if (item.video_duration_minutes) meta.push(`${item.video_duration_minutes} min`)
          meta.push(`${item.views_count || 0} views`)
        } else {
          if (item.estimated_time_minutes) meta.push(`${item.estimated_time_minutes} min read`)
        }

        const onClick = () => {
          if (isQuiz) navigate(`/quiz/${item.id}`)
          else navigate(`/content/${item.id}`)
        }

        return (
          <motion.button
            key={`${item._kind}-${item.id}`}
            onClick={onClick}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: idx * 0.02 }}
            className="w-full flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-3.5 text-left hover:bg-surface-50 dark:hover:bg-surface-800/60 transition-colors group"
          >
            <span className="hidden sm:flex w-6 shrink-0 justify-center text-xs font-medium text-surface-400 tabular-nums">
              {idx + 1}
            </span>
            <span className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${cfg.color}`}>
              <Icon size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-sm truncate">{item.title}</h4>
                {item.is_bookmarked && <Bookmark size={13} className="shrink-0 text-warning-500 fill-warning-500" />}
              </div>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-surface-400">
                <span className="font-medium text-surface-500">{cfg.label}</span>
                {meta.length > 0 && <span className="text-surface-300">•</span>}
                <span className="truncate flex items-center gap-1"><Clock size={10} /> {meta.join(' · ')}</span>
              </div>
            </div>
            {status}
            <ChevronRight size={18} className="shrink-0 text-surface-300 group-hover:text-primary-500 transition-colors" />
          </motion.button>
        )
      })}
    </div>
  )
}

const ReadingTab = ({ items, navigate }) => {
  if (items.length === 0) {
    return <EmptyState icon={BookOpen} message="No reading materials available yet" />
  }
  const typeConfig = {
    notes: { icon: FileText, color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30', label: 'Notes' },
    pdf: { icon: FileText, color: 'bg-green-50 text-green-600 dark:bg-green-900/30', label: 'PDF' },
    revision: { icon: RefreshCw, color: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30', label: 'Revision' },
    formula: { icon: BarChart3, color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30', label: 'Formulas' },
  }
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {items.map((item) => {
        const cfg = typeConfig[item.content_type] || typeConfig.notes
        const Icon = cfg.icon
        return (
          <motion.div
            key={item.id}
            whileHover={{ y: -4 }}
            onClick={() => navigate(`/content/${item.id}`)}
            className={`card p-4 cursor-pointer transition-all relative overflow-hidden ${
              item.is_completed ? 'border-success-200 dark:border-success-800' : 'hover:border-primary-200'
            }`}
          >
            {item.is_completed && (
              <div className="absolute top-2 right-2">
                <CheckCircle2 size={18} className="text-success-500" />
              </div>
            )}
            {item.is_bookmarked && (
              <div className="absolute top-2 left-2">
                <Bookmark size={14} className="text-warning-500 fill-warning-500" />
              </div>
            )}
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${cfg.color}`}>
              <Icon size={24} />
            </div>
            <h4 className="font-medium text-sm leading-snug line-clamp-2 mb-1.5">{item.title}</h4>
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-surface-100 dark:border-surface-700">
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-surface-100 dark:bg-surface-700 text-surface-500">
                {cfg.label}
              </span>
              <span className="text-[10px] text-surface-400 flex items-center gap-1">
                <Clock size={10} /> {item.estimated_time_minutes}m
              </span>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

const VideosTab = ({ items, navigate }) => {
  if (items.length === 0) {
    return <EmptyState icon={PlayCircle} message="No videos available yet" />
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {items.map((item) => (
        <div
          key={item.id}
          onClick={() => navigate(`/content/${item.id}`)}
          className="card overflow-hidden cursor-pointer hover:border-primary-200 hover:shadow-md transition-all"
        >
          <div className="relative bg-surface-100 dark:bg-surface-800 h-36 flex items-center justify-center">
            <PlayCircle size={48} className="text-surface-300" />
            {item.is_completed && (
              <div className="absolute top-2 right-2 bg-success-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                <CheckCircle2 size={12} /> Watched
              </div>
            )}
            {item.video_duration_minutes && (
              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                {item.video_duration_minutes} min
              </div>
            )}
            {item.progress_percentage > 0 && item.progress_percentage < 100 && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-surface-200">
                <div className="h-full bg-primary-500" style={{ width: `${item.progress_percentage}%` }} />
              </div>
            )}
          </div>
          <div className="p-3">
            <h4 className="font-medium text-sm truncate">{item.title}</h4>
            <p className="text-xs text-surface-500 mt-0.5 flex items-center gap-2">
              <span className="flex items-center gap-0.5"><Eye size={10} /> {item.views_count}</span>
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

const QuizzesTab = ({ items, navigate }) => {
  if (items.length === 0) {
    return <EmptyState icon={PenTool} message="No practice quizzes available yet" />
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((quiz) => (
        <motion.div
          key={quiz.id}
          whileHover={{ y: -4 }}
          className={`card p-4 transition-all relative overflow-hidden ${
            quiz.attempts_count > 0 ? 'border-primary-100 dark:border-primary-900' : 'hover:border-primary-200'
          }`}
        >
          {quiz.attempts_count > 0 && (
            <div className="absolute top-3 right-3 flex items-center gap-1">
              <Star size={14} className="text-warning-500 fill-warning-500" />
              <span className="font-bold text-xs">{Math.round(quiz.best_score)}%</span>
            </div>
          )}
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${
            quiz.attempts_count > 0 ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30' : 'bg-green-50 text-green-600 dark:bg-green-900/30'
          }`}>
            <PenTool size={22} />
          </div>
          <h4 className="font-semibold text-sm leading-snug line-clamp-2 mb-1">{quiz.title}</h4>
          <div className="flex items-center gap-3 text-[11px] text-surface-500 mb-3">
            <span>{quiz.total_questions} Qs</span>
            <span className="flex items-center gap-0.5"><Clock size={10} /> {quiz.duration_minutes}m</span>
            {quiz.attempts_count > 0 && (
              <span>{quiz.attempts_count} attempt{quiz.attempts_count > 1 ? 's' : ''}</span>
            )}
          </div>
          {quiz.attempts_count > 0 && quiz.last_attempt && (
            <div className="text-[10px] text-surface-400 mb-3 p-1.5 bg-surface-50 dark:bg-surface-800 rounded">
              Last: {Math.round(quiz.last_attempt.percentage)}% ({quiz.last_attempt.correct_answers}/{quiz.last_attempt.total_questions})
            </div>
          )}
          <div className="flex gap-2 mt-auto">
            {quiz.attempts_count > 0 ? (
              <>
                <button onClick={() => navigate(`/quiz/${quiz.id}`)} className="flex-1 btn-primary text-xs py-1.5">Retry</button>
                <button onClick={() => navigate(`/quiz/review/${quiz.last_attempt?.id}`)} className="flex-1 btn-outline text-xs py-1.5">Review</button>
              </>
            ) : (
              <button onClick={() => navigate(`/quiz/${quiz.id}`)} className="flex-1 btn-primary text-xs py-1.5">Start Quiz</button>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  )
}

export default StudyTopicContent
