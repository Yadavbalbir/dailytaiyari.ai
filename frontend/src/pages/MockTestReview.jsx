import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { quizService } from '../services/quizService'
import Loading from '../components/common/Loading'

const MockTestReview = () => {
  const { attemptId } = useParams()
  const navigate = useNavigate()

  const { data: attempt, isLoading, error } = useQuery({
    queryKey: ['mockAttemptReview', attemptId],
    queryFn: () => quizService.getMockAttemptReview(attemptId),
  })

  if (isLoading) return <Loading fullScreen />

  if (error) {
    return (
      <div className="text-center py-12">
        <span className="text-4xl mb-4 block">❌</span>
        <p className="text-surface-500">Failed to load attempt details</p>
        <button onClick={() => navigate('/mock-test')} className="btn-primary mt-4">
          Back to Mock Tests
        </button>
      </div>
    )
  }

  const getScoreColor = (percentage) => {
    if (percentage >= 70) return 'text-success-500'
    if (percentage >= 40) return 'text-warning-500'
    return 'text-error-500'
  }

  const getScoreBg = (percentage) => {
    if (percentage >= 70) return 'from-success-500 to-success-600'
    if (percentage >= 40) return 'from-warning-500 to-warning-600'
    return 'from-error-500 to-error-600'
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-surface-500 hover:text-surface-700 mb-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-2xl font-display font-bold">Mock Test Review</h1>
          <p className="text-surface-500 mt-1">{attempt?.mock_test_title}</p>
        </div>
        <button
          onClick={() => navigate(`/mock-test/${attempt?.mock_test}`)}
          className="btn-primary"
        >
          Retry Test
        </button>
      </div>

      {/* Score Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`card p-6 bg-gradient-to-r ${getScoreBg(attempt?.percentage)} text-white`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80">Your Score</p>
            <p className="text-4xl font-bold">{Math.round(attempt?.percentage || 0)}%</p>
            <p className="text-white/70 mt-1">
              {attempt?.correct_answers} of {attempt?.total_questions} correct
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-white/80 text-sm">Time Taken</p>
                <p className="text-xl font-semibold">
                  {Math.floor((attempt?.time_taken_seconds || 0) / 60)}:{String((attempt?.time_taken_seconds || 0) % 60).padStart(2, '0')}
                </p>
              </div>
              <div>
                <p className="text-white/80 text-sm">XP Earned</p>
                <p className="text-xl font-semibold">+{attempt?.xp_earned || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/20">
          <div className="text-center">
            <p className="text-2xl font-bold">{attempt?.correct_answers || 0}</p>
            <p className="text-white/70 text-sm">Correct</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{attempt?.wrong_answers || 0}</p>
            <p className="text-white/70 text-sm">Wrong</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">
              {(attempt?.total_questions || 0) - (attempt?.attempted_questions || 0)}
            </p>
            <p className="text-white/70 text-sm">Skipped</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{attempt?.marks_obtained || 0}</p>
            <p className="text-white/70 text-sm">Marks</p>
          </div>
        </div>

        {/* Rank & Percentile */}
        {(attempt?.rank || attempt?.percentile) && (
          <div className="flex items-center justify-center gap-8 mt-6 pt-6 border-t border-white/20">
            {attempt?.rank && (
              <div className="text-center">
                <p className="text-white/80 text-sm">Rank</p>
                <p className="text-2xl font-bold">#{attempt.rank}</p>
              </div>
            )}
            {attempt?.percentile && (
              <div className="text-center">
                <p className="text-white/80 text-sm">Percentile</p>
                <p className="text-2xl font-bold">{Math.round(attempt.percentile)}%</p>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Questions Review */}
      <div className="card p-5">
        <h2 className="font-semibold text-lg mb-4">Question-wise Review</h2>
        
        <div className="space-y-6">
          {(attempt?.answers || []).map((answer, index) => {
            const question = answer.question_data
            const isCorrect = answer.is_correct
            const selectedOption = answer.selected_option
            
            return (
              <motion.div
                key={answer.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className={`p-4 rounded-xl border-2 ${
                  isCorrect 
                    ? 'border-success-200 bg-success-50 dark:bg-success-900/10' 
                    : 'border-error-200 bg-error-50 dark:bg-error-900/10'
                }`}
              >
                {/* Question Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                      isCorrect ? 'bg-success-500' : 'bg-error-500'
                    }`}>
                      {index + 1}
                    </span>
                    <span className={`text-sm font-medium ${isCorrect ? 'text-success-600' : 'text-error-600'}`}>
                      {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-surface-500">
                    <span>{answer.time_taken_seconds}s</span>
                    <span>•</span>
                    <span className={isCorrect ? 'text-success-600' : 'text-error-600'}>
                      {answer.marks_obtained > 0 ? '+' : ''}{answer.marks_obtained} marks
                    </span>
                  </div>
                </div>

                {/* Question Text */}
                <div className="mb-4">
                  <p className="font-medium text-surface-900 dark:text-surface-100">
                    {question?.question_text || question?.question_html}
                  </p>
                  {question?.question_image && (
                    <img 
                      src={question.question_image} 
                      alt="Question" 
                      className="mt-2 max-w-sm rounded-lg"
                    />
                  )}
                </div>

                {/* Options */}
                <div className="space-y-2">
                  {(question?.options || []).map((option, optIndex) => {
                    const isSelected = selectedOption === String(optIndex) || selectedOption === option.id
                    const isCorrectOption = option.is_correct
                    
                    let optionClass = 'bg-surface-100 dark:bg-surface-800'
                    if (isCorrectOption) {
                      optionClass = 'bg-success-100 dark:bg-success-900/30 border-success-500'
                    } else if (isSelected && !isCorrectOption) {
                      optionClass = 'bg-error-100 dark:bg-error-900/30 border-error-500'
                    }

                    return (
                      <div
                        key={option.id || optIndex}
                        className={`p-3 rounded-lg border-2 ${optionClass} ${
                          isSelected ? 'border-2' : 'border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            isCorrectOption 
                              ? 'bg-success-500 text-white' 
                              : isSelected 
                                ? 'bg-error-500 text-white'
                                : 'bg-surface-300 dark:bg-surface-600 text-surface-600 dark:text-surface-300'
                          }`}>
                            {String.fromCharCode(65 + optIndex)}
                          </span>
                          <span className={`flex-1 ${
                            isCorrectOption ? 'font-medium text-success-700 dark:text-success-400' : ''
                          }`}>
                            {option.option_text}
                          </span>
                          {isCorrectOption && (
                            <span className="text-success-500 text-sm">✓ Correct Answer</span>
                          )}
                          {isSelected && !isCorrectOption && (
                            <span className="text-error-500 text-sm">Your Answer</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Explanation */}
                {question?.explanation && (
                  <div className="mt-4 p-3 rounded-lg bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
                    <p className="text-sm font-medium text-primary-700 dark:text-primary-300 mb-1">
                      💡 Explanation
                    </p>
                    <p className="text-sm text-primary-600 dark:text-primary-400">
                      {question.explanation}
                    </p>
                  </div>
                )}

                {/* Subject & Topic Tags */}
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  {question?.subject_name && (
                    <>
                      <span className="text-xs text-surface-500">Subject:</span>
                      <span className="badge bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs">
                        {question.subject_name}
                      </span>
                    </>
                  )}
                  {question?.topic_name && (
                    <>
                      <span className="text-xs text-surface-500 ml-2">Topic:</span>
                      <span className="badge bg-surface-200 dark:bg-surface-700 text-xs">
                        {question.topic_name}
                      </span>
                    </>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="flex gap-4 justify-center pb-8">
        <button
          onClick={() => navigate('/mock-test')}
          className="btn-secondary"
        >
          Back to Mock Tests
        </button>
        <button
          onClick={() => navigate(`/mock-test/${attempt?.mock_test}`)}
          className="btn-primary"
        >
          Retry This Test
        </button>
      </div>
    </div>
  )
}

export default MockTestReview

