import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../services/api'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      tokens: null,
      isAuthenticated: false,
      isOnboarded: false,
      isLoading: false,
      error: null,

      // Login action
      login: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const response = await api.post('/auth/login/', { email, password })
          const { access, refresh, user } = response.data
          
          set({
            user,
            tokens: { access, refresh },
            isAuthenticated: true,
            isOnboarded: user.is_onboarded,
            isLoading: false,
          })
          
          // Fetch profile if onboarded
          if (user.is_onboarded) {
            get().fetchProfile()
          }
          
          return { success: true }
        } catch (error) {
          const message = error.response?.data?.detail || 'Login failed'
          set({ error: message, isLoading: false })
          return { success: false, error: message }
        }
      },

      // Register action
      register: async (data) => {
        set({ isLoading: true, error: null })
        try {
          await api.post('/auth/register/', data)
          // Auto-login after registration
          return get().login(data.email, data.password)
        } catch (error) {
          const message = error.response?.data?.email?.[0] || 
                         error.response?.data?.detail || 
                         'Registration failed'
          set({ error: message, isLoading: false })
          return { success: false, error: message }
        }
      },

      // Complete onboarding
      completeOnboarding: async (data) => {
        set({ isLoading: true, error: null })
        try {
          const response = await api.post('/auth/onboarding/', data)
          set({
            profile: response.data.profile,
            isOnboarded: true,
            isLoading: false,
          })
          return { success: true }
        } catch (error) {
          const message = error.response?.data?.detail || 'Onboarding failed'
          set({ error: message, isLoading: false })
          return { success: false, error: message }
        }
      },

      // Fetch user profile
      fetchProfile: async () => {
        try {
          const response = await api.get('/auth/profile/')
          set({ profile: response.data })
          return response.data
        } catch (error) {
          console.error('Failed to fetch profile:', error)
          return null
        }
      },

      // Update profile
      updateProfile: async (data) => {
        try {
          const response = await api.patch('/auth/profile/', data)
          set({ profile: response.data })
          return { success: true }
        } catch (error) {
          return { success: false, error: 'Failed to update profile' }
        }
      },

      // Refresh token
      refreshToken: async () => {
        const { tokens } = get()
        if (!tokens?.refresh) return false
        
        try {
          const response = await api.post('/auth/refresh/', {
            refresh: tokens.refresh,
          })
          set({
            tokens: {
              ...tokens,
              access: response.data.access,
            },
          })
          return true
        } catch (error) {
          get().logout()
          return false
        }
      },

      // Logout
      logout: () => {
        set({
          user: null,
          profile: null,
          tokens: null,
          isAuthenticated: false,
          isOnboarded: false,
          error: null,
        })
      },

      // Clear error
      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        profile: state.profile,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
        isOnboarded: state.isOnboarded,
      }),
    }
  )
)

