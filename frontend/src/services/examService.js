import api from './api'

export const examService = {
  // Get all exams
  getExams: async () => {
    const response = await api.get('/exams/')
    return response.data
  },

  // Get exam details
  getExamDetails: async (examId) => {
    const response = await api.get(`/exams/${examId}/`)
    return response.data
  },

  // Get subjects for an exam
  getSubjects: async (examId) => {
    const response = await api.get(`/exams/${examId}/subjects/`)
    return response.data
  },

  // Get topics for a subject
  getTopics: async (subjectId) => {
    const response = await api.get(`/exams/subjects/${subjectId}/topics/`)
    return response.data
  },

  // Get topic details
  getTopicDetails: async (topicId) => {
    const response = await api.get(`/exams/topics/${topicId}/`)
    return response.data
  },
}

