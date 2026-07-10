import api from './api'

const list = (res) => {
  const d = res.data
  return Array.isArray(d) ? d : d?.results || []
}

/** Student-facing job portal service. */
export const jobService = {
  getJobs: async (params = {}) => list(await api.get('/jobs/', { params })),
  get: async (id) => (await api.get(`/jobs/${id}/`)).data,
  myApplications: async () => list(await api.get('/jobs/my-applications/')),

  apply: async (id, { full_name, email, phone, cover_letter, portfolio_url, linkedin_url, resume }) => {
    const fd = new FormData()
    if (full_name != null) fd.append('full_name', full_name)
    if (email != null) fd.append('email', email)
    if (phone != null) fd.append('phone', phone)
    if (cover_letter != null) fd.append('cover_letter', cover_letter)
    if (portfolio_url != null) fd.append('portfolio_url', portfolio_url)
    if (linkedin_url != null) fd.append('linkedin_url', linkedin_url)
    if (resume instanceof File) fd.append('resume', resume)
    return (await api.post(`/jobs/${id}/apply/`, fd, {
      headers: { 'Content-Type': undefined },
    })).data
  },

  applyExternal: async (id) => (await api.post(`/jobs/${id}/apply-external/`)).data,
  withdraw: async (id) => (await api.post(`/jobs/${id}/withdraw/`)).data,
}

/** Admin job portal service (tenant-admin only). */
export const jobAdminService = {
  getJobs: async (params = {}) => list(await api.get('/jobs/admin/jobs/', { params })),
  getJob: async (id) => (await api.get(`/jobs/admin/jobs/${id}/`)).data,
  createJob: async (data) => (await api.post('/jobs/admin/jobs/', data)).data,
  updateJob: async (id, data) => (await api.patch(`/jobs/admin/jobs/${id}/`, data)).data,
  deleteJob: async (id) => (await api.delete(`/jobs/admin/jobs/${id}/`)).data,
  getApplications: async (jobId) => (await api.get(`/jobs/admin/jobs/${jobId}/applications/`)).data,

  getApplication: async (id) => (await api.get(`/jobs/admin/applications/${id}/`)).data,
  moveStage: async (id, stage, note = '') =>
    (await api.post(`/jobs/admin/applications/${id}/move-stage/`, { stage, note })).data,
  addNote: async (id, note) =>
    (await api.post(`/jobs/admin/applications/${id}/add-note/`, { note })).data,
  resumeUrl: (id) => `/jobs/admin/applications/${id}/resume/`,
  overview: async () => (await api.get('/jobs/admin/applications/overview/')).data,
}

export default jobService
