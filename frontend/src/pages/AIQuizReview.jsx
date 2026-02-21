import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { chatService } from '../services/chatService'
import Loading from '../components/common/Loading'
import MathRenderer from '../components/chat/MathRenderer'
import {
  CheckCircle2,
  XCircle,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
  Clock,
  Target,
  Zap,
  Award
} from 'lucide-react'

const AIQuizReview = () => {
  const { attemptId } = useParams()
  const navigate = useNavigate()
  const [currentIndex, setCurrentIndex] = useState(0)

  const { data: attempt, isLoading, error } = useQuery({
    queryKey: ['aiQuizReview', attemptId],
    queryFn: () => chatService.getAIQuizReview(attemptId),
  })

  if (isLoading) return <Loading fullScreen />

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="flex justify-center mb-4 text-error-500">
          <XCircle size={64} />
        </div>
        <h3 className="text-xl font-semibold mb-2">Quiz Not Found</h3>
        <p className="text-surface-500 mb-4">This quiz attempt doesn't exist or you don't have access.</p>
        <button onClick={() => navigate('/ai-learning')} className="btn-primary flex items-center gap-2 mx-auto">
          <ChevronLeft size={18} /> Back to AI Learning
        </button>
      </div>
    )
  }

  const questions = attempt?.questions || []
  const currentQuestion = questions[currentIndex]
  const totalQuestions = questions.length

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }
  }

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(prev => prev + 1)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate('/ai-learning')}
            className="text-sm text-surface-500 hover:text-primary-600 mb-2 flex items-center gap-1"
          >
            <ChevronLeft size={16} /> Back to AI Learning
          </button>
          <h1 className="text-2xl font-display font-bold">
            {attempt?.quiz_topic || 'AI Quiz Review'}
          </h1>
          <p className="text-surface-500 mt-1">
            {attempt?.quiz_subject && `${attempt.quiz_subject} • `}
            Taken on {new Date(attempt?.created_at).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Score Summary */}
      <div className="card p-6 bg-gradient-to-r from-primary-50 to-violet-50 dark:from-primary-900/20 dark:to-violet-900/20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className={`text-3xl font-bold ${attempt?.percentage >= 80 ? 'text-success-600' :
                attempt?.percentage >= 60 ? 'text-warning-600' :
                  'text-error-600'
              }`}>
              {Math.round(attempt?.percentage || 0)}%
            </p>
            <p className="text-sm text-surface-500">Score</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-success-600">
              {attempt?.correct_answers || 0}
            </p>
            <p className="text-sm text-surface-500">Correct</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-error-600">
              {attempt?.wrong_answers || 0}
            </p>
            <p className="text-sm text-surface-500">Wrong</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-violet-600">
              +{attempt?.xp_earned || 0}
            </p>
            <p className="text-sm text-surface-500">XP Earned</p>
          </div>
        </div>
      </div>

      {/* Question Navigation */}
      <div className="flex flex-wrap gap-2">
        {questions.map((q, idx) => (
          <button
            key={q.id || idx}
            onClick={() => setCurrentIndex(idx)}
            className={`w-10 h-10 rounded-lg font-semibold text-sm transition-colors ${idx === currentIndex
                ? 'bg-primary-500 text-white'
                : q.is_correct
                  ? 'bg-success-100 text-success-700 dark:bg-success-900/50'
                  : 'bg-error-100 text-error-700 dark:bg-error-900/50'
              }`}
          >
            {idx + 1}
          </button>
        ))}
      </div>

      {/* Current Question */}
      {currentQuestion && (
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-surface-500">
              Question {currentIndex + 1} of {totalQuestions}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5 ${currentQuestion.is_correct
                ? 'bg-success-100 text-success-700'
                : 'bg-error-100 text-error-700'
              }`}>
              {currentQuestion.is_correct ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
              {currentQuestion.is_correct ? 'Correct' : 'Incorrect'}
            </span>
          </div>

          <div className="text-lg font-medium mb-6">
            <MathRenderer content={currentQuestion.question_text} />
          </div>

          <div className="space-y-3">
            {currentQuestion.options?.map((option, optIdx) => {
              const isCorrect = optIdx === currentQuestion.correct_option
              const isUserAnswer = optIdx === currentQuestion.user_answer
              const wasWrong = isUserAnswer && !isCorrect

              return (
                <div
                  key={optIdx}
                  className={`p-4 rounded-xl border-2 ${isCorrect
                      ? 'bg-success-50 border-success-300 dark:bg-success-900/20 dark:border-success-700'
                      : wasWrong
                        ? 'bg-error-50 border-error-300 dark:bg-error-900/20 dark:border-error-700'
                        : 'border-surface-200 dark:border-surface-700'
                    }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${isCorrect
                        ? 'bg-success-500 text-white'
                        : wasWrong
                          ? 'bg-error-500 text-white'
                          : 'bg-surface-200 dark:bg-surface-700'
                      }`}>
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <div className="flex-1">
                      <MathRenderer content={option} />
                    </div>
                    {isCorrect && (
                      <span className="text-success-600 flex items-center gap-1 text-sm font-medium">
                        <CheckCircle2 size={14} /> Correct Answer
                      </span>
                    )}
                    {wasWrong && (
                      <span className="text-error-600 flex items-center gap-1 text-sm font-medium">
                        <XCircle size={14} /> Your Answer
                      </span>
                    )}
                    {isUserAnswer && isCorrect && (
                      <span className="text-success-600 flex items-center gap-1 text-sm font-medium">
                        <CheckCircle2 size={14} /> Your Answer
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Explanation */}
          {currentQuestion.explanation && (
            <div className="mt-6 p-4 bg-gradient-to-r from-primary-50 to-violet-50 dark:from-primary-900/20 dark:to-violet-900/20 rounded-xl">
              <h4 className="font-semibold text-primary-700 dark:text-primary-300 mb-2 flex items-center gap-2">
                <Lightbulb size={20} />
                Explanation
              </h4>
              <div className="text-surface-700 dark:text-surface-300">
                <MathRenderer content={currentQuestion.explanation} />
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-surface-200 dark:border-surface-700">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={18} /> Previous
            </button>

            <span className="text-sm text-surface-500">
              {currentIndex + 1} / {totalQuestions}
            </span>

            <button
              onClick={handleNext}
              disabled={currentIndex === totalQuestions - 1}
              className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next <ChevronRight size={18} />
            </button>
          </div>
        </motion.div>
      )}

      {/* Summary */}
      <div className="card p-6">
        <h3 className="font-semibold mb-4">Performance Summary</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Accuracy</span>
              <span className="font-semibold">{Math.round(attempt?.percentage || 0)}%</span>
            </div>
            <div className="h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${(attempt?.percentage || 0) >= 80 ? 'bg-success-500' :
                    (attempt?.percentage || 0) >= 60 ? 'bg-warning-500' :
                      'bg-error-500'
                  }`}
                style={{ width: `${attempt?.percentage || 0}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
              <p className="text-surface-500">Time Taken</p>
              <p className="font-semibold">
                {Math.floor((attempt?.time_taken_seconds || 0) / 60)}m {(attempt?.time_taken_seconds || 0) % 60}s
              </p>
            </div>
            <div className="p-3 bg-surface-50 dark:bg-surface-800 rounded-lg">
              <p className="text-surface-500">Avg per Question</p>
              <p className="font-semibold">
                {totalQuestions > 0
                  ? Math.round((attempt?.time_taken_seconds || 0) / totalQuestions)
                  : 0}s
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AIQuizReview

