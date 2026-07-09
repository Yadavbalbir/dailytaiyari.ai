import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '../../context/authStore'
import toast from 'react-hot-toast'

const RESEND_COOLDOWN = 60

const ResetPassword = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { resetPassword, requestPasswordReset, isLoading, error, clearError } = useAuthStore()

  const [email, setEmail] = useState(location.state?.email || '')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [cooldown, setCooldown] = useState(location.state?.email ? RESEND_COOLDOWN : 0)

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setInterval(() => setCooldown((c) => c - 1), 1000)
    return () => clearInterval(t)
  }, [cooldown])

  const handleSubmit = async (e) => {
    e.preventDefault()
    clearError()

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    if (password !== confirm) {
      toast.error('Passwords do not match')
      return
    }

    const result = await resetPassword(email, code.trim(), password)
    if (result.success) {
      toast.success('Password reset! Please sign in')
      navigate('/login', { replace: true })
    } else {
      toast.error(result.error || 'Reset failed')
    }
  }

  const handleResend = async () => {
    if (!email) {
      toast.error('Enter your email first')
      return
    }
    const result = await requestPasswordReset(email)
    if (result.success) {
      toast.success('A new code is on its way')
      setCooldown(RESEND_COOLDOWN)
    } else {
      toast.error(result.error || 'Could not resend code')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mb-6">
        <h2 className="text-2xl font-display font-bold mb-2">Reset password 🔒</h2>
        <p className="text-surface-500">
          Enter the code we emailed you along with your new password.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="input"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Reset Code</label>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="123456"
            className="input text-center text-xl tracking-[0.4em] font-semibold"
            maxLength={6}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">New Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="input pr-10"
              required
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400"
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Confirm New Password</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Re-enter your new password"
            className="input"
            required
          />
        </div>

        {error && (
          <div className="p-3 bg-error-50 dark:bg-error-900/20 text-error-600 dark:text-error-400 rounded-xl text-sm">
            {error}
          </div>
        )}

        <button type="submit" disabled={isLoading} className="btn-primary w-full py-3">
          {isLoading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>

      <div className="mt-6 text-center text-sm">
        <span className="text-surface-500">Didn't get the code? </span>
        {cooldown > 0 ? (
          <span className="text-surface-400">Resend in {cooldown}s</span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            className="text-primary-600 font-medium hover:underline"
          >
            Resend code
          </button>
        )}
      </div>

      <div className="mt-4 text-center">
        <Link to="/login" className="text-sm text-surface-500 hover:underline">
          Back to sign in
        </Link>
      </div>
    </motion.div>
  )
}

export default ResetPassword
