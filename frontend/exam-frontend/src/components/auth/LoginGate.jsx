import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, LogIn, UserPlus } from 'lucide-react'
import { useAuthStore } from '../../context/authStore'

/**
 * Decorative, non-interactive skeleton rendered blurred behind the login card
 * so gated pages look like real (locked) content instead of a blank screen.
 */
const LockedSkeleton = () => (
  <div aria-hidden className="select-none space-y-6">
    <div className="space-y-2">
      <div className="h-8 w-56 rounded-lg bg-surface-200 dark:bg-surface-800" />
      <div className="h-4 w-80 max-w-full rounded bg-surface-200/70 dark:bg-surface-800/70" />
    </div>

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="card p-5 space-y-3">
          <div className="h-10 w-10 rounded-xl bg-surface-200 dark:bg-surface-800" />
          <div className="h-6 w-16 rounded bg-surface-200 dark:bg-surface-800" />
          <div className="h-3 w-24 rounded bg-surface-200/70 dark:bg-surface-800/70" />
        </div>
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 card p-6 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-surface-200 dark:bg-surface-800" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 rounded bg-surface-200 dark:bg-surface-800" />
              <div className="h-3 w-1/2 rounded bg-surface-200/70 dark:bg-surface-800/70" />
            </div>
          </div>
        ))}
      </div>
      <div className="card p-6 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-2/3 rounded bg-surface-200 dark:bg-surface-800" />
            <div className="h-3 w-full rounded bg-surface-200/70 dark:bg-surface-800/70" />
          </div>
        ))}
      </div>
    </div>
  </div>
)

/**
 * Gate that keeps a page's content visible-but-blurred for anonymous visitors
 * and shows a login prompt overlay. Authenticated + onboarded users see the
 * real page; authenticated-but-not-onboarded users are sent to onboarding.
 */
const LoginGate = ({
  children,
  title = 'Sign in to continue',
  message = 'Log in or create a free account to unlock this section.',
}) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, isOnboarded } = useAuthStore()

  if (isAuthenticated && !isOnboarded) {
    return <Navigate to="/onboarding" replace />
  }

  if (isAuthenticated) {
    return children
  }

  const goLogin = () => navigate('/login', { state: { from: location.pathname } })
  const goRegister = () => navigate('/register', { state: { from: location.pathname } })

  return (
    <div className="relative min-h-[70vh]">
      {/* Blurred, non-interactive backdrop */}
      <div className="pointer-events-none blur-sm opacity-60">
        <LockedSkeleton />
      </div>

      {/* Login prompt overlay */}
      <div className="absolute inset-0 flex items-start justify-center pt-16 sm:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-sm mx-4 card p-8 text-center shadow-xl border border-surface-200/80 dark:border-surface-700/80 bg-white/90 dark:bg-surface-900/90 backdrop-blur-xl"
        >
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
            <Lock className="w-7 h-7 text-white" />
          </div>
          <h2 className="mt-5 text-xl font-display font-bold">{title}</h2>
          <p className="mt-2 text-sm text-surface-500">{message}</p>

          <div className="mt-6 space-y-3">
            <button onClick={goLogin} className="btn-primary w-full inline-flex items-center justify-center gap-2">
              <LogIn className="w-4 h-4" /> Log in
            </button>
            <button onClick={goRegister} className="btn-secondary w-full inline-flex items-center justify-center gap-2">
              <UserPlus className="w-4 h-4" /> Create free account
            </button>
          </div>

          <p className="mt-5 text-xs text-surface-400">
            You can keep browsing courses and jobs without an account.
          </p>
        </motion.div>
      </div>
    </div>
  )
}

export default LoginGate
