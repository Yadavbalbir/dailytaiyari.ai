import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '../../context/authStore'
import { useAppStore } from '../../context/appStore'

// Icons (using emoji for simplicity, replace with actual icons)
const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { path: '/study', label: 'Study', icon: '📚' },
  { path: '/quiz', label: 'Practice Quiz', icon: '✍️' },
  { path: '/mock-test', label: 'Mock Tests', icon: '📝' },
  { path: '/analytics', label: 'Analytics', icon: '📊' },
  { path: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
  { path: '/doubt-solver', label: 'AI Doubt Solver', icon: '🤖' },
]

const Sidebar = () => {
  const location = useLocation()
  const { profile } = useAuthStore()
  const { closeMobileMenu } = useAppStore()

  return (
    <div className="h-full bg-white dark:bg-surface-900 border-r border-surface-200 dark:border-surface-800 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-surface-200 dark:border-surface-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold">dt</span>
          </div>
          <div>
            <h1 className="font-display font-bold text-lg gradient-text">DailyTaiyari</h1>
            <p className="text-xs text-surface-500">Ace Your Exams</p>
          </div>
        </div>
      </div>

      {/* User Profile Card */}
      {profile && (
        <div className="p-4 mx-4 mt-4 rounded-xl bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-800 flex items-center justify-center">
              <span className="text-primary-600 dark:text-primary-300 font-semibold">
                {profile.user?.first_name?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{profile.user?.full_name || 'Student'}</p>
              <p className="text-xs text-surface-500">Level {profile.current_level}</p>
            </div>
          </div>
          
          {/* XP Progress */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-surface-600 dark:text-surface-400">XP Progress</span>
              <span className="font-medium">{(profile.total_xp || 0).toLocaleString()} XP</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-bar-fill bg-gradient-to-r from-primary-500 to-accent-500"
                style={{ 
                  width: profile.total_xp > 0 
                    ? `${Math.max(5, 100 - ((profile.xp_for_next_level || 100) / ((profile.current_level || 1) * 150) * 100))}%`
                    : '0%'
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
                          (item.path !== '/dashboard' && location.pathname.startsWith(item.path))
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={closeMobileMenu}
              className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                  : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-500 rounded-r-full"
                />
              )}
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
              
              {/* Special badges */}
              {item.path === '/doubt-solver' && (
                <span className="ml-auto badge-primary text-[10px]">AI</span>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-surface-200 dark:border-surface-800">
        <NavLink
          to="/profile"
          onClick={closeMobileMenu}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
        >
          <span className="text-lg">⚙️</span>
          <span className="font-medium">Settings</span>
        </NavLink>
      </div>
    </div>
  )
}

export default Sidebar

