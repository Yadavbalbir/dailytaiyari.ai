import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach the super-admin access token on every request.
api.interceptors.request.use(
  (config) => {
    const raw = localStorage.getItem('superadmin-auth')
    if (raw) {
      try {
        const { state } = JSON.parse(raw)
        if (state?.tokens?.access) {
          config.headers.Authorization = `Bearer ${state.tokens.access}`
        }
      } catch {
        /* ignore malformed storage */
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

// On 401, try a single refresh, otherwise bounce to login.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const raw = localStorage.getItem('superadmin-auth')
      if (raw) {
        try {
          const { state } = JSON.parse(raw)
          if (state?.tokens?.refresh) {
            const res = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
              refresh: state.tokens.refresh,
            })
            const newState = {
              ...state,
              tokens: { ...state.tokens, access: res.data.access },
            }
            localStorage.setItem('superadmin-auth', JSON.stringify({ state: newState }))
            original.headers.Authorization = `Bearer ${res.data.access}`
            return api(original)
          }
        } catch {
          localStorage.removeItem('superadmin-auth')
          window.location.href = '/login'
          return Promise.reject(error)
        }
      }
      localStorage.removeItem('superadmin-auth')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
