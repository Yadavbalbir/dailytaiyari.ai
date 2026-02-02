import { create } from 'zustand'

export const useAppStore = create((set) => ({
  // Theme
  darkMode: false,
  toggleDarkMode: () => set((state) => {
    const newMode = !state.darkMode
    if (newMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    return { darkMode: newMode }
  }),

  // Sidebar
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // Mobile menu
  mobileMenuOpen: false,
  toggleMobileMenu: () => set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),
  closeMobileMenu: () => set({ mobileMenuOpen: false }),

  // Selected exam
  selectedExam: null,
  setSelectedExam: (exam) => set({ selectedExam: exam }),

  // Notifications
  notifications: [],
  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        { id: Date.now(), ...notification },
        ...state.notifications,
      ].slice(0, 50),
    })),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
  clearNotifications: () => set({ notifications: [] }),

  // Quiz state
  activeQuiz: null,
  setActiveQuiz: (quiz) => set({ activeQuiz: quiz }),
  clearActiveQuiz: () => set({ activeQuiz: null }),

  // Loading states
  globalLoading: false,
  setGlobalLoading: (loading) => set({ globalLoading: loading }),
}))

