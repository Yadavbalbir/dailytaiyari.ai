import api from './api'

export const login = (email, password) =>
  api.post('/superadmin/auth/login/', { email, password }).then((r) => r.data)

export const fetchMe = () => api.get('/superadmin/auth/me/').then((r) => r.data)

export const fetchStats = () => api.get('/superadmin/stats/').then((r) => r.data)

export const fetchTenants = (params = {}) =>
  api.get('/superadmin/tenants/', { params }).then((r) => r.data)

export const createTenant = (payload) =>
  api.post('/superadmin/tenants/', payload).then((r) => r.data)

export const fetchTenant = (id) =>
  api.get(`/superadmin/tenants/${id}/`).then((r) => r.data)

export const updateTenant = (id, payload) =>
  api.patch(`/superadmin/tenants/${id}/`, payload).then((r) => r.data)
