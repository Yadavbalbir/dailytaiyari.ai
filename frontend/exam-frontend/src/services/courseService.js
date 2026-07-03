import api from './api'

export const courseService = {
  getCourses: async () => {
    const response = await api.get('/courses/')
    return response.data
  },

  /** Courses for enrollment — includes tenant courses so the catalog is never empty */
  getAvailableCoursesForEnrollment: async () => {
    const response = await api.get('/courses/available-for-enrollment/')
    return response.data
  },

  getCourseDetails: async (courseId) => {
    const response = await api.get(`/courses/${courseId}/`)
    return response.data
  },

  getSubjects: async (courseId) => {
    const response = await api.get(`/courses/${courseId}/subjects/`)
    return response.data
  },

  getTopics: async (subjectId) => {
    const response = await api.get(`/courses/subjects/${subjectId}/topics/`)
    return response.data
  },

  getTopicDetails: async (topicId) => {
    const response = await api.get(`/courses/topics/${topicId}/`)
    return response.data
  },

  // Study flow: enrolled courses (approved) + pending requests
  getStudyCourses: async () => {
    const response = await api.get('/courses/study/courses/')
    const d = response.data
    // Backend returns { courses: [...], pending: [...] }; keep back-compat with array
    if (Array.isArray(d)) return { courses: d, pending: [] }
    return { courses: d.courses || [], pending: d.pending || [] }
  },

  getStudySubjects: async (courseId = null) => {
    const params = courseId ? { course_id: courseId } : {}
    const response = await api.get('/courses/study/subjects/', { params })
    return response.data
  },

  getStudyChapters: async (subjectId) => {
    const response = await api.get(`/courses/study/chapters/${subjectId}/`)
    return response.data
  },

  getStudyChapterDetail: async (chapterId) => {
    const response = await api.get(`/courses/study/chapter/${chapterId}/`)
    return response.data
  },

  getStudyLeaderboard: async (scope, scopeId) => {
    const response = await api.get('/courses/study/leaderboard/', {
      params: { scope, scope_id: scopeId },
    })
    return response.data
  },

  // Enrollments: list and request enrollment in a course
  getEnrollments: async () => {
    const response = await api.get('/auth/enrollments/')
    return response.data
  },
  requestEnrollment: async (courseId) => {
    const response = await api.post('/auth/enrollments/', { course: courseId })
    return response.data
  },
  unenroll: async (enrollmentId) => {
    await api.delete(`/auth/enrollments/${enrollmentId}/`)
  },
}
