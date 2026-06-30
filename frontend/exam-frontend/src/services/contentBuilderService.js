import api from './api'

// Unwrap DRF pagination -> always return a plain array
const list = (res) => {
  const d = res.data
  return Array.isArray(d) ? d : d?.results || []
}

const PAGE = { page_size: 2000 }

/**
 * Admin Content Builder service.
 * Full CRUD over the hierarchy: Exam -> Subject -> Chapter -> Topic -> Content.
 */
export const contentBuilderService = {
  // ---- Exams ----
  getExams: async () => list(await api.get('/exams/admin/exams/', { params: PAGE })),
  createExam: async (data) => (await api.post('/exams/admin/exams/', data)).data,
  updateExam: async (id, data) => (await api.patch(`/exams/admin/exams/${id}/`, data)).data,
  deleteExam: async (id) => api.delete(`/exams/admin/exams/${id}/`),

  // ---- Subjects ----
  getSubjects: async (examId) =>
    list(await api.get('/exams/admin/subjects/', { params: { exam: examId, ...PAGE } })),
  createSubject: async (data) => (await api.post('/exams/admin/subjects/', data)).data,
  updateSubject: async (id, data) => (await api.patch(`/exams/admin/subjects/${id}/`, data)).data,
  deleteSubject: async (id) => api.delete(`/exams/admin/subjects/${id}/`),

  // ---- Chapters ----
  getChapters: async (subjectId) =>
    list(await api.get('/exams/admin/chapters/', { params: { subject: subjectId, ...PAGE } })),
  createChapter: async (data) => (await api.post('/exams/admin/chapters/', data)).data,
  updateChapter: async (id, data) => (await api.patch(`/exams/admin/chapters/${id}/`, data)).data,
  deleteChapter: async (id) => api.delete(`/exams/admin/chapters/${id}/`),

  // ---- Topics ----
  getTopics: async ({ chapterId, subjectId }) =>
    list(
      await api.get('/exams/admin/topics/', {
        params: { ...(chapterId ? { chapter: chapterId } : {}), ...(subjectId ? { subject: subjectId } : {}), ...PAGE },
      })
    ),
  createTopic: async (data) => (await api.post('/exams/admin/topics/', data)).data,
  updateTopic: async (id, data) => (await api.patch(`/exams/admin/topics/${id}/`, data)).data,
  deleteTopic: async (id) => api.delete(`/exams/admin/topics/${id}/`),

  // ---- Content ----
  getContents: async (topicId) =>
    list(await api.get('/content/admin/contents/', { params: { topic: topicId, ...PAGE } })),
  createContent: async (data) => (await api.post('/content/admin/contents/', data)).data,
  updateContent: async (id, data) => (await api.patch(`/content/admin/contents/${id}/`, data)).data,
  deleteContent: async (id) => api.delete(`/content/admin/contents/${id}/`),

  // ---- Quizzes ----
  getQuizzes: async (topicId) =>
    list(await api.get('/quiz/admin/quizzes/', { params: { topic: topicId, ...PAGE } })),
  createQuiz: async (data) => (await api.post('/quiz/admin/quizzes/', data)).data,
  updateQuiz: async (id, data) => (await api.patch(`/quiz/admin/quizzes/${id}/`, data)).data,
  deleteQuiz: async (id) => api.delete(`/quiz/admin/quizzes/${id}/`),

  // ---- Questions ----
  getQuestions: async (quizId) =>
    list(await api.get('/quiz/admin/questions/', { params: { quiz: quizId, ...PAGE } })),
  createQuestion: async (data) => (await api.post('/quiz/admin/questions/', data)).data,
  updateQuestion: async (id, data) => (await api.patch(`/quiz/admin/questions/${id}/`, data)).data,
  deleteQuestion: async (id) => api.delete(`/quiz/admin/questions/${id}/`),
}

export default contentBuilderService
