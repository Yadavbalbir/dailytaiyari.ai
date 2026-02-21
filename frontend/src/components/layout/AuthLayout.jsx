import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useTenantStore } from '../../context/tenantStore'

const AuthLayout = () => {
  const { tenant } = useTenantStore()
  const tenantName = tenant?.name || 'DailyTaiyari'
  const tenantInitials = tenantName.substring(0, 2).toLowerCase()

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-500 via-primary-600 to-accent-600 relative overflow-hidden">
        {/* Animated Background Patterns */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent-400/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '-2s' }} />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-primary-300/20 rounded-full blur-2xl animate-pulse-slow" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Logo */}
            <div className="flex items-center gap-3 mb-8">
              {tenant?.logo ? (
                <img
                  src={tenant.logo}
                  alt={`${tenantName} Logo`}
                  className="w-14 h-14 rounded-2xl object-contain bg-white/20 backdrop-blur-sm p-1"
                />
              ) : (
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <span className="text-2xl font-bold">{tenantInitials}</span>
                </div>
              )}
              <div>
                <h1 className="text-2xl font-display font-bold">{tenantName}</h1>
                <p className="text-white/70 text-sm">Ace Your Exams</p>
              </div>
            </div>

            {/* Tagline */}
            <h2 className="text-4xl font-display font-bold mb-4 leading-tight">
              Your Daily Dose of<br />
              <span className="text-white/90">Exam Success</span>
            </h2>

            <p className="text-white/80 text-lg mb-8 max-w-md">
              Join thousands of students preparing for NEET and IIT JEE
              with personalized study plans and AI-powered learning.
            </p>

            {/* Stats */}
            <div className="flex gap-8">
              <div>
                <div className="text-3xl font-bold">50K+</div>
                <div className="text-white/70">Students</div>
              </div>
              <div>
                <div className="text-3xl font-bold">100K+</div>
                <div className="text-white/70">Questions</div>
              </div>
              <div>
                <div className="text-3xl font-bold">95%</div>
                <div className="text-white/70">Success Rate</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black/10 to-transparent" />
      </div>

      {/* Right Panel - Auth Forms */}
      <div className="flex-1 flex items-center justify-center p-6 bg-surface-50 dark:bg-surface-950">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default AuthLayout

