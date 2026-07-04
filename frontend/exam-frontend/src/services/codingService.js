import api from './api'

const list = (res) => {
  const d = res.data
  return Array.isArray(d) ? d : d?.results || []
}

/**
 * Student-facing coding service.
 * Problems live under a Topic (mirrors assignments). `run` executes against
 * sample cases (ungraded), `submit` runs all cases and persists a graded result.
 */
export const codingService = {
  getByTopic: async (topicId) =>
    list(await api.get('/coding/problems/', { params: { topic: topicId } })),
  getProblem: async (id) => (await api.get(`/coding/problems/${id}/`)).data,
  run: async (id, { language, source_code, stdin }) =>
    (await api.post(`/coding/problems/${id}/run/`, { language, source_code, stdin })).data,
  submit: async (id, { language, source_code }) =>
    (await api.post(`/coding/problems/${id}/submit/`, { language, source_code })).data,
  mySubmissions: async (id) =>
    (await api.get(`/coding/problems/${id}/my-submissions/`)).data,
  meta: async () => (await api.get('/coding/meta/')).data,
}

export default codingService
