import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import MathRenderer from './MathRenderer'
import confetti from 'canvas-confetti'

/**
 * Interactive Quiz Component for AI Chat
 * Renders quiz questions with options, feedback, and navigation
 */
const ChatQuiz = ({ quiz, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState({})
  const [showResult, setShowResult] = useState({})
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [score, setScore] = useState({ correct: 0, total: 0 })

  const questions = quiz.questions || []
  const currentQuestion = questions[currentIndex]
  const totalQuestions = questions.length

  // Calculate score when quiz is completed
  useEffect(() => {
    if (quizCompleted) {
      let correct = 0
      questions.forEach((q, idx) => {
        if (selectedAnswers[idx] === q.correct_option) {
          correct++
        }
      })
      setScore({ correct, total: totalQuestions })
      
      // Celebration if good score
      if (correct / totalQuestions >= 0.7) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        })
      }
    }
  }, [quizCompleted])

  const handleSelectOption = (optionIndex) => {
    if (showResult[currentIndex]) return // Already answered
    
    setSelectedAnswers(prev => ({
      ...prev,
      [currentIndex]: optionIndex
    }))
    
    setShowResult(prev => ({
      ...prev,
      [currentIndex]: true
    }))

    // Small celebration for correct answer
    if (optionIndex === currentQuestion.correct_option) {
      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.7, x: 0.5 },
        colors: ['#10b981', '#34d399', '#6ee7b7']
      })
    }
  }

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(prev => prev + 1)
    } else {
      setQuizCompleted(true)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }
  }

  const handleRetry = () => {
    setSelectedAnswers({})
    setShowResult({})
    setCurrentIndex(0)
    setQuizCompleted(false)
    setScore({ correct: 0, total: 0 })
  }

  const getOptionStyle = (optionIndex) => {
    const isSelected = selectedAnswers[currentIndex] === optionIndex
    const isCorrect = currentQuestion.correct_option === optionIndex
    const hasAnswered = showResult[currentIndex]

    if (!hasAnswered) {
      return isSelected
        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
        : 'border-surface-200 dark:border-surface-700 hover:border-primary-300 hover:bg-primary-50/50 dark:hover:bg-primary-900/20'
    }

    if (isCorrect) {
      return 'border-success-500 bg-success-50 dark:bg-success-900/30'
    }

    if (isSelected && !isCorrect) {
      return 'border-error-500 bg-error-50 dark:bg-error-900/30'
    }

    return 'border-surface-200 dark:border-surface-700 opacity-60'
  }

  const getOptionIcon = (optionIndex) => {
    const isCorrect = currentQuestion.correct_option === optionIndex
    const isSelected = selectedAnswers[currentIndex] === optionIndex
    const hasAnswered = showResult[currentIndex]

    if (!hasAnswered) {
      return (
        <span className="w-7 h-7 rounded-full border-2 border-current flex items-center justify-center text-sm font-semibold">
          {String.fromCharCode(65 + optionIndex)}
        </span>
      )
    }

    if (isCorrect) {
      return (
        <span className="w-7 h-7 rounded-full bg-success-500 text-white flex items-center justify-center">
          ✓
        </span>
      )
    }

    if (isSelected && !isCorrect) {
      return (
        <span className="w-7 h-7 rounded-full bg-error-500 text-white flex items-center justify-center">
          ✗
        </span>
      )
    }

    return (
      <span className="w-7 h-7 rounded-full border-2 border-surface-300 flex items-center justify-center text-sm font-semibold text-surface-400">
        {String.fromCharCode(65 + optionIndex)}
      </span>
    )
  }

  if (!questions.length) {
    return (
      <div className="text-center py-4 text-surface-500">
        No questions found in this quiz.
      </div>
    )
  }

  // Quiz Completed View
  if (quizCompleted) {
    const percentage = Math.round((score.correct / score.total) * 100)
    const isGoodScore = percentage >= 70

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-surface-50 to-surface-100 dark:from-surface-800 dark:to-surface-900 rounded-2xl p-6"
      >
        {/* Result Header */}
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl ${
              isGoodScore 
                ? 'bg-success-100 dark:bg-success-900/50' 
                : 'bg-warning-100 dark:bg-warning-900/50'
            }`}
          >
            {isGoodScore ? '🎉' : '📚'}
          </motion.div>
          <h3 className="text-xl font-bold mb-2">
            {isGoodScore ? 'Great Job!' : 'Keep Practicing!'}
          </h3>
          <p className="text-surface-600 dark:text-surface-400">
            You scored <span className={`font-bold ${isGoodScore ? 'text-success-600' : 'text-warning-600'}`}>
              {score.correct}/{score.total}
            </span> ({percentage}%)
          </p>
        </div>

        {/* Score Bar */}
        <div className="mb-6">
          <div className="h-3 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1, delay: 0.5 }}
              className={`h-full rounded-full ${
                isGoodScore ? 'bg-success-500' : 'bg-warning-500'
              }`}
            />
          </div>
        </div>

        {/* Question Summary */}
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 mb-6">
          {questions.map((q, idx) => {
            const isCorrect = selectedAnswers[idx] === q.correct_option
            return (
              <button
                key={idx}
                onClick={() => {
                  setQuizCompleted(false)
                  setCurrentIndex(idx)
                }}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                  isCorrect
                    ? 'bg-success-100 text-success-700 dark:bg-success-900/50 dark:text-success-400'
                    : 'bg-error-100 text-error-700 dark:bg-error-900/50 dark:text-error-400'
                }`}
              >
                {idx + 1}
              </button>
            )
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleRetry}
            className="flex-1 btn-secondary"
          >
            🔄 Retry Quiz
          </button>
          <button
            onClick={() => {
              setQuizCompleted(false)
              setCurrentIndex(0)
            }}
            className="flex-1 btn-primary"
          >
            📖 Review Answers
          </button>
        </div>
      </motion.div>
    )
  }

  // Question View
  return (
    <div className="bg-gradient-to-br from-surface-50 to-surface-100 dark:from-surface-800 dark:to-surface-900 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-500 to-purple-600 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <span className="text-lg">📝</span>
          <span className="font-semibold">Practice Quiz</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white/80 text-sm">
            {currentIndex + 1} / {totalQuestions}
          </span>
          {/* Progress dots */}
          <div className="flex gap-1">
            {questions.map((_, idx) => (
              <div
                key={idx}
                className={`w-2 h-2 rounded-full transition-colors ${
                  idx === currentIndex
                    ? 'bg-white'
                    : showResult[idx]
                    ? selectedAnswers[idx] === questions[idx].correct_option
                      ? 'bg-success-400'
                      : 'bg-error-400'
                    : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Question Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="p-5"
        >
          {/* Question Text */}
          <div className="mb-5">
            <div className="flex items-start gap-3 mb-3">
              <span className="px-2.5 py-1 bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 rounded-lg text-sm font-semibold">
                Q{currentIndex + 1}
              </span>
              {currentQuestion.difficulty && (
                <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                  currentQuestion.difficulty === 'easy' 
                    ? 'bg-success-100 text-success-700 dark:bg-success-900/50 dark:text-success-400'
                    : currentQuestion.difficulty === 'hard'
                    ? 'bg-error-100 text-error-700 dark:bg-error-900/50 dark:text-error-400'
                    : 'bg-warning-100 text-warning-700 dark:bg-warning-900/50 dark:text-warning-400'
                }`}>
                  {currentQuestion.difficulty}
                </span>
              )}
            </div>
            <MathRenderer 
              content={currentQuestion.question} 
              className="text-lg"
            />
          </div>

          {/* Options */}
          <div className="space-y-3 mb-5">
            {(currentQuestion.options || []).map((option, optionIndex) => (
              <motion.button
                key={optionIndex}
                whileHover={!showResult[currentIndex] ? { scale: 1.01 } : {}}
                whileTap={!showResult[currentIndex] ? { scale: 0.99 } : {}}
                onClick={() => handleSelectOption(optionIndex)}
                disabled={showResult[currentIndex]}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-3 ${getOptionStyle(optionIndex)}`}
              >
                {getOptionIcon(optionIndex)}
                <MathRenderer content={option} className="flex-1 !prose-p:my-0" />
              </motion.button>
            ))}
          </div>

          {/* Explanation (shown after answering) */}
          <AnimatePresence>
            {showResult[currentIndex] && currentQuestion.explanation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-5"
              >
                <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-200 dark:border-primary-800">
                  <div className="flex items-center gap-2 mb-2 text-primary-700 dark:text-primary-300 font-semibold">
                    <span>💡</span>
                    <span>Explanation</span>
                  </div>
                  <MathRenderer 
                    content={currentQuestion.explanation} 
                    className="text-sm text-primary-800 dark:text-primary-200"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-surface-200 dark:border-surface-700">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>

            <div className="text-sm text-surface-500">
              {showResult[currentIndex] 
                ? selectedAnswers[currentIndex] === currentQuestion.correct_option
                  ? '✅ Correct!'
                  : '❌ Incorrect'
                : 'Select an answer'
              }
            </div>

            <button
              onClick={handleNext}
              disabled={!showResult[currentIndex]}
              className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentIndex === totalQuestions - 1 ? 'Finish' : 'Next'}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default ChatQuiz

