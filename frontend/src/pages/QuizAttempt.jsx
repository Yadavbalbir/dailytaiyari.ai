import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { quizService } from '../services/quizService'
import Loading from '../components/common/Loading'
import toast from 'react-hot-toast'
import Confetti from 'react-confetti'

const QuizAttempt = () => {
  const { quizId } = useParams()
  const navigate = useNavigate()
  
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [showConfetti, setShowConfetti] = useState(false)

  const { data: quiz, isLoading } = useQuery({
    queryKey: ['quizDetail', quizId],
    queryFn: () => quizService.getQuizDetails(quizId),
  })

  // Initialize timer
  useEffect(() => {
    if (quiz) {
      setTimeLeft(quiz.duration_minutes * 60)
    }
  }, [quiz])

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0 || result) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft, result])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleAnswerSelect = (questionId, optionIndex) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        question_id: questionId,
        selected_option: optionIndex.toString(),
        time_taken_seconds: Math.floor((quiz.duration_minutes * 60 - timeLeft) / quiz.questions.length),
      },
    }))
  }

  const handleSubmit = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      const response = await quizService.submitQuiz(quizId, {
        answers: Object.values(answers),
        time_taken_seconds: quiz.duration_minutes * 60 - timeLeft,
      })
      
      setResult(response)
      
      if (response.percentage >= 70) {
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 5000)
      }
    } catch (error) {
      toast.error('Failed to submit quiz')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) return <Loading fullScreen />

  const questions = quiz?.questions || []
  const question = questions[currentQuestion]
  const progress = ((currentQuestion + 1) / questions.length) * 100

  // Result Screen
  if (result) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        {showConfetti && <Confetti recycle={false} numberOfPieces={200} />}
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card p-8 max-w-lg w-full text-center"
        >
          <div className="mb-6">
            {result.percentage >= 70 ? (
              <>
                <span className="text-6xl mb-4 block">🎉</span>
                <h2 className="text-2xl font-bold text-success-500">Excellent!</h2>
              </>
            ) : result.percentage >= 40 ? (
              <>
                <span className="text-6xl mb-4 block">💪</span>
                <h2 className="text-2xl font-bold text-warning-500">Good Effort!</h2>
              </>
            ) : (
              <>
                <span className="text-6xl mb-4 block">📚</span>
                <h2 className="text-2xl font-bold text-error-500">Keep Practicing!</h2>
              </>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800">
              <p className="text-3xl font-bold">{Math.round(result.percentage)}%</p>
              <p className="text-sm text-surface-500">Score</p>
            </div>
            <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800">
              <p className="text-3xl font-bold text-success-500">{result.correct_answers}</p>
              <p className="text-sm text-surface-500">Correct</p>
            </div>
            <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800">
              <p className="text-3xl font-bold text-primary-500">+{result.xp_earned}</p>
              <p className="text-sm text-surface-500">XP Earned</p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => navigate('/quiz')}
              className="btn-primary w-full"
            >
              Back to Quizzes
            </button>
            <button
              onClick={() => navigate('/analytics')}
              className="btn-secondary w-full"
            >
              View Analytics
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-surface-50/95 dark:bg-surface-950/95 backdrop-blur-sm py-4 -mx-4 px-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-semibold">{quiz?.title}</h2>
            <p className="text-sm text-surface-500">
              Question {currentQuestion + 1} of {questions.length}
            </p>
          </div>
          <div className={`px-4 py-2 rounded-xl font-mono font-bold ${
            timeLeft <= 60 ? 'bg-error-100 text-error-600 animate-pulse' : 
            timeLeft <= 300 ? 'bg-warning-100 text-warning-600' :
            'bg-surface-100 dark:bg-surface-800'
          }`}>
            ⏱️ {formatTime(timeLeft)}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="progress-bar h-2">
          <motion.div
            className="progress-bar-fill bg-gradient-to-r from-primary-500 to-accent-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="card p-6 my-6"
        >
          <div className="flex items-start gap-4 mb-6">
            <span className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold">
              {currentQuestion + 1}
            </span>
            <div>
              <p className="text-lg font-medium leading-relaxed">
                {question?.question_text}
              </p>
              {question?.question_image && (
                <img 
                  src={question.question_image} 
                  alt="Question" 
                  className="mt-4 rounded-xl max-h-64 object-contain"
                />
              )}
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {question?.options?.map((option, index) => {
              const isSelected = answers[question.id]?.selected_option === index.toString()
              
              return (
                <motion.button
                  key={option.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleAnswerSelect(question.id, index)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-surface-200 dark:border-surface-700 hover:border-primary-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-medium ${
                      isSelected
                        ? 'bg-primary-500 text-white'
                        : 'bg-surface-100 dark:bg-surface-700'
                    }`}>
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="flex-1">{option.option_text}</span>
                    {option.option_image && (
                      <img src={option.option_image} alt="" className="h-12 rounded" />
                    )}
                  </div>
                </motion.button>
              )
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="fixed bottom-20 lg:bottom-0 left-0 right-0 bg-white/95 dark:bg-surface-900/95 backdrop-blur-sm border-t border-surface-200 dark:border-surface-800 p-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <button
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
            className="btn-secondary"
          >
            Previous
          </button>

          {/* Question Navigator */}
          <div className="hidden md:flex items-center gap-1 overflow-x-auto">
            {questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestion(index)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                  index === currentQuestion
                    ? 'bg-primary-500 text-white'
                    : answers[questions[index]?.id]
                    ? 'bg-success-100 dark:bg-success-900/30 text-success-600'
                    : 'bg-surface-100 dark:bg-surface-700'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>

          {currentQuestion === questions.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="btn-primary"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
            </button>
          ) : (
            <button
              onClick={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestion + 1))}
              className="btn-primary"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default QuizAttempt

