import api from './api'

// Tenant-admin Home Page Builder data (auth + admin role required).
export const landingAdminService = {
  getLanding: async () => {
    const response = await api.get('/tenant-admin/landing/')
    return response.data
  },

  saveLanding: async (payload) => {
    const response = await api.put('/tenant-admin/landing/', payload)
    return response.data
  },

  getLegal: async (docType) => {
    const response = await api.get(`/tenant-admin/landing/legal/${docType}/`)
    return response.data
  },

  saveLegal: async (docType, { title, content }) => {
    const response = await api.put(`/tenant-admin/landing/legal/${docType}/`, {
      title,
      content,
    })
    return response.data
  },
}
