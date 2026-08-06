import { motion } from 'framer-motion'
import { Flame } from 'lucide-react'

const StreakFire = ({ streak, size = 'md' }) => {
  const sizes = {
    sm: { container: 'w-12 h-12', text: 'text-sm', icon: 'w-5 h-5' },
    md: { container: 'w-16 h-16', text: 'text-base', icon: 'w-7 h-7' },
    lg: { container: 'w-20 h-20', text: 'text-xl', icon: 'w-9 h-9' },
    xl: { container: 'w-24 h-24', text: 'text-2xl', icon: 'w-11 h-11' },
  }

  const { container, text, icon } = sizes[size]

  return (
    <motion.div
      initial={{ scale: 0.8 }}
      animate={{ scale: 1 }}
      className={`${container} relative flex flex-col items-center justify-center`}
    >
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-orange-500/30 to-amber-400/30 rounded-full blur-xl animate-pulse" />

      {/* Fire container */}
      <div className="relative z-10 flex flex-col items-center">
        <motion.span
          animate={{ 
            y: [0, -2, 0],
            scale: [1, 1.08, 1]
          }}
          transition={{ 
            duration: 1.6, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="drop-shadow-[0_2px_6px_rgba(249,115,22,0.45)]"
        >
          <Flame className={`${icon} text-orange-500`} fill="currentColor" strokeWidth={1.5} />
        </motion.span>
        <span className={`${text} font-bold text-orange-600 dark:text-orange-400 -mt-0.5 tabular-nums`}>
          {streak}
        </span>
      </div>
    </motion.div>
  )
}

export default StreakFire

