import api from './api'

const list = (res) => {
  const d = res.data
  return Array.isArray(d) ? d : d?.results || []
}

/**
 * Student-facing live-class service.
 * Live classes live under a Topic (mirrors coding problems). For now only
 * Google Meet classes exist; students join via `meeting_url`.
 */
export const liveClassService = {
  getByTopic: async (topicId) =>
    list(await api.get('/live-classes/classes/', { params: { topic: topicId } })),
  getClass: async (id) => (await api.get(`/live-classes/classes/${id}/`)).data,
}

export default liveClassService
