import { useState, memo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ThumbsUp, Reply, Trophy, Clock, ChevronDown, ChevronUp, BadgeCheck } from 'lucide-react'
import { communityService } from '../../services/communityService'
import toast from 'react-hot-toast'

// Memoized comment item to prevent unnecessary re-renders
const CommentItem = memo(({
    comment,
    isReply = false,
    postId,
    postAuthorId,
    canSelectBestAnswer,
    onSelectBestAnswer,
    onLike,
    onReply
}) => {
    const [showReplyInput, setShowReplyInput] = useState(false)
    const [showReplies, setShowReplies] = useState(false)
    const [replyContent, setReplyContent] = useState('')
    const queryClient = useQueryClient()

    const replyMutation = useMutation({
        mutationFn: (data) => communityService.createComment(data),
        onSuccess: () => {
            toast.success('Reply posted!')
            setShowReplyInput(false)
            setReplyContent('')
            queryClient.invalidateQueries(['communityComments', postId])
        },
        onError: (error) => {
            const message = error.response?.data?.content?.[0] || 'Failed to post reply'
            toast.error(message)
        }
    })

    const handleSubmitReply = useCallback(() => {
        if (!replyContent.trim()) {
            toast.error('Please enter a reply')
            return
        }
        replyMutation.mutate({
            post: postId,
            parent: comment.id,
            content: replyContent.trim()
        })
    }, [replyContent, postId, comment.id, replyMutation])

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

    const repliesCount = comment.replies?.length || 0

    return (
        <div className={`${isReply ? 'ml-10 mt-3' : ''}`}>
            <div className={`p-4 rounded-xl ${comment.is_best_answer
                ? 'bg-gradient-to-r from-success-50 to-emerald-50 dark:from-success-900/20 dark:to-emerald-900/20 border-2 border-success-300 dark:border-success-700'
                : 'bg-surface-50 dark:bg-surface-800'
                }`}>
                {/* Best Answer Badge */}
                {comment.is_best_answer && (
                    <div className="flex items-center gap-1 text-success-600 text-sm font-medium mb-2">
                        <Trophy size={16} />
                        Best Answer
                    </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white text-sm font-semibold">
                            {comment.author?.first_name?.[0] || 'U'}
                        </div>
                        <div>
                            <p className="font-medium text-sm flex items-center gap-1">
                                {comment.author?.full_name || comment.author?.first_name || 'Anonymous'}
                                {(comment.author?.role === 'admin' || comment.author?.role === 'instructor') && (
                                    <BadgeCheck size={14} className="text-blue-500 fill-blue-500/10" title="Verified" />
                                )}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-surface-500">
                                <Clock size={10} />
                                {formatDate(comment.created_at)}
                            </div>
                        </div>
                    </div>

                    {/* Select as Best Answer - only for other users' comments */}
                    {canSelectBestAnswer && !comment.is_best_answer && !isReply && comment.author?.id !== postAuthorId && (
                        <button
                            onClick={() => onSelectBestAnswer?.(comment.id)}
                            className="flex items-center gap-1 text-xs text-success-600 hover:bg-success-50 dark:hover:bg-success-900/20 px-2 py-1 rounded-lg transition-colors"
                        >
                            <Trophy size={14} />
                            Mark Best
                        </button>
                    )}
                </div>

                {/* Content */}
                <p className="text-surface-700 dark:text-surface-300 whitespace-pre-wrap">
                    {comment.content}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-surface-200 dark:border-surface-700">
                    <button
                        onClick={() => onLike?.(comment.id)}
                        className={`flex items-center gap-1 text-sm transition-colors ${comment.is_liked
                            ? 'text-primary-500'
                            : 'text-surface-500 hover:text-primary-500'
                            }`}
                    >
                        <ThumbsUp size={14} fill={comment.is_liked ? 'currentColor' : 'none'} />
                        <span>{comment.likes_count || 0}</span>
                    </button>

                    {!isReply && (
                        <button
                            onClick={() => setShowReplyInput(!showReplyInput)}
                            className="flex items-center gap-1 text-sm text-surface-500 hover:text-primary-500 transition-colors"
                        >
                            <Reply size={14} />
                            Reply
                        </button>
                    )}

                    {/* Show replies toggle */}
                    {!isReply && repliesCount > 0 && (
                        <button
                            onClick={() => setShowReplies(!showReplies)}
                            className="flex items-center gap-1 text-sm text-primary-500 hover:text-primary-600 transition-colors ml-auto"
                        >
                            {showReplies ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            {showReplies ? 'Hide' : 'View'} {repliesCount} {repliesCount === 1 ? 'reply' : 'replies'}
                        </button>
                    )}
                </div>

                {/* Reply Input */}
                <AnimatePresence>
                    {showReplyInput && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 pt-3 border-t border-surface-200 dark:border-surface-700 overflow-hidden"
                        >
                            <textarea
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder="Write your reply..."
                                className="input w-full h-20 resize-none"
                            />
                            <div className="flex justify-end gap-2 mt-2">
                                <button
                                    onClick={() => {
                                        setShowReplyInput(false)
                                        setReplyContent('')
                                    }}
                                    className="btn-secondary text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmitReply}
                                    disabled={replyMutation.isPending}
                                    className="btn-primary text-sm"
                                >
                                    {replyMutation.isPending ? 'Posting...' : 'Reply'}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Nested Replies - Collapsible */}
            <AnimatePresence>
                {!isReply && showReplies && comment.replies && comment.replies.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2 mt-2 overflow-hidden"
                    >
                        {comment.replies.map((reply) => (
                            <CommentItem
                                key={reply.id}
                                comment={reply}
                                isReply
                                postId={postId}
                                onLike={onLike}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
})

CommentItem.displayName = 'CommentItem'

const CommentThread = ({
    comments,
    postId,
    postAuthorId,
    onSelectBestAnswer,
    canSelectBestAnswer = false
}) => {
    const queryClient = useQueryClient()

    const likeMutation = useMutation({
        mutationFn: (commentId) => communityService.likeComment(commentId),
        onSuccess: () => {
            queryClient.invalidateQueries(['communityComments', postId])
        }
    })

    const handleLike = useCallback((commentId) => {
        likeMutation.mutate(commentId)
    }, [likeMutation])

    return (
        <div className="space-y-4">
            {comments && comments.length > 0 ? (
                comments.map((comment) => (
                    <CommentItem
                        key={comment.id}
                        comment={comment}
                        postId={postId}
                        postAuthorId={postAuthorId}
                        canSelectBestAnswer={canSelectBestAnswer}
                        onSelectBestAnswer={onSelectBestAnswer}
                        onLike={handleLike}
                    />
                ))
            ) : (
                <div className="text-center py-8 text-surface-500">
                    <p>No answers yet</p>
                    <p className="text-sm mt-1">Be the first to answer!</p>
                </div>
            )}
        </div>
    )
}

export default memo(CommentThread)
