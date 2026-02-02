import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { quizService } from '../services/quizService'
import Loading from '../components/common/Loading'

const Quiz = () => {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')
  
  const { data: quizzes, isLoading } = useQuery({
    queryKey: ['quizzes', filter],
    queryFn: () => quizService.getQuizzes(filter !== 'all' ? { quiz_type: filter } : {}),
  })

  const { data: dailyChallenge } = useQuery({
    queryKey: ['dailyChallenge'],
    queryFn: () => quizService.getDailyChallenge(),
  })

  const { data: recentAttempts } = useQuery({
    queryKey: ['recentAttempts'],
    queryFn: () => quizService.getRecentAttempts(),
  })

  const quizTypes = [
    { value: 'all', label: 'All Quizzes' },
    { value: 'topic', label: 'Topic-wise' },
    { value: 'subject', label: 'Subject-wise' },
    { value: 'daily', label: 'Daily Challenges' },
    { value: 'pyq', label: 'PYQ' },
  ]

  const handleStartQuiz = async (quizId) => {
    try {
      await quizService.startQuiz(quizId)
      navigate(`/quiz/${quizId}`)
    } catch (error) {
      console.error('Failed to start quiz:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold">Practice Quiz</h1>
        <p className="text-surface-500 mt-1">Test your knowledge and earn XP</p>
      </div>

      {/* Daily Challenge Banner */}
      {dailyChallenge && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6 bg-gradient-to-r from-primary-500 to-accent-500 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-medium">
                  🎯 Daily Challenge
                </span>
                <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-medium">
                  +{dailyChallenge.total_marks * 5} XP
                </span>
                {dailyChallenge.user_attempt_info?.attempted && (
                  <span className="px-2 py-0.5 bg-white/30 rounded-full text-xs font-medium">
                    ✅ Best: {Math.round(dailyChallenge.user_attempt_info.best_score)}%
                  </span>
                )}
              </div>
              <h2 className="text-xl font-semibold">{dailyChallenge.title}</h2>
              <p className="text-white/80 mt-1">
                {dailyChallenge.questions_count} questions • {dailyChallenge.duration_minutes} minutes
              </p>
            </div>
            <div className="flex gap-2">
              {dailyChallenge.user_attempt_info?.attempted && (
                <button 
                  onClick={() => navigate(`/quiz/review/${dailyChallenge.user_attempt_info.best_attempt_id}`)}
                  className="btn bg-white/20 text-white hover:bg-white/30"
                >
                  View Result
                </button>
              )}
              <button 
                onClick={() => handleStartQuiz(dailyChallenge.id)}
                className="btn bg-white text-primary-600 hover:bg-white/90"
              >
                {dailyChallenge.user_attempt_info?.attempted ? 'Retry' : 'Start Now'}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {quizTypes.map((type) => (
          <button
            key={type.value}
            onClick={() => setFilter(type.value)}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
              filter === type.value
                ? 'bg-primary-500 text-white'
                : 'bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* Quiz Grid */}
      {isLoading ? (
        <Loading />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(quizzes?.results || quizzes || []).map((quiz) => {
            const attemptInfo = quiz.user_attempt_info
            const hasAttempted = attemptInfo?.attempted
            
            return (
              <motion.div
                key={quiz.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                className={`card p-5 ${hasAttempted ? 'ring-2 ring-primary-200 dark:ring-primary-800' : ''}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">
                      {quiz.quiz_type === 'topic' ? '📖' : 
                       quiz.quiz_type === 'subject' ? '📚' :
                       quiz.quiz_type === 'pyq' ? '📜' : '✍️'}
                    </span>
                    <span className={`badge ${
                      quiz.quiz_type === 'daily' ? 'badge-primary' :
                      quiz.quiz_type === 'pyq' ? 'badge-warning' : 'badge-success'
                    }`}>
                      {quiz.quiz_type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasAttempted && (
                      <span className={`badge ${
                        attemptInfo.best_score >= 70 ? 'badge-success' :
                        attemptInfo.best_score >= 40 ? 'badge-warning' : 'badge-error'
                      }`}>
                        Best: {Math.round(attemptInfo.best_score)}%
                      </span>
                    )}
                    {quiz.is_free && !hasAttempted && (
                      <span className="badge-success">Free</span>
                    )}
                  </div>
                </div>

                <h3 className="font-semibold mb-2 line-clamp-2">{quiz.title}</h3>
                
                <div className="flex items-center gap-4 text-sm text-surface-500 mb-4">
                  <span>{quiz.questions_count} Qs</span>
                  <span>•</span>
                  <span>{quiz.duration_minutes} min</span>
                  <span>•</span>
                  <span>{quiz.total_marks} marks</span>
                  {hasAttempted && (
                    <>
                      <span>•</span>
                      <span className="text-primary-500">{attemptInfo.attempts_count} attempt{attemptInfo.attempts_count > 1 ? 's' : ''}</span>
                    </>
                  )}
                </div>

                {hasAttempted ? (
                  <div className="flex items-center justify-between gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/quiz/review/${attemptInfo.best_attempt_id}`)
                      }}
                      className="btn-secondary text-sm px-4 py-2 flex-1"
                    >
                      View Result
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        handleStartQuiz(quiz.id)
                      }}
                      className="btn-primary text-sm px-4 py-2 flex-1"
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <span className="text-surface-500">Avg Score: </span>
                      <span className="font-medium">{Math.round(quiz.average_score || 0)}%</span>
                    </div>
                    <button 
                      onClick={() => handleStartQuiz(quiz.id)}
                      className="btn-primary text-sm px-4 py-2"
                    >
                      Start Quiz
                    </button>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Recent Attempts */}
      {recentAttempts?.length > 0 && (
        <div className="card p-5">
          <h3 className="font-semibold mb-4">Recent Attempts</h3>
          <div className="space-y-3">
            {recentAttempts.slice(0, 5).map((attempt) => (
              <div
                key={attempt.id}
                className="flex items-center justify-between p-3 rounded-xl bg-surface-50 dark:bg-surface-800"
              >
                <div>
                  <p className="font-medium">{attempt.quiz_title}</p>
                  <p className="text-sm text-surface-500">
                    {new Date(attempt.completed_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className={`font-bold ${
                      attempt.percentage >= 70 ? 'text-success-500' :
                      attempt.percentage >= 40 ? 'text-warning-500' : 'text-error-500'
                    }`}>
                      {Math.round(attempt.percentage)}%
                    </p>
                    <p className="text-sm text-surface-500">
                      {attempt.correct_answers}/{attempt.total_questions}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/quiz/review/${attempt.id}`)}
                      className="btn-secondary text-xs px-3 py-1.5"
                    >
                      View Result
                    </button>
                    <button
                      onClick={() => handleStartQuiz(attempt.quiz)}
                      className="btn-primary text-xs px-3 py-1.5"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Quiz

