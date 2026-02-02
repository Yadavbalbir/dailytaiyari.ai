import { motion } from 'framer-motion'

const masteryLevels = {
  1: { label: 'Beginner', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: '🌱' },
  2: { label: 'Developing', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', icon: '🌿' },
  3: { label: 'Proficient', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: '🌳' },
  4: { label: 'Expert', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: '⭐' },
  5: { label: 'Master', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: '👑' },
}

const TopicMasteryChip = ({ topic, mastery, onClick, showAccuracy = true }) => {
  const level = masteryLevels[mastery?.mastery_level || 1]
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={onClick ? { scale: 0.98 } : {}}
      className={`card p-4 ${onClick ? 'cursor-pointer hover:border-primary-300 dark:hover:border-primary-700' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-sm line-clamp-2">{topic.name}</h4>
        <span className={`flex-shrink-0 ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${level.color}`}>
          {level.icon} {level.label}
        </span>
      </div>
      
      {showAccuracy && mastery && (
        <div className="flex items-center gap-4 mt-3">
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-surface-500">Accuracy</span>
              <span className="font-medium">{Math.round(mastery.accuracy_percentage || 0)}%</span>
            </div>
            <div className="progress-bar h-1.5">
              <div 
                className="progress-bar-fill bg-gradient-to-r from-primary-400 to-primary-600"
                style={{ width: `${mastery.accuracy_percentage || 0}%` }}
              />
            </div>
          </div>
          <div className="text-xs text-surface-500">
            {mastery.total_questions_attempted || 0} Qs
          </div>
        </div>
      )}
      
      {mastery?.needs_revision && (
        <div className="mt-2 flex items-center gap-1 text-xs text-warning-600 dark:text-warning-400">
          <span>⚠️</span>
          <span>Needs revision</span>
        </div>
      )}
    </motion.div>
  )
}

export default TopicMasteryChip

