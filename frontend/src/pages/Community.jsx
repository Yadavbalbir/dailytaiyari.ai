import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    MessageCircle, ThumbsUp, Eye, CheckCircle,
    Plus, Filter, TrendingUp, Clock, HelpCircle,
    BarChart3, Zap, Trophy, Users
} from 'lucide-react'
import { communityService } from '../services/communityService'
import Loading from '../components/common/Loading'
import CreatePostModal from '../components/community/CreatePostModal'
import PostCard from '../components/community/PostCard'
import CommunityLeaderboard from '../components/community/CommunityLeaderboard'
import toast from 'react-hot-toast'

const Community = () => {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [activeTab, setActiveTab] = useState('all')
    const [sortBy, setSortBy] = useState('recent')
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [createType, setCreateType] = useState('question')

    // Fetch posts
    const { data: postsData, isLoading: postsLoading } = useQuery({
        queryKey: ['communityPosts', activeTab, sortBy],
        queryFn: () => communityService.getPosts({
            type: activeTab === 'all' ? undefined : activeTab,
            sort: sortBy,
            my_posts: activeTab === 'my_posts' ? 'true' : undefined
        })
    })

    // Fetch user stats
    const { data: myStats } = useQuery({
        queryKey: ['communityStats'],
        queryFn: () => communityService.getMyStats()
    })

    // Like mutation
    const likeMutation = useMutation({
        mutationFn: (postId) => communityService.likePost(postId),
        onSuccess: () => {
            queryClient.invalidateQueries(['communityPosts'])
        }
    })

    const posts = postsData?.results || postsData || []

    const tabs = [
        { id: 'all', label: 'All Posts', icon: Users },
        { id: 'question', label: 'Questions', icon: HelpCircle },
        { id: 'poll', label: 'Polls', icon: BarChart3 },
        { id: 'quiz', label: 'Quizzes', icon: Zap },
        { id: 'my_posts', label: 'My Posts', icon: MessageCircle },
    ]

    const sortOptions = [
        { id: 'recent', label: 'Recent', icon: Clock },
        { id: 'popular', label: 'Popular', icon: TrendingUp },
        { id: 'unanswered', label: 'Unanswered', icon: HelpCircle },
    ]

    const handleCreatePost = (type) => {
        setCreateType(type)
        setShowCreateModal(true)
    }

    if (postsLoading) return <Loading fullScreen />

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-display font-bold">Community Forum</h1>
                    <p className="text-surface-500 mt-1">
                        Ask questions, share knowledge, earn XP!
                    </p>
                </div>

                {/* Create Buttons */}
                <div className="flex items-center gap-2">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleCreatePost('question')}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus size={18} />
                        <span className="hidden sm:inline">Ask Question</span>
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleCreatePost('poll')}
                        className="btn-secondary flex items-center gap-2"
                    >
                        <BarChart3 size={18} />
                        <span className="hidden sm:inline">Create Poll</span>
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleCreatePost('quiz')}
                        className="btn-secondary flex items-center gap-2"
                    >
                        <Zap size={18} />
                        <span className="hidden sm:inline">Create Quiz</span>
                    </motion.button>
                </div>
            </div>

            {/* Stats Cards */}
            {myStats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="card p-4 text-center"
                    >
                        <div className="text-2xl font-bold text-primary-600">{myStats.posts_count || 0}</div>
                        <div className="text-sm text-surface-500">Posts</div>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="card p-4 text-center"
                    >
                        <div className="text-2xl font-bold text-accent-600">{myStats.answers_count || 0}</div>
                        <div className="text-sm text-surface-500">Answers</div>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="card p-4 text-center"
                    >
                        <div className="text-2xl font-bold text-warning-600 flex items-center justify-center gap-1">
                            <Trophy size={20} />
                            {myStats.best_answers_count || 0}
                        </div>
                        <div className="text-sm text-surface-500">Best Answers</div>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="card p-4 text-center"
                    >
                        <div className="text-2xl font-bold text-success-600">{myStats.total_community_xp || 0}</div>
                        <div className="text-sm text-surface-500">Community XP</div>
                    </motion.div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-3 space-y-4">
                    {/* Tabs */}
                    <div className="card p-2">
                        <div className="flex flex-wrap gap-1">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                                        ? 'bg-primary-500 text-white'
                                        : 'text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-800'
                                        }`}
                                >
                                    <tab.icon size={16} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Sort Options */}
                    <div className="flex items-center gap-2">
                        <Filter size={16} className="text-surface-500" />
                        <span className="text-sm text-surface-500">Sort by:</span>
                        {sortOptions.map((option) => (
                            <button
                                key={option.id}
                                onClick={() => setSortBy(option.id)}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-all ${sortBy === option.id
                                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600'
                                    : 'text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800'
                                    }`}
                            >
                                <option.icon size={14} />
                                {option.label}
                            </button>
                        ))}
                    </div>

                    {/* Posts List */}
                    <div className="space-y-4">
                        <AnimatePresence mode="popLayout">
                            {posts.length > 0 ? (
                                posts.map((post, index) => (
                                    <motion.div
                                        key={post.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <PostCard
                                            post={post}
                                            onLike={() => likeMutation.mutate(post.id)}
                                            onClick={() => navigate(`/community/${post.id}`)}
                                        />
                                    </motion.div>
                                ))
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="card p-12 text-center"
                                >
                                    <MessageSquare size={48} className="text-surface-400 mb-4 mx-auto" />
                                    <h3 className="text-lg font-semibold mb-2">No posts yet</h3>
                                    <p className="text-surface-500 mb-4">
                                        Be the first to start a discussion!
                                    </p>
                                    <button
                                        onClick={() => handleCreatePost('question')}
                                        className="btn-primary"
                                    >
                                        Ask a Question
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Sidebar - Leaderboard */}
                <div className="lg:col-span-1">
                    <CommunityLeaderboard />
                </div>
            </div>

            {/* Create Post Modal */}
            <CreatePostModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                postType={createType}
            />
        </div>
    )
}

export default Community
