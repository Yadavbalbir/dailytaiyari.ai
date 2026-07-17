import api from './api'

// Public landing-page data. Uses the shared `api` instance so every request
// carries the X-Tenant-ID header (required by the backend middleware), and
// works for anonymous visitors.
export const landingService = {
  getLanding: async () => {
    const response = await api.get('/landing/')
    return response.data
  },

  getLegal: async (docType) => {
    const response = await api.get(`/landing/legal/${docType}/`)
    return response.data
  },
}
