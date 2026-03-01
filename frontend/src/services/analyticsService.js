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

  // Study Timer
  getStudyTimer: async () => {
    const response = await api.get('/analytics/study-timer/')
    return response.data
  },

  startStudyTimer: async () => {
    const response = await api.post('/analytics/study-timer/')
    return response.data
  },

  updateStudyTimer: async (elapsedSeconds) => {
    const response = await api.put('/analytics/study-timer/', {
      elapsed_seconds: elapsedSeconds,
    })
    return response.data
  },

  pauseStudyTimer: async () => {
    const response = await api.delete('/analytics/study-timer/')
    return response.data
  },

  // Study Goal
  getStudyGoal: async () => {
    const response = await api.get('/analytics/study-goal/')
    return response.data
  },

  updateStudyGoal: async (goalMinutes) => {
    const response = await api.put('/analytics/study-goal/', {
      daily_study_goal_minutes: goalMinutes,
    })
    return response.data
  },

  // Tenant Admin Stats
  getTenantAdminStats: async () => {
    const response = await api.get('/analytics/tenant-admin-stats/')
    return response.data
  },

  getTenantSubjectStats: async () => {
    const response = await api.get('/analytics/tenant-subject-stats/')
    return response.data
  },

  getTenantLeaderboard: async (limit = 10) => {
    const response = await api.get(`/analytics/tenant-leaderboard/?limit=${limit}`)
    return response.data
  },
}
