import { motion } from 'framer-motion'
import { Award } from 'lucide-react'

const LeaderboardRow = ({ entry, rank, isCurrentUser = false }) => {
  const getRankStyle = (rank) => {
    if (rank === 1) return { bg: 'bg-gradient-to-r from-yellow-400 to-yellow-500', icon: <Award size={20} /> }
    if (rank === 2) return { bg: 'bg-gradient-to-r from-gray-300 to-gray-400', icon: <Award size={20} /> }
    if (rank === 3) return { bg: 'bg-gradient-to-r from-amber-600 to-amber-700', icon: <Award size={20} /> }
    return { bg: 'bg-surface-200 dark:bg-surface-700', text: rank }
  }

  const rankStyle = getRankStyle(rank)

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.05 }}
      className={`flex items-center gap-4 p-3 rounded-xl transition-colors ${isCurrentUser
          ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800'
          : 'hover:bg-surface-50 dark:hover:bg-surface-800'
        }`}
    >
      {/* Rank */}
      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${rank <= 3 ? 'text-white' : 'text-surface-600 dark:text-surface-400'
        } ${rankStyle.bg}`}>
        {rankStyle.icon || rankStyle.text}
      </div>

      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white font-semibold">
        {entry.student_name?.charAt(0) || '?'}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`font-medium truncate ${isCurrentUser ? 'text-primary-600 dark:text-primary-400' : ''}`}>
            {entry.student_name}
          </span>
          {isCurrentUser && (
            <span className="text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 px-1.5 py-0.5 rounded-full">
              You
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-surface-500">
          <span>Level {entry.student_level}</span>
          <span>•</span>
          <span>{entry.accuracy?.toFixed(1)}% accuracy</span>
        </div>
      </div>

      {/* XP */}
      <div className="text-right">
        <div className="font-bold text-primary-600 dark:text-primary-400">
          {entry.xp_earned?.toLocaleString()} XP
        </div>
        {entry.rank_change !== 0 && (
          <div className={`text-xs ${entry.rank_change > 0 ? 'text-success-500' : 'text-error-500'}`}>
            {entry.rank_change > 0 ? '↑' : '↓'} {Math.abs(entry.rank_change)}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default LeaderboardRow

