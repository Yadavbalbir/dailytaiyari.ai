/**
 * Community Forum API Service
 */
import api from './api'

export const communityService = {
    // Posts
    getPosts: async (params = {}) => {
        const response = await api.get('/community/posts/', { params })
        return response.data
    },

    getPost: async (id) => {
        const response = await api.get(`/community/posts/${id}/`)
        return response.data
    },

    createPost: async (data) => {
        const config = {}
        let payload = data
        if (data instanceof FormData) {
            config.headers = { 'Content-Type': 'multipart/form-data' }
        }
        const response = await api.post('/community/posts/', payload, config)
        return response.data
    },


    updatePost: async (id, data) => {
        const response = await api.patch(`/community/posts/${id}/`, data)
        return response.data
    },

    deletePost: async (id) => {
        await api.delete(`/community/posts/${id}/`)
    },

    likePost: async (id) => {
        const response = await api.post(`/community/posts/${id}/like/`)
        return response.data
    },

    markSolved: async (id) => {
        const response = await api.post(`/community/posts/${id}/mark_solved/`)
        return response.data
    },

    selectBestAnswer: async (postId, commentId) => {
        const response = await api.post(`/community/posts/${postId}/select_best_answer/`, {
            comment_id: commentId
        })
        return response.data
    },

    votePoll: async (postId, optionId) => {
        const response = await api.post(`/community/posts/${postId}/vote_poll/`, {
            option_id: optionId
        })
        return response.data
    },

    // Comments
    getComments: async (postId) => {
        const response = await api.get('/community/comments/', {
            params: { post: postId }
        })
        return response.data
    },

    createComment: async (data) => {
        const config = {}
        if (data instanceof FormData) {
            config.headers = { 'Content-Type': 'multipart/form-data' }
        }
        const response = await api.post('/community/comments/', data, config)
        return response.data
    },


    likeComment: async (id) => {
        const response = await api.post(`/community/comments/${id}/like/`)
        return response.data
    },

    deleteComment: async (id) => {
        await api.delete(`/community/comments/${id}/`)
    },

    // Quiz
    submitQuizAttempt: async (quizId, selectedAnswer) => {
        const response = await api.post('/community/quiz-attempts/', {
            quiz: quizId,
            selected_answer: selectedAnswer
        })
        return response.data
    },

    // Stats
    getMyStats: async () => {
        const response = await api.get('/community/stats/my_stats/')
        return response.data
    },

    getUserStats: async (userId) => {
        const response = await api.get('/community/stats/user_stats/', {
            params: { user_id: userId }
        })
        return response.data
    },

    // Leaderboard
    getLeaderboard: async (period = 'weekly') => {
        const response = await api.get(`/community/leaderboard/${period}/`)
        return response.data
    }
}

export default communityService
