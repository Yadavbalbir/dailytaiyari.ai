import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

const QuickActionButton = ({ 
  title, 
  subtitle, 
  icon, 
  to, 
  onClick,
  variant = 'default',
  badge,
  disabled = false 
}) => {
  const navigate = useNavigate()

  const variants = {
    default: 'bg-white dark:bg-surface-900 hover:border-primary-300 dark:hover:border-primary-700',
    primary: 'bg-gradient-to-br from-primary-500 to-primary-600 text-white border-none',
    accent: 'bg-gradient-to-br from-accent-500 to-accent-600 text-white border-none',
    success: 'bg-gradient-to-br from-success-500 to-success-600 text-white border-none',
  }

  const handleClick = () => {
    if (disabled) return
    if (onClick) onClick()
    if (to) navigate(to)
  }

  const isColoredVariant = variant !== 'default'

  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.02, y: -2 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      onClick={handleClick}
      disabled={disabled}
      className={`card p-4 w-full text-left transition-all ${variants[variant]} ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          isColoredVariant 
            ? 'bg-white/20' 
            : 'bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-900/30 dark:to-accent-900/30'
        }`}>
          <span className="text-2xl">{icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className={`font-semibold ${isColoredVariant ? '' : ''}`}>
              {title}
            </h4>
            {badge && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                isColoredVariant 
                  ? 'bg-white/20 text-white' 
                  : 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
              }`}>
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className={`text-sm mt-0.5 truncate ${
              isColoredVariant ? 'text-white/80' : 'text-surface-500'
            }`}>
              {subtitle}
            </p>
          )}
        </div>
        <svg 
          className={`w-5 h-5 ${isColoredVariant ? 'text-white/80' : 'text-surface-400'}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </motion.button>
  )
}

export default QuickActionButton

