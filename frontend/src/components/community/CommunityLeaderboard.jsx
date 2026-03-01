import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Trophy, Medal, Award, TrendingUp, BadgeCheck } from 'lucide-react'
import { communityService } from '../../services/communityService'

const CommunityLeaderboard = () => {
    const [period, setPeriod] = useState('weekly')

    const { data: leaderboard, isLoading } = useQuery({
        queryKey: ['communityLeaderboard', period],
        queryFn: () => communityService.getLeaderboard(period)
    })

    const periods = [
        { id: 'weekly', label: 'Week' },
        { id: 'monthly', label: 'Month' },
        { id: 'all_time', label: 'All Time' },
    ]

    const getRankIcon = (rank) => {
        switch (rank) {
            case 1:
                return <Trophy className="text-yellow-500" size={20} />
            case 2:
                return <Medal className="text-gray-400" size={20} />
            case 3:
                return <Award className="text-amber-700" size={20} />
            default:
                return <span className="text-surface-400 font-semibold">{rank}</span>
        }
    }

    const getRankBg = (rank) => {
        switch (rank) {
            case 1:
                return 'bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-200 dark:border-yellow-800'
            case 2:
                return 'bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 border-gray-200 dark:border-gray-700'
            case 3:
                return 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800'
            default:
                return 'bg-surface-50 dark:bg-surface-800 border-surface-200 dark:border-surface-700'
        }
    }

    return (
        <div className="card p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                    <TrendingUp size={18} className="text-primary-500" />
                    Top Contributors
                </h3>
            </div>

            {/* Period Tabs */}
            <div className="flex gap-1 mb-4 bg-surface-100 dark:bg-surface-800 p-1 rounded-lg">
                {periods.map((p) => (
                    <button
                        key={p.id}
                        onClick={() => setPeriod(p.id)}
                        className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-all ${period === p.id
                            ? 'bg-white dark:bg-surface-700 shadow-sm text-primary-600'
                            : 'text-surface-500 hover:text-surface-700'
                            }`}
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            {/* Leaderboard List */}
            {isLoading ? (
                <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-14 bg-surface-100 dark:bg-surface-800 rounded-lg animate-pulse" />
                    ))}
                </div>
            ) : leaderboard?.length > 0 ? (
                <div className="space-y-2">
                    {leaderboard.slice(0, 10).map((entry, index) => (
                        <motion.div
                            key={entry.user?.id || index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`flex items-center gap-3 p-3 rounded-lg border ${getRankBg(entry.rank)}`}
                        >
                            {/* Rank */}
                            <div className="w-6 flex justify-center">
                                {getRankIcon(entry.rank)}
                            </div>

                            {/* Avatar */}
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white text-sm font-semibold overflow-hidden">
                                {entry.user?.avatar ? (
                                    <img src={entry.user.avatar} alt={entry.user.full_name} className="w-full h-full object-cover" />
                                ) : (
                                    entry.user?.first_name?.[0] || entry.user?.full_name?.[0] || '?'
                                )}
                            </div>


                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate flex items-center gap-1">
                                    {entry.user?.full_name || entry.user?.first_name || 'Anonymous'}
                                    {(entry.user?.role === 'admin' || entry.user?.role === 'instructor') && (
                                        <BadgeCheck size={14} className="text-blue-500 fill-blue-500/10" title="Verified" />
                                    )}
                                </p>
                                <p className="text-xs text-surface-500">
                                    {entry.answers_count} answers • {entry.best_answers_count} best
                                </p>
                            </div>

                            {/* Score */}
                            <div className="text-right">
                                <p className="font-bold text-primary-600">{entry.score}</p>
                                <p className="text-xs text-surface-500">pts</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 text-surface-500">
                    <p className="text-sm">No activity this {period.replace('_', ' ')}</p>
                    <p className="text-xs mt-1">Be the first to contribute!</p>
                </div>
            )}
        </div>
    )
}

export default CommunityLeaderboard
