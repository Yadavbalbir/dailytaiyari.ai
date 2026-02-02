import api from './api'

export const contentService = {
  // Get content list
  getContent: async (params = {}) => {
    const response = await api.get('/content/', { params })
    return response.data
  },

  // Get content by topic
  getContentByTopic: async (topicId) => {
    const response = await api.get('/content/by_topic/', {
      params: { topic_id: topicId },
    })
    return response.data
  },

  // Get content details
  getContentDetails: async (contentId) => {
    const response = await api.get(`/content/${contentId}/`)
    return response.data
  },

  // Get recommended content
  getRecommendedContent: async () => {
    const response = await api.get('/content/recommended/')
    return response.data
  },

  // Update content progress
  updateProgress: async (contentId, data) => {
    const response = await api.post(`/content/progress/`, {
      content: contentId,
      ...data,
    })
    return response.data
  },

  // Mark content complete
  markComplete: async (progressId) => {
    const response = await api.post(`/content/progress/${progressId}/complete/`)
    return response.data
  },

  // Toggle bookmark
  toggleBookmark: async (progressId) => {
    const response = await api.post(`/content/progress/${progressId}/toggle_bookmark/`)
    return response.data
  },

  // Get today's study plan
  getTodayStudyPlan: async (examId) => {
    const response = await api.get('/content/study-plans/today/', {
      params: examId ? { exam_id: examId } : {},
    })
    return response.data
  },

  // Generate study plan
  generateStudyPlan: async (data) => {
    const response = await api.post('/content/study-plans/generate/', data)
    return response.data
  },

  // Update study plan item status
  updateStudyPlanItem: async (itemId, action) => {
    const response = await api.post(`/content/study-plan-items/${itemId}/${action}/`)
    return response.data
  },
}

