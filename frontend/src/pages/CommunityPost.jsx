import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    ArrowLeft, ThumbsUp, MessageCircle, Eye, Share2,
    CheckCircle, Clock, BarChart3, Zap, Trophy, Send,
    BadgeCheck
} from 'lucide-react'
import { communityService } from '../services/communityService'
import { useAuthStore } from '../context/authStore'
import Loading from '../components/common/Loading'
import CommentThread from '../components/community/CommentThread'
import toast from 'react-hot-toast'

const CommunityPost = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const { user, profile } = useAuthStore()
    const [newComment, setNewComment] = useState('')
    const [selectedPollOption, setSelectedPollOption] = useState(null)
    const [selectedQuizAnswer, setSelectedQuizAnswer] = useState(null)
    const [quizSubmitted, setQuizSubmitted] = useState(false)

    // Fetch post
    const { data: post, isLoading: postLoading } = useQuery({
        queryKey: ['communityPost', id],
        queryFn: () => communityService.getPost(id)
    })

    // Fetch comments
    const { data: commentsData, isLoading: commentsLoading } = useQuery({
        queryKey: ['communityComments', id],
        queryFn: () => communityService.getComments(id)
    })

    // Like post
    const likeMutation = useMutation({
        mutationFn: () => communityService.likePost(id),
        onSuccess: () => {
            queryClient.invalidateQueries(['communityPost', id])
        }
    })

    // Add comment
    const commentMutation = useMutation({
        mutationFn: (content) => communityService.createComment({ post: id, content }),
        onSuccess: () => {
            toast.success('Answer posted! +15 XP earned 🎉')
            setNewComment('')
            queryClient.invalidateQueries(['communityComments', id])
            queryClient.invalidateQueries(['communityPost', id])
        },
        onError: (error) => {
            const message = error.response?.data?.content?.[0] || 'Failed to post answer'
            toast.error(message)
        }
    })

    // Vote poll
    const pollMutation = useMutation({
        mutationFn: (optionId) => communityService.votePoll(id, optionId),
        onSuccess: (data) => {
            toast.success('Vote recorded! +2 XP')
            queryClient.setQueryData(['communityPost', id], data)
        }
    })

    // Submit quiz attempt
    const quizMutation = useMutation({
        mutationFn: (answer) => communityService.submitQuizAttempt(post.quiz.id, answer),
        onSuccess: (data) => {
            setQuizSubmitted(true)
            if (data.is_correct) {
                toast.success('Correct! +5 XP earned 🎉')
            } else {
                toast.error('Incorrect. Try again next time!')
            }
            queryClient.invalidateQueries(['communityPost', id])
        }
    })

    // Select best answer
    const bestAnswerMutation = useMutation({
        mutationFn: (commentId) => communityService.selectBestAnswer(id, commentId),
        onSuccess: () => {
            toast.success('Best answer selected!')
            queryClient.invalidateQueries(['communityPost', id])
            queryClient.invalidateQueries(['communityComments', id])
        }
    })

    const handleSubmitComment = () => {
        if (!newComment.trim()) {
            toast.error('Please enter an answer')
            return
        }
        commentMutation.mutate(newComment.trim())
    }

    const handlePollVote = () => {
        if (selectedPollOption === null) {
            toast.error('Please select an option')
            return
        }
        pollMutation.mutate(selectedPollOption)
    }

    const handleQuizSubmit = () => {
        if (selectedQuizAnswer === null) {
            toast.error('Please select an answer')
            return
        }
        quizMutation.mutate(selectedQuizAnswer)
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (postLoading) return <Loading fullScreen />

    if (!post) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-semibold">Post not found</h2>
                <button onClick={() => navigate('/community')} className="btn-primary mt-4">
                    Back to Community
                </button>
            </div>
        )
    }

    const isAuthor = user?.id === post.author?.id
    const comments = commentsData?.results || commentsData || []
    const hasVoted = post.user_poll_vote !== null
    const hasAttemptedQuiz = post.quiz?.user_attempt !== null

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Back Button */}
            <button
                onClick={() => navigate('/community')}
                className="flex items-center gap-2 text-surface-600 hover:text-primary-500 transition-colors"
            >
                <ArrowLeft size={20} />
                Back to Community
            </button>

            {/* Post Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card p-6"
            >
                {/* Type Badge */}
                <div className="flex items-center justify-between mb-4">
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${post.post_type === 'question' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20' :
                        post.post_type === 'poll' ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/20' :
                            'bg-amber-50 text-amber-600 dark:bg-amber-900/20'
                        }`}>
                        {post.post_type === 'question' && <MessageCircle size={16} />}
                        {post.post_type === 'poll' && <BarChart3 size={16} />}
                        {post.post_type === 'quiz' && <Zap size={16} />}
                        {post.post_type.charAt(0).toUpperCase() + post.post_type.slice(1)}
                    </div>

                    {post.is_solved && (
                        <div className="flex items-center gap-1 text-success-500 text-sm font-medium">
                            <CheckCircle size={16} />
                            Solved
                        </div>
                    )}
                </div>

                {/* Author */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white text-lg font-semibold">
                        {post.author?.first_name?.[0] || 'U'}
                    </div>
                    <div>
                        <p className="font-medium flex items-center gap-1">
                            {post.author?.full_name || post.author?.first_name || 'Anonymous'}
                            {(post.author?.role === 'admin' || post.author?.role === 'instructor') && (
                                <BadgeCheck size={16} className="text-blue-500 fill-blue-500/10" title="Verified" />
                            )}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-surface-500">
                            <Clock size={14} />
                            {formatDate(post.created_at)}
                            {post.author?.current_level && (
                                <>
                                    <span>•</span>
                                    <span className="text-primary-500">Level {post.author.current_level}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-2xl font-bold mb-4">{post.title}</h1>

                {/* Content */}
                <div className="prose dark:prose-invert max-w-none mb-6">
                    <p className="whitespace-pre-wrap">{post.content}</p>
                </div>

                {/* Poll Options */}
                {post.post_type === 'poll' && post.poll_options && (
                    <div className="space-y-3 mb-6">
                        <h3 className="font-semibold">Poll Options</h3>
                        {post.poll_options.map((option) => {
                            const totalVotes = post.poll_options.reduce((sum, o) => sum + o.votes_count, 0)
                            const percentage = totalVotes > 0 ? (option.votes_count / totalVotes) * 100 : 0
                            const isSelected = selectedPollOption === option.id || post.user_poll_vote === option.id

                            return (
                                <motion.button
                                    key={option.id}
                                    whileHover={{ scale: hasVoted ? 1 : 1.01 }}
                                    onClick={() => !hasVoted && setSelectedPollOption(option.id)}
                                    disabled={hasVoted}
                                    className={`w-full p-4 rounded-xl border-2 transition-all relative overflow-hidden ${isSelected
                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                        : 'border-surface-200 dark:border-surface-700 hover:border-primary-300'
                                        }`}
                                >
                                    {hasVoted && (
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${percentage}%` }}
                                            className="absolute inset-y-0 left-0 bg-primary-100 dark:bg-primary-900/30"
                                        />
                                    )}
                                    <div className="relative flex items-center justify-between">
                                        <span className="font-medium">{option.option_text}</span>
                                        {hasVoted && (
                                            <span className="text-sm text-surface-500">
                                                {option.votes_count} votes ({percentage.toFixed(1)}%)
                                            </span>
                                        )}
                                    </div>
                                </motion.button>
                            )
                        })}
                        {!hasVoted && (
                            <button
                                onClick={handlePollVote}
                                disabled={selectedPollOption === null || pollMutation.isPending}
                                className="btn-primary w-full mt-2"
                            >
                                {pollMutation.isPending ? 'Voting...' : 'Vote'}
                            </button>
                        )}
                    </div>
                )}

                {/* Quiz */}
                {post.post_type === 'quiz' && post.quiz && (
                    <div className="space-y-4 mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                        <h3 className="font-semibold">Quiz Question</h3>
                        <p className="text-lg">{post.quiz.question}</p>

                        <div className="space-y-2">
                            {post.quiz.options.map((option, index) => {
                                const isCorrect = hasAttemptedQuiz && index === post.quiz.correct_answer
                                const userSelected = hasAttemptedQuiz && index === post.quiz.user_attempt?.selected_answer
                                const isSelected = selectedQuizAnswer === index

                                return (
                                    <motion.button
                                        key={index}
                                        whileHover={{ scale: hasAttemptedQuiz ? 1 : 1.01 }}
                                        onClick={() => !hasAttemptedQuiz && setSelectedQuizAnswer(index)}
                                        disabled={hasAttemptedQuiz}
                                        className={`w-full p-3 rounded-lg border-2 text-left transition-all ${hasAttemptedQuiz && isCorrect
                                            ? 'border-success-500 bg-success-50 dark:bg-success-900/20'
                                            : hasAttemptedQuiz && userSelected && !isCorrect
                                                ? 'border-error-500 bg-error-50 dark:bg-error-900/20'
                                                : isSelected
                                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                                    : 'border-surface-200 dark:border-surface-700'
                                            }`}
                                    >
                                        <span className="font-medium mr-2">
                                            {String.fromCharCode(65 + index)}.
                                        </span>
                                        {option}
                                        {hasAttemptedQuiz && isCorrect && (
                                            <CheckCircle size={16} className="inline ml-2 text-success-500" />
                                        )}
                                    </motion.button>
                                )
                            })}
                        </div>

                        {!hasAttemptedQuiz && (
                            <button
                                onClick={handleQuizSubmit}
                                disabled={selectedQuizAnswer === null || quizMutation.isPending}
                                className="btn-primary w-full"
                            >
                                {quizMutation.isPending ? 'Checking...' : 'Submit Answer'}
                            </button>
                        )}

                        {hasAttemptedQuiz && post.quiz.explanation && (
                            <div className="p-3 bg-white dark:bg-surface-800 rounded-lg">
                                <p className="text-sm font-medium mb-1">Explanation:</p>
                                <p className="text-sm text-surface-600 dark:text-surface-400">
                                    {post.quiz.explanation}
                                </p>
                            </div>
                        )}

                        <div className="flex items-center gap-4 text-sm text-surface-500">
                            <span>{post.quiz.attempts_count} attempts</span>
                            <span>{post.quiz.success_rate}% success rate</span>
                        </div>
                    </div>
                )}

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                        {post.tags.map((tag, idx) => (
                            <span
                                key={idx}
                                className="px-3 py-1 bg-surface-100 dark:bg-surface-700 rounded-full text-sm"
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-4 pt-4 border-t border-surface-200 dark:border-surface-700">
                    <button
                        onClick={() => likeMutation.mutate()}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${post.is_liked
                            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600'
                            : 'hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-600'
                            }`}
                    >
                        <ThumbsUp size={18} fill={post.is_liked ? 'currentColor' : 'none'} />
                        <span>{post.likes_count || 0}</span>
                    </button>

                    <div className="flex items-center gap-2 text-surface-500">
                        <MessageCircle size={18} />
                        <span>{post.comments_count || 0} answers</span>
                    </div>

                    <div className="flex items-center gap-2 text-surface-500">
                        <Eye size={18} />
                        <span>{post.views_count || 0} views</span>
                    </div>
                </div>
            </motion.div>

            {/* Add Answer/Comment */}
            {(post.post_type === 'question' || post.post_type === 'poll') && (
                <div className="card p-6">
                    <h3 className="font-semibold mb-4">
                        {post.post_type === 'question' ? 'Your Answer' : 'Add Comment'}
                    </h3>
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={post.post_type === 'question'
                            ? "Write your answer here... Be helpful and detailed!"
                            : "Share your thoughts on this poll..."}
                        className="input w-full h-32 resize-none"
                    />
                    <div className="flex justify-between items-center mt-4">
                        <p className="text-sm text-surface-500">
                            {post.post_type === 'question'
                                ? 'Earn +15 XP for answering, +50 XP if selected as best answer!'
                                : 'Earn +15 XP for commenting!'}
                        </p>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleSubmitComment}
                            disabled={commentMutation.isPending}
                            className="btn-primary flex items-center gap-2"
                        >
                            <Send size={16} />
                            {commentMutation.isPending ? 'Posting...' : (post.post_type === 'question' ? 'Post Answer' : 'Post Comment')}
                        </motion.button>
                    </div>
                </div>
            )}

            {/* Comments/Answers */}
            {(post.post_type === 'question' || post.post_type === 'poll') && (
                <div className="card p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <MessageCircle size={18} />
                        {comments.length} {post.post_type === 'question'
                            ? (comments.length === 1 ? 'Answer' : 'Answers')
                            : (comments.length === 1 ? 'Comment' : 'Comments')}
                    </h3>

                    {commentsLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-24 bg-surface-100 dark:bg-surface-800 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : (
                        <CommentThread
                            comments={comments}
                            postId={id}
                            postAuthorId={post.author?.id}
                            canSelectBestAnswer={isAuthor && !post.is_solved && post.post_type === 'question'}
                            onSelectBestAnswer={(commentId) => bestAnswerMutation.mutate(commentId)}
                        />
                    )}
                </div>
            )}
        </div>
    )
}

export default CommunityPost
