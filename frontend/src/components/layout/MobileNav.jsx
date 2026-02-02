import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../../context/appStore'
import Sidebar from './Sidebar'

const navItems = [
  { path: '/dashboard', label: 'Home', icon: '🏠' },
  { path: '/study', label: 'Study', icon: '📚' },
  { path: '/quiz', label: 'Quiz', icon: '✍️' },
  { path: '/analytics', label: 'Stats', icon: '📊' },
  { path: '/doubt-solver', label: 'AI', icon: '🤖' },
]

const MobileNav = () => {
  const location = useLocation()
  const { mobileMenuOpen, closeMobileMenu } = useAppStore()

  return (
    <>
      {/* Mobile Slide-in Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 z-50 h-screen w-64 lg:hidden"
          >
            <Sidebar />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation Bar (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-surface-900 border-t border-surface-200 dark:border-surface-800 lg:hidden">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
                            (item.path !== '/dashboard' && location.pathname.startsWith(item.path))

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center flex-1 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-surface-500 dark:text-surface-400'
                }`}
              >
                <span className="text-xl mb-0.5">{item.icon}</span>
                <span className="text-[10px] font-medium">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="mobileNavIndicator"
                    className="absolute bottom-0 w-12 h-1 bg-primary-500 rounded-t-full"
                  />
                )}
              </NavLink>
            )
          })}
        </div>
      </nav>
    </>
  )
}

export default MobileNav

