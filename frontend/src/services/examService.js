import api from './api'

export const examService = {
  getExams: async () => {
    const response = await api.get('/exams/')
    return response.data
  },

  getExamDetails: async (examId) => {
    const response = await api.get(`/exams/${examId}/`)
    return response.data
  },

  getSubjects: async (examId) => {
    const response = await api.get(`/exams/${examId}/subjects/`)
    return response.data
  },

  getTopics: async (subjectId) => {
    const response = await api.get(`/exams/subjects/${subjectId}/topics/`)
    return response.data
  },

  getTopicDetails: async (topicId) => {
    const response = await api.get(`/exams/topics/${topicId}/`)
    return response.data
  },

  // Study flow APIs
  getStudySubjects: async () => {
    const response = await api.get('/exams/study/subjects/')
    return response.data
  },

  getStudyChapters: async (subjectId) => {
    const response = await api.get(`/exams/study/chapters/${subjectId}/`)
    return response.data
  },

  getStudyChapterDetail: async (chapterId) => {
    const response = await api.get(`/exams/study/chapter/${chapterId}/`)
    return response.data
  },

  getStudyLeaderboard: async (scope, scopeId) => {
    const response = await api.get('/exams/study/leaderboard/', {
      params: { scope, scope_id: scopeId },
    })
    return response.data
  },
}

