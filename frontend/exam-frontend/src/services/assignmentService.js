import api from './api'

const list = (res) => {
  const d = res.data
  return Array.isArray(d) ? d : d?.results || []
}

/** Student assignment service: list by topic, detail, submit (text/PDF). */
export const assignmentService = {
  getByTopic: async (topicId) =>
    list(await api.get('/assignments/', { params: { topic: topicId } })),
  get: async (id) => (await api.get(`/assignments/${id}/`)).data,
  submit: async (id, { submission_text, submission_file }) => {
    const fd = new FormData()
    if (submission_text != null) fd.append('submission_text', submission_text)
    if (submission_file instanceof File) fd.append('submission_file', submission_file)
    return (await api.post(`/assignments/${id}/submit/`, fd, {
      headers: { 'Content-Type': undefined },
    })).data
  },
  // Auth-streamed question paper (view-only). Fetch as arraybuffer for the reader.
  paperUrl: (id) => `/assignments/${id}/paper/`,
}

export default assignmentService
