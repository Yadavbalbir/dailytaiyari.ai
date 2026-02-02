import api from './api'

export const quizService = {
  // Get quizzes
  getQuizzes: async (params = {}) => {
    const response = await api.get('/quiz/quizzes/', { params })
    return response.data
  },

  // Get quiz details
  getQuizDetails: async (quizId) => {
    const response = await api.get(`/quiz/quizzes/${quizId}/`)
    return response.data
  },

  // Get daily challenge
  getDailyChallenge: async (examId) => {
    const response = await api.get('/quiz/quizzes/daily_challenge/', {
      params: examId ? { exam_id: examId } : {},
    })
    return response.data
  },

  // Start quiz
  startQuiz: async (quizId) => {
    const response = await api.post(`/quiz/quizzes/${quizId}/start/`)
    return response.data
  },

  // Submit quiz
  submitQuiz: async (quizId, data) => {
    const response = await api.post(`/quiz/quizzes/${quizId}/submit/`, data)
    return response.data
  },

  // Get quiz attempts
  getAttempts: async () => {
    const response = await api.get('/quiz/attempts/')
    return response.data
  },

  // Get recent attempts
  getRecentAttempts: async () => {
    const response = await api.get('/quiz/attempts/recent/')
    return response.data
  },

  // Get attempt details
  getAttemptDetails: async (attemptId) => {
    const response = await api.get(`/quiz/attempts/${attemptId}/`)
    return response.data
  },

  // Get my attempts for a specific quiz
  getQuizAttempts: async (quizId) => {
    const response = await api.get(`/quiz/quizzes/${quizId}/my_attempts/`)
    return response.data
  },

  // Get attempt review (with answers and correct options)
  getAttemptReview: async (attemptId) => {
    const response = await api.get(`/quiz/attempts/${attemptId}/review/`)
    return response.data
  },

  // Mock Tests
  getMockTests: async (params = {}) => {
    const response = await api.get('/quiz/mock-tests/', { params })
    return response.data
  },

  getMockTestDetails: async (testId) => {
    const response = await api.get(`/quiz/mock-tests/${testId}/`)
    return response.data
  },

  startMockTest: async (testId) => {
    const response = await api.post(`/quiz/mock-tests/${testId}/start/`)
    return response.data
  },

  submitMockTest: async (testId, data) => {
    const response = await api.post(`/quiz/mock-tests/${testId}/submit/`, data)
    return response.data
  },

  // Get my attempts for a specific mock test
  getMockTestAttempts: async (testId) => {
    const response = await api.get(`/quiz/mock-tests/${testId}/my_attempts/`)
    return response.data
  },

  // Get mock test attempts
  getMockAttempts: async () => {
    const response = await api.get('/quiz/mock-attempts/')
    return response.data
  },

  // Get mock attempt details
  getMockAttemptDetails: async (attemptId) => {
    const response = await api.get(`/quiz/mock-attempts/${attemptId}/`)
    return response.data
  },

  // Get mock attempt review (with answers and correct options)
  getMockAttemptReview: async (attemptId) => {
    const response = await api.get(`/quiz/mock-attempts/${attemptId}/review/`)
    return response.data
  },

  // Questions by topic
  getQuestionsByTopic: async (topicId, limit = 10, difficulty) => {
    const response = await api.get('/quiz/questions/by_topic/', {
      params: { topic_id: topicId, limit, difficulty },
    })
    return response.data
  },
}

