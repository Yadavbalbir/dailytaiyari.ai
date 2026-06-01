import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { examService } from '../services/examService'
import Loading from '../components/common/Loading'
import {
  BookOpen, PlayCircle, PenTool, ChevronRight, ArrowLeft,
  CheckCircle2, Trophy
} from 'lucide-react'

const StudyChapters = () => {
  const { subjectId } = useParams()
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['studyChapters', subjectId],
    queryFn: () => examService.getStudyChapters(subjectId),
    enabled: !!subjectId,
  })

  const { data: leaderboard } = useQuery({
    queryKey: ['studyLeaderboard', 'subject', subjectId],
    queryFn: () => examService.getStudyLeaderboard('subject', subjectId),
    enabled: !!subjectId,
  })

  if (isLoading) return <Loading fullScreen />

  const subject = data?.subject
  const chapters = data?.chapters || []
  const totalProgress = chapters.length > 0
    ? Math.round(chapters.reduce((s, c) => s + c.progress, 0) / chapters.length)
    : 0

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <button
          onClick={() => navigate('/study')}
          className="text-surface-500 hover:text-primary-600 flex items-center gap-1"
        >
          <ArrowLeft size={16} /> Study
        </button>
        <span className="text-surface-400">/</span>
        <span className="font-medium">{subject?.name}</span>
      </div>

      {/* Subject header */}
      <div className="card p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold">{subject?.name}</h1>
            <p className="text-surface-500 mt-1">
              {chapters.length} chapters
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold" style={{ color: subject?.color }}>
              {totalProgress}%
            </p>
            <p className="text-xs text-surface-500">Overall progress</p>
          </div>
        </div>
        <div className="mt-4 w-full h-2.5 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${totalProgress}%` }}
            transition={{ duration: 1 }}
            className="h-full rounded-full"
            style={{ backgroundColor: subject?.color }}
          />
        </div>
      </div>

      {/* Leaderboard teaser */}
      {leaderboard && leaderboard.length > 0 && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Trophy size={18} className="text-warning-500" /> Subject Leaderboard
            </h3>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
            {leaderboard.slice(0, 5).map((entry) => (
              <div
                key={entry.rank}
                className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${
                  entry.is_current_user
                    ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200'
                    : 'bg-surface-50 dark:bg-surface-800'
                }`}
              >
                <span className={`font-bold ${
                  entry.rank <= 3 ? 'text-warning-600' : 'text-surface-400'
                }`}>
                  #{entry.rank}
                </span>
                <span className="font-medium truncate max-w-[100px]">{entry.student_name}</span>
                <span className="text-xs text-surface-500">{entry.total_xp} XP</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chapters list */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Chapters</h2>
        {chapters.length === 0 ? (
          <div className="text-center py-12 text-surface-500">
            <BookOpen size={48} className="mx-auto mb-3 text-surface-300" />
            <p>No chapters available for this subject yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {chapters.map((chapter, index) => (
              <motion.div
                key={chapter.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => navigate(`/study/chapter/${chapter.id}`)}
                className="card p-4 cursor-pointer hover:border-primary-200 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-4">
                  {/* Chapter number */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0 ${
                    chapter.progress === 100
                      ? 'bg-success-100 text-success-600 dark:bg-success-900/30'
                      : 'bg-surface-100 text-surface-500 dark:bg-surface-700'
                  }`}>
                    {chapter.progress === 100 ? (
                      <CheckCircle2 size={24} />
                    ) : (
                      index + 1
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">{chapter.name}</h3>
                    </div>
                    {chapter.description && (
                      <p className="text-sm text-surface-500 mt-0.5 truncate">
                        {chapter.description}
                      </p>
                    )}

                    {/* Stats row */}
                    <div className="flex items-center gap-4 mt-2 text-xs text-surface-400">
                      <span className="flex items-center gap-1">
                        <BookOpen size={12} />
                        {chapter.reading.completed}/{chapter.reading.total} read
                      </span>
                      <span className="flex items-center gap-1">
                        <PlayCircle size={12} />
                        {chapter.videos.completed}/{chapter.videos.total} watched
                      </span>
                      <span className="flex items-center gap-1">
                        <PenTool size={12} />
                        {chapter.quizzes.attempted}/{chapter.quizzes.total} quizzes
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-2 w-full h-1.5 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          chapter.progress >= 80 ? 'bg-success-500' :
                          chapter.progress >= 40 ? 'bg-primary-500' :
                          chapter.progress > 0 ? 'bg-warning-500' :
                          'bg-surface-200'
                        }`}
                        style={{ width: `${chapter.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-sm font-semibold">{chapter.progress}%</span>
                    <ChevronRight
                      size={18}
                      className="text-surface-300 group-hover:text-primary-500 transition-colors"
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default StudyChapters
