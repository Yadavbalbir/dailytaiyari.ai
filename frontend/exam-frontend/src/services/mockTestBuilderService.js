import api from './api'

const list = (res) => {
  const d = res.data
  return Array.isArray(d) ? d : (d?.results ?? [])
}

const PAGE = { page_size: 500 }

/**
 * Admin builder + student attempt API for the rich Mock Test system.
 */
export const mockTestBuilderService = {
  // --- admin: mock tests ---
  list: async (params = {}) =>
    list(await api.get('/quiz/admin/mock-tests/', { params: { ...PAGE, ...params } })),
  get: async (id) => (await api.get(`/quiz/admin/mock-tests/${id}/`)).data,
  create: async (data) => (await api.post('/quiz/admin/mock-tests/', data)).data,
  update: async (id, data) => (await api.patch(`/quiz/admin/mock-tests/${id}/`, data)).data,
  remove: async (id) => api.delete(`/quiz/admin/mock-tests/${id}/`),
  recomputeMarks: async (id) =>
    (await api.post(`/quiz/admin/mock-tests/${id}/recompute_marks/`)).data,

  // --- admin: inline items ---
  listItems: async (mockTestId) =>
    list(await api.get('/quiz/admin/mock-items/', { params: { mock_test: mockTestId, ...PAGE } })),
  createItem: async (data) => (await api.post('/quiz/admin/mock-items/', data)).data,
  updateItem: async (id, data) => (await api.patch(`/quiz/admin/mock-items/${id}/`, data)).data,
  deleteItem: async (id) => api.delete(`/quiz/admin/mock-items/${id}/`),
  reorderItems: async (order) =>
    (await api.post('/quiz/admin/mock-items/reorder/', { order })).data,

  // --- admin: bank question linking ---
  getBankQuestions: async (mockTestId) =>
    (await api.get(`/quiz/admin/mock-tests/${mockTestId}/bank_questions/`)).data,
  addBankQuestions: async (mockTestId, payload) =>
    (await api.post(`/quiz/admin/mock-tests/${mockTestId}/add_bank_questions/`, payload)).data,
  removeBankQuestion: async (mockTestId, questionId) =>
    (await api.post(`/quiz/admin/mock-tests/${mockTestId}/remove_bank_question/`, { question_id: questionId })).data,
  searchBankQuestions: async (params = {}) =>
    list(await api.get('/quiz/admin/questions/', { params: { ...PAGE, ...params } })),

  // --- admin: helpers ---
  getCourses: async () =>
    list(await api.get('/courses/admin/courses/', { params: PAGE })),
  getLanguages: async () => (await api.get('/coding/meta/')).data,

  // --- student: rich attempt flow ---
  getPaper: async (testId) =>
    (await api.get(`/quiz/mock-tests/${testId}/paper/`)).data,
  startRich: async (testId) =>
    (await api.post(`/quiz/mock-tests/${testId}/start_rich/`)).data,
  submitRich: async (testId, data) =>
    (await api.post(`/quiz/mock-tests/${testId}/submit_rich/`, data)).data,
  runCode: async (testId, payload) =>
    (await api.post(`/quiz/mock-tests/${testId}/run_item/`, payload)).data,
}

export default mockTestBuilderService
