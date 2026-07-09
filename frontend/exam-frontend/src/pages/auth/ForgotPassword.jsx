import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '../../context/authStore'
import toast from 'react-hot-toast'

const ForgotPassword = () => {
  const navigate = useNavigate()
  const { requestPasswordReset } = useAuthStore()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    const result = await requestPasswordReset(email)
    setIsLoading(false)

    if (result.success) {
      toast.success('If an account exists, a reset code has been sent')
      navigate('/reset-password', { state: { email }, replace: true })
    } else {
      toast.error(result.error || 'Something went wrong')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mb-6">
        <h2 className="text-2xl font-display font-bold mb-2">Forgot password? 🔑</h2>
        <p className="text-surface-500">
          Enter your email and we'll send you a code to reset your password.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
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

        <button type="submit" disabled={isLoading} className="btn-primary w-full py-3">
          {isLoading ? 'Sending...' : 'Send Reset Code'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link to="/login" className="text-sm text-surface-500 hover:underline">
          Back to sign in
        </Link>
      </div>
    </motion.div>
  )
}

export default ForgotPassword
