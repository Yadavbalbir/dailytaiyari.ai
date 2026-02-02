import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { quizService } from '../services/quizService'
import Loading from '../components/common/Loading'
import toast from 'react-hot-toast'

const MockTestAttempt = () => {
  const { testId } = useParams()
  const navigate = useNavigate()
  
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState(null)

  const { data: test, isLoading } = useQuery({
    queryKey: ['mockTestDetail', testId],
    queryFn: () => quizService.getMockTestDetails(testId),
  })

  useEffect(() => {
    if (test) {
      setTimeLeft(test.duration_minutes * 60)
    }
  }, [test])

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
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleAnswerSelect = (questionId, optionIndex) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        question_id: questionId,
        selected_option: optionIndex.toString(),
        time_taken_seconds: 0,
      },
    }))
  }

  const handleSubmit = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      const response = await quizService.submitMockTest(testId, {
        answers: Object.values(answers),
        time_taken_seconds: test.duration_minutes * 60 - timeLeft,
      })
      setResult(response)
    } catch (error) {
      toast.error('Failed to submit test')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) return <Loading fullScreen />

  const questions = test?.questions || []
  const question = questions[currentQuestion]

  // Result Screen
  if (result) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card p-8 text-center"
        >
          <span className="text-6xl mb-4 block">
            {result.percentage >= 70 ? '🎉' : result.percentage >= 40 ? '💪' : '📚'}
          </span>
          
          <h2 className="text-2xl font-bold mb-6">Test Completed!</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800">
              <p className="text-3xl font-bold">{Math.round(result.percentage)}%</p>
              <p className="text-sm text-surface-500">Score</p>
            </div>
            <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800">
              <p className="text-3xl font-bold text-success-500">{result.correct_answers}</p>
              <p className="text-sm text-surface-500">Correct</p>
            </div>
            <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800">
              <p className="text-3xl font-bold text-error-500">{result.wrong_answers}</p>
              <p className="text-sm text-surface-500">Wrong</p>
            </div>
            <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800">
              <p className="text-3xl font-bold">{result.marks_obtained}/{test.total_marks}</p>
              <p className="text-sm text-surface-500">Marks</p>
            </div>
          </div>

          {result.rank && (
            <div className="mb-6 p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20">
              <p className="text-lg">Your Rank: <span className="font-bold text-primary-600">#{result.rank}</span></p>
              {result.percentile && <p className="text-sm text-surface-500">Top {result.percentile}%</p>}
            </div>
          )}

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => navigate('/mock-test')}
              className="btn-secondary"
            >
              Back to Tests
            </button>
            <button
              onClick={() => navigate('/analytics')}
              className="btn-primary"
            >
              View Analysis
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-surface-50/95 dark:bg-surface-950/95 backdrop-blur-sm py-4 -mx-4 px-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">{test?.title}</h2>
            <p className="text-sm text-surface-500">
              Question {currentQuestion + 1} of {questions.length}
            </p>
          </div>
          <div className={`px-4 py-2 rounded-xl font-mono font-bold text-lg ${
            timeLeft <= 300 ? 'bg-error-100 text-error-600 animate-pulse' :
            timeLeft <= 600 ? 'bg-warning-100 text-warning-600' :
            'bg-surface-100 dark:bg-surface-800'
          }`}>
            ⏱️ {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="card p-6 mb-6">
        <div className="flex items-start gap-4 mb-6">
          <span className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 flex items-center justify-center font-bold">
            {currentQuestion + 1}
          </span>
          <p className="text-lg font-medium leading-relaxed flex-1">
            {question?.question_text}
          </p>
        </div>

        <div className="space-y-3">
          {question?.options?.map((option, index) => {
            const isSelected = answers[question.id]?.selected_option === index.toString()
            
            return (
              <button
                key={option.id}
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
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Question Navigator */}
      <div className="card p-4 mb-20">
        <div className="flex flex-wrap gap-2">
          {questions.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentQuestion(index)}
              className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
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
      </div>

      {/* Navigation */}
      <div className="fixed bottom-20 lg:bottom-0 left-0 right-0 bg-white/95 dark:bg-surface-900/95 backdrop-blur-sm border-t border-surface-200 dark:border-surface-800 p-4">
        <div className="max-w-4xl mx-auto flex justify-between">
          <button
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
            className="btn-secondary"
          >
            Previous
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="btn-primary"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Test'}
          </button>

          <button
            onClick={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestion + 1))}
            disabled={currentQuestion === questions.length - 1}
            className="btn-secondary"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}

export default MockTestAttempt

