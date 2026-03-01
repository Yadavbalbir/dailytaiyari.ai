import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../../context/authStore'
import { useAppStore } from '../../context/appStore'
import { analyticsService } from '../../services/analyticsService'

const Header = () => {
  const navigate = useNavigate()
  const { profile, logout } = useAuthStore()
  const { sidebarOpen, toggleSidebar, toggleMobileMenu, darkMode, toggleDarkMode } = useAppStore()
  const [showUserMenu, setShowUserMenu] = useState(false)

  // Fetch current streak
  const { data: streakData } = useQuery({
    queryKey: ['currentStreak'],
    queryFn: () => analyticsService.getCurrentStreak(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-surface-900/80 backdrop-blur-lg border-b border-surface-200 dark:border-surface-800">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          {/* Sidebar Toggle (Desktop) */}
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex btn-icon"
            aria-label="Toggle sidebar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={toggleMobileMenu}
            className="lg:hidden btn-icon"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Logo (Mobile) */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">dt</span>
            </div>
          </div>

          {/* Search */}
          <div className="hidden md:block relative">
            <input
              type="text"
              placeholder="Search topics, quizzes..."
              className="w-64 lg:w-80 pl-10 pr-4 py-2 rounded-xl bg-surface-100 dark:bg-surface-800 border-none focus:ring-2 focus:ring-primary-500"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 lg:gap-4">
          {/* Streak Indicator */}
          {(streakData?.current_streak > 0) && (
            <div className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary-50 dark:bg-primary-900/30">
              <span className="text-lg">🔥</span>
              <span className="font-semibold text-primary-600 dark:text-primary-400">
                {streakData?.current_streak || 0}
              </span>
            </div>
          )}

          {/* XP */}
          <div className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full bg-accent-50 dark:bg-accent-900/30">
            <span className="text-lg">⚡</span>
            <span className="font-semibold text-accent-600 dark:text-accent-400">
              {profile?.total_xp?.toLocaleString() || 0}
            </span>
          </div>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="btn-icon"
            aria-label="Toggle dark mode"
          >
            {darkMode ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            )}
          </button>

          {/* Notifications */}
          <button className="btn-icon relative" aria-label="Notifications">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {/* Notification badge - shows when there are unread notifications */}
            {/* TODO: Connect to notifications API when available */}
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center overflow-hidden">
                {profile?.user?.avatar ? (
                  <img src={profile.user.avatar} alt={profile.user.full_name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-sm font-semibold">
                    {profile?.user?.first_name?.charAt(0) || 'U'}
                  </span>
                )}
              </div>

              <svg className="w-4 h-4 text-surface-500 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 mt-2 w-56 card shadow-lg overflow-hidden"
              >
                <div className="p-4 border-b border-surface-200 dark:border-surface-700">
                  <p className="font-medium">{profile?.user?.full_name || 'Student'}</p>
                  <p className="text-sm text-surface-500">{profile?.user?.email}</p>
                </div>
                <div className="p-2">
                  <button
                    onClick={() => {
                      setShowUserMenu(false)
                      navigate('/profile')
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                  >
                    Profile Settings
                  </button>
                  <button
                    onClick={() => {
                      setShowUserMenu(false)
                      logout()
                      navigate('/login')
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header

