import { motion } from 'framer-motion'

const Loading = ({ size = 'md', fullScreen = false }) => {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  }

  const spinner = (
    <div className={`${sizes[size]} relative`}>
      <motion.div
        className="absolute inset-0 border-4 border-surface-200 dark:border-surface-700 rounded-full"
      />
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0 border-4 border-transparent border-t-primary-500 rounded-full"
      />
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-surface-50/80 dark:bg-surface-950/80 backdrop-blur-sm z-50">
        <div className="flex flex-col items-center gap-4">
          {spinner}
          <p className="text-surface-500">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center p-8">
      {spinner}
    </div>
  )
}

// Skeleton components for loading states
export const SkeletonCard = ({ className = '' }) => (
  <div className={`card p-4 ${className}`}>
    <div className="skeleton h-4 w-1/3 mb-3" />
    <div className="skeleton h-8 w-1/2 mb-2" />
    <div className="skeleton h-3 w-2/3" />
  </div>
)

export const SkeletonRow = () => (
  <div className="flex items-center gap-4 p-3">
    <div className="skeleton w-10 h-10 rounded-full" />
    <div className="flex-1">
      <div className="skeleton h-4 w-1/3 mb-2" />
      <div className="skeleton h-3 w-1/2" />
    </div>
  </div>
)

export default Loading

