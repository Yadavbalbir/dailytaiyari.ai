import { motion } from 'framer-motion'
import {
    MessageCircle, ThumbsUp, Eye, CheckCircle,
    BarChart3, Zap, Clock, User, BadgeCheck
} from 'lucide-react'

const PostCard = ({ post, onLike, onClick }) => {
    const typeConfig = {
        question: {
            icon: MessageCircle,
            label: 'Question',
            color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20'
        },
        poll: {
            icon: BarChart3,
            label: 'Poll',
            color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20'
        },
        quiz: {
            icon: Zap,
            label: 'Quiz',
            color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20'
        },
    }

    const config = typeConfig[post.post_type] || typeConfig.question
    const TypeIcon = config.icon

    const formatDate = (dateString) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now - date
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 1) return 'Just now'
        if (diffMins < 60) return `${diffMins}m ago`
        if (diffHours < 24) return `${diffHours}h ago`
        if (diffDays < 7) return `${diffDays}d ago`
        return date.toLocaleDateString()
    }

    return (
        <motion.div
            whileHover={{ scale: 1.005 }}
            onClick={onClick}
            className="card p-5 cursor-pointer hover:shadow-lg transition-shadow"
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    {/* Author Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white font-semibold">
                        {post.author?.first_name?.[0] || post.author?.full_name?.[0] || 'U'}
                    </div>
                    <div>
                        <p className="font-medium text-sm flex items-center gap-1">
                            {post.author?.full_name || post.author?.first_name || 'Anonymous'}
                            {(post.author?.role === 'admin' || post.author?.role === 'instructor') && (
                                <BadgeCheck size={14} className="text-blue-500 fill-blue-500/10" title="Verified" />
                            )}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-surface-500">
                            <Clock size={12} />
                            <span>{formatDate(post.created_at)}</span>
                            {post.author?.current_level && (
                                <>
                                    <span>•</span>
                                    <span className="text-primary-500">Level {post.author.current_level}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Type Badge */}
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                    <TypeIcon size={12} />
                    {config.label}
                </div>
            </div>

            {/* Title */}
            <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                {post.title}
                {post.is_solved && (
                    <CheckCircle size={16} className="inline ml-2 text-success-500" />
                )}
            </h3>

            {/* Content Preview */}
            <p className="text-surface-600 dark:text-surface-400 text-sm line-clamp-2 mb-4">
                {post.content}
            </p>

            {/* Poll Preview */}
            {post.post_type === 'poll' && post.poll_options && (
                <div className="space-y-2 mb-4">
                    {post.poll_options.slice(0, 3).map((option) => (
                        <div
                            key={option.id}
                            className="flex items-center justify-between bg-surface-50 dark:bg-surface-800 rounded-lg p-2 text-sm"
                        >
                            <span className="truncate">{option.option_text}</span>
                            <span className="text-surface-500">{option.votes_count} votes</span>
                        </div>
                    ))}
                    {post.poll_options.length > 3 && (
                        <p className="text-xs text-surface-500 text-center">
                            +{post.poll_options.length - 3} more options
                        </p>
                    )}
                </div>
            )}

            {/* Quiz Preview */}
            {post.post_type === 'quiz' && post.quiz && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg p-3 mb-4">
                    <p className="text-sm font-medium line-clamp-2">{post.quiz.question}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-surface-500">
                        <span>{post.quiz.attempts_count} attempts</span>
                        <span>{post.quiz.success_rate}% success rate</span>
                    </div>
                </div>
            )}

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                    {post.tags.slice(0, 3).map((tag, idx) => (
                        <span
                            key={idx}
                            className="px-2 py-0.5 bg-surface-100 dark:bg-surface-700 rounded-full text-xs text-surface-600 dark:text-surface-400"
                        >
                            #{tag}
                        </span>
                    ))}
                </div>
            )}

            {/* Footer Stats */}
            <div className="flex items-center gap-4 pt-3 border-t border-surface-100 dark:border-surface-700">
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onLike?.()
                    }}
                    className={`flex items-center gap-1.5 text-sm transition-colors ${post.is_liked
                        ? 'text-primary-500'
                        : 'text-surface-500 hover:text-primary-500'
                        }`}
                >
                    <ThumbsUp size={16} fill={post.is_liked ? 'currentColor' : 'none'} />
                    <span>{post.likes_count || 0}</span>
                </button>

                <div className="flex items-center gap-1.5 text-sm text-surface-500">
                    <MessageCircle size={16} />
                    <span>{post.comments_count || 0}</span>
                </div>

                <div className="flex items-center gap-1.5 text-sm text-surface-500">
                    <Eye size={16} />
                    <span>{post.views_count || 0}</span>
                </div>

                {post.is_solved && (
                    <div className="flex items-center gap-1 text-sm text-success-500 ml-auto">
                        <CheckCircle size={14} />
                        <span>Solved</span>
                    </div>
                )}
            </div>
        </motion.div>
    )
}

export default PostCard
