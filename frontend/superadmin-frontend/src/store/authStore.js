import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import * as svc from '../services/superadminService'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const data = await svc.login(email, password)
          set({
            user: data.user,
            tokens: { access: data.access, refresh: data.refresh },
            isAuthenticated: true,
            isLoading: false,
          })
          return { success: true }
        } catch (error) {
          const d = error.response?.data || {}
          const message =
            (Array.isArray(d.non_field_errors) && d.non_field_errors[0]) ||
            d.detail ||
            'Login failed. Check your credentials.'
          set({ error: message, isLoading: false })
          return { success: false, error: message }
        }
      },

      logout: () => {
        set({ user: null, tokens: null, isAuthenticated: false, error: null })
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'superadmin-auth',
      partialize: (s) => ({
        user: s.user,
        tokens: s.tokens,
        isAuthenticated: s.isAuthenticated,
      }),
    }
  )
)
