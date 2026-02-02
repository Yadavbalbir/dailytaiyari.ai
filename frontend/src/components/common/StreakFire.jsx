import { motion } from 'framer-motion'

const StreakFire = ({ streak, size = 'md' }) => {
  const sizes = {
    sm: { container: 'w-12 h-12', text: 'text-sm', icon: 'text-xl' },
    md: { container: 'w-16 h-16', text: 'text-base', icon: 'text-2xl' },
    lg: { container: 'w-20 h-20', text: 'text-xl', icon: 'text-3xl' },
    xl: { container: 'w-24 h-24', text: 'text-2xl', icon: 'text-4xl' },
  }

  const { container, text, icon } = sizes[size]

  return (
    <motion.div
      initial={{ scale: 0.8 }}
      animate={{ scale: 1 }}
      className={`${container} relative flex flex-col items-center justify-center`}
    >
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-orange-500/30 to-yellow-400/30 rounded-full blur-xl animate-pulse" />
      
      {/* Fire container */}
      <div className="relative z-10 flex flex-col items-center">
        <motion.span
          animate={{ 
            y: [0, -2, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 0.5, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className={`${icon}`}
        >
          🔥
        </motion.span>
        <span className={`${text} font-bold text-primary-600 dark:text-primary-400 -mt-1`}>
          {streak}
        </span>
      </div>
    </motion.div>
  )
}

export default StreakFire

