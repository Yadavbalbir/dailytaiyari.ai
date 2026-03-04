import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { examService } from '../services/examService'
import Loading from '../components/common/Loading'
import {
  BookOpen, PlayCircle, PenTool, ArrowLeft, ChevronRight, Clock,
} from 'lucide-react'

/**
 * Lists all topics in a chapter. Clicking a topic goes to topic content (notes & quizzes).
 * Flow: Study → Subject → Chapters → [this page: Topics] → Topic content
 */
const StudyChapterTopics = () => {
  const { chapterId } = useParams()
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['studyChapterDetail', chapterId],
    queryFn: () => examService.getStudyChapterDetail(chapterId),
    enabled: !!chapterId,
  })

  if (isLoading) return <Loading fullScreen />

  const chapter = data?.chapter
  const topics = data?.topics || []

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
        <span className="font-medium">{chapter?.name}</span>
      </div>

      {/* Chapter header */}
      <div className="card p-6">
        <h1 className="text-2xl font-display font-bold">{chapter?.name}</h1>
        {chapter?.description && (
          <p className="text-surface-500 mt-1">{chapter.description}</p>
        )}
        <p className="text-sm text-surface-500 mt-2">
          {topics.length} topic{topics.length !== 1 ? 's' : ''} in this chapter · Select a topic to view notes and quizzes
        </p>
        <div className="flex items-center gap-2 mt-3 text-sm text-surface-500">
          <Clock size={16} />
          Est. {chapter?.estimated_hours}h
        </div>
      </div>

      {/* Topics list */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Topics</h2>
        {topics.length === 0 ? (
          <div className="card p-8 text-center text-surface-500">
            <p>No topics in this chapter yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {topics.map((item, index) => {
              const { topic, reading = [], videos = [], quizzes = [] } = item
              const readingDone = reading.filter(r => r.is_completed).length
              const videosDone = videos.filter(v => v.is_completed).length
              const quizzesAttempted = quizzes.filter(q => q.attempts_count > 0).length
              const total = reading.length + videos.length + quizzes.length
              const completed = readingDone + videosDone + quizzesAttempted
              const progress = total > 0 ? Math.round((completed / total) * 100) : 0

              return (
                <motion.div
                  key={topic.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => navigate(`/study/chapter/${chapterId}/topic/${topic.id}`)}
                  className="card p-4 flex items-center gap-4 cursor-pointer hover:border-primary-200 hover:shadow-md transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 font-semibold text-sm flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{topic.name}</h3>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-surface-500">
                      <span className="flex items-center gap-1">
                        <BookOpen size={12} />
                        {readingDone}/{reading.length} read
                      </span>
                      <span className="flex items-center gap-1">
                        <PlayCircle size={12} />
                        {videosDone}/{videos.length} watched
                      </span>
                      <span className="flex items-center gap-1">
                        <PenTool size={12} />
                        {quizzesAttempted}/{quizzes.length} quizzes
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="w-16 text-right">
                      <span className="text-sm font-semibold">{progress}%</span>
                    </div>
                    <ChevronRight size={20} className="text-surface-400 group-hover:text-primary-500" />
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default StudyChapterTopics
