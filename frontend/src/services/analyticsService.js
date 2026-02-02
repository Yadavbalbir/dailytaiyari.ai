import api from './api'

export const analyticsService = {
  // Get dashboard stats
  getDashboardStats: async (examId) => {
    const response = await api.get('/analytics/dashboard/', {
      params: examId ? { exam_id: examId } : {},
    })
    return response.data
  },

  // Topic mastery
  getTopicMastery: async () => {
    const response = await api.get('/analytics/topic-mastery/')
    return response.data
  },

  getWeakTopics: async () => {
    const response = await api.get('/analytics/topic-mastery/weak_topics/')
    return response.data
  },

  getStrongTopics: async () => {
    const response = await api.get('/analytics/topic-mastery/strong_topics/')
    return response.data
  },

  getMasteryBySubject: async (subjectId) => {
    const response = await api.get('/analytics/topic-mastery/by_subject/', {
      params: { subject_id: subjectId },
    })
    return response.data
  },

  // Subject performance
  getSubjectPerformance: async (examId) => {
    const response = await api.get('/analytics/subject-performance/by_exam/', {
      params: { exam_id: examId },
    })
    return response.data
  },

  // Daily activity
  getTodayActivity: async () => {
    const response = await api.get('/analytics/daily-activity/today/')
    return response.data
  },

  getWeeklyActivity: async () => {
    const response = await api.get('/analytics/daily-activity/weekly/')
    return response.data
  },

  getChartData: async (days = 7) => {
    const response = await api.get('/analytics/daily-activity/chart_data/', {
      params: { days },
    })
    return response.data
  },

  // Streak
  getCurrentStreak: async (examId) => {
    const response = await api.get('/analytics/streaks/current/', {
      params: examId ? { exam_id: examId } : {},
    })
    return response.data
  },

  // Weekly reports
  getLatestReport: async () => {
    const response = await api.get('/analytics/weekly-reports/latest/')
    return response.data
  },
}

