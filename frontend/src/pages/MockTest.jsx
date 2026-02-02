import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { quizService } from '../services/quizService'
import Loading from '../components/common/Loading'

const MockTest = () => {
  const navigate = useNavigate()

  const { data: mockTests, isLoading } = useQuery({
    queryKey: ['mockTests'],
    queryFn: () => quizService.getMockTests(),
  })

  const handleStartTest = async (testId) => {
    try {
      await quizService.startMockTest(testId)
      navigate(`/mock-test/${testId}`)
    } catch (error) {
      console.error('Failed to start mock test:', error)
    }
  }

  if (isLoading) return <Loading fullScreen />

  const tests = mockTests?.results || mockTests || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold">Mock Tests</h1>
        <p className="text-surface-500 mt-1">Practice with full-length exam simulations</p>
      </div>

      {/* Info Banner */}
      <div className="card p-5 bg-gradient-to-r from-accent-50 to-primary-50 dark:from-accent-900/20 dark:to-primary-900/20">
        <div className="flex items-start gap-4">
          <span className="text-3xl">📋</span>
          <div>
            <h3 className="font-semibold">About Mock Tests</h3>
            <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
              Mock tests simulate the real exam environment with accurate timing, marking scheme, 
              and question patterns. Complete analysis is provided after each attempt.
            </p>
          </div>
        </div>
      </div>

      {/* Mock Tests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tests.map((test) => (
          <motion.div
            key={test.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-5"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="badge-primary mb-2">{test.exam_name}</span>
                <h3 className="text-lg font-semibold">{test.title}</h3>
              </div>
              {test.is_free ? (
                <span className="badge-success">Free</span>
              ) : (
                <span className="badge-warning">Premium</span>
              )}
            </div>

            <p className="text-sm text-surface-500 mb-4">{test.description}</p>

            <div className="grid grid-cols-3 gap-4 mb-4 text-center">
              <div className="p-2 rounded-lg bg-surface-50 dark:bg-surface-800">
                <p className="text-lg font-bold">{test.questions_count}</p>
                <p className="text-xs text-surface-500">Questions</p>
              </div>
              <div className="p-2 rounded-lg bg-surface-50 dark:bg-surface-800">
                <p className="text-lg font-bold">{test.duration_minutes}m</p>
                <p className="text-xs text-surface-500">Duration</p>
              </div>
              <div className="p-2 rounded-lg bg-surface-50 dark:bg-surface-800">
                <p className="text-lg font-bold">{test.total_marks}</p>
                <p className="text-xs text-surface-500">Marks</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-surface-500">
                <span>{test.total_attempts} attempts</span>
                {test.average_score > 0 && (
                  <span> • Avg: {Math.round(test.average_score)}%</span>
                )}
              </div>
              <button
                onClick={() => handleStartTest(test.id)}
                className="btn-primary"
              >
                Start Test
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {tests.length === 0 && (
        <div className="text-center py-12">
          <span className="text-4xl mb-4 block">📝</span>
          <p className="text-surface-500">No mock tests available right now</p>
          <p className="text-sm text-surface-400 mt-1">Check back later for new tests</p>
        </div>
      )}
    </div>
  )
}

export default MockTest

