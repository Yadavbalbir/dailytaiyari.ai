import api from './api'

export const examService = {
  getExams: async () => {
    const response = await api.get('/exams/')
    return response.data
  },

  /** Exams for enrollment dropdown — includes tenant + platform exams so list is never empty */
  getAvailableExamsForEnrollment: async () => {
    const response = await api.get('/exams/available-for-enrollment/')
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

  // Study flow: exams (enrolled or active) then subjects
  getStudyExams: async () => {
    const response = await api.get('/exams/study/exams/')
    return response.data
  },

  getStudySubjects: async (examId = null) => {
    const params = examId ? { exam_id: examId } : {}
    const response = await api.get('/exams/study/subjects/', { params })
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

  // Enrollments: list and enroll in an exam
  getEnrollments: async () => {
    const response = await api.get('/auth/enrollments/')
    return response.data
  },
  enrollInExam: async (examId) => {
    const response = await api.post('/auth/enrollments/', { exam: examId })
    return response.data
  },
  unenroll: async (enrollmentId) => {
    await api.delete(`/auth/enrollments/${enrollmentId}/`)
  },
}

