import api from './api'

export const gamificationService = {
  // Badges
  getBadges: async () => {
    const response = await api.get('/gamification/badges/')
    return response.data
  },

  getMyBadges: async () => {
    const response = await api.get('/gamification/my-badges/')
    return response.data
  },

  checkNewBadges: async () => {
    const response = await api.post('/gamification/my-badges/check_new/')
    return response.data
  },

  // XP
  getXPHistory: async () => {
    const response = await api.get('/gamification/xp-history/')
    return response.data
  },

  getXPSummary: async () => {
    const response = await api.get('/gamification/xp-history/summary/')
    return response.data
  },

  // Leaderboard
  getLeaderboard: async (period = 'daily', examId, limit = 50) => {
    const response = await api.get('/gamification/leaderboard/', {
      params: { period, exam_id: examId, limit },
    })
    return response.data
  },

  // Challenges
  getActiveChallenges: async () => {
    const response = await api.get('/gamification/challenges/active/')
    return response.data
  },

  joinChallenge: async (challengeId) => {
    const response = await api.post(`/gamification/challenges/${challengeId}/join/`)
    return response.data
  },

  getMyChallenges: async () => {
    const response = await api.get('/gamification/my-challenges/')
    return response.data
  },

  claimRewards: async (participationId) => {
    const response = await api.post(
      `/gamification/my-challenges/${participationId}/claim_rewards/`
    )
    return response.data
  },
}

