import { motion } from 'framer-motion'

const StatCard = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend, 
  trendValue,
  variant = 'default',
  onClick 
}) => {
  const variants = {
    default: 'bg-white dark:bg-surface-900',
    primary: 'bg-gradient-to-br from-primary-500 to-primary-600 text-white',
    accent: 'bg-gradient-to-br from-accent-500 to-accent-600 text-white',
    success: 'bg-gradient-to-br from-success-500 to-success-600 text-white',
  }

  const isColoredVariant = variant !== 'default'

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={onClick ? { scale: 0.98 } : {}}
      className={`card p-5 ${variants[variant]} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className={`text-sm ${isColoredVariant ? 'text-white/80' : 'text-surface-500'}`}>
            {title}
          </p>
          <h3 className="text-2xl font-bold mt-1">{value}</h3>
        </div>
        {icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isColoredVariant 
              ? 'bg-white/20' 
              : 'bg-primary-50 dark:bg-primary-900/30'
          }`}>
            <span className="text-xl">{icon}</span>
          </div>
        )}
      </div>
      
      {(subtitle || trend) && (
        <div className="flex items-center justify-between">
          {subtitle && (
            <p className={`text-sm ${isColoredVariant ? 'text-white/70' : 'text-surface-500'}`}>
              {subtitle}
            </p>
          )}
          {trend && (
            <div className={`flex items-center gap-1 text-sm ${
              trend === 'up' 
                ? isColoredVariant ? 'text-white' : 'text-success-600' 
                : isColoredVariant ? 'text-white/80' : 'text-error-600'
            }`}>
              <span>{trend === 'up' ? '↑' : '↓'}</span>
              <span>{trendValue}</span>
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
}

export default StatCard

