import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MailCheck, LogOut } from 'lucide-react'
import { useAuthStore } from '../../context/authStore'
import toast from 'react-hot-toast'

const RESEND_COOLDOWN = 60

const VerificationGate = () => {
    const { user, isAuthenticated, verifyEmail, resendOtp, logout, isLoading } = useAuthStore()

    const [code, setCode] = useState('')
    const [cooldown, setCooldown] = useState(RESEND_COOLDOWN)

    useEffect(() => {
        if (cooldown <= 0) return
        const t = setInterval(() => setCooldown((c) => c - 1), 1000)
        return () => clearInterval(t)
    }, [cooldown])

    // Only gate authenticated, unverified, non-suspended users.
    // (Suspension takes priority and is handled by SuspensionOverlay.)
    const email = user?.email || ''
    if (!isAuthenticated || !user || user.is_suspended || user.is_email_verified) {
        return null
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (code.trim().length < 4) {
            toast.error('Enter the code from your email')
            return
        }
        const result = await verifyEmail(email, code.trim())
        if (result.success) {
            toast.success('Email verified! 🎉')
        } else {
            toast.error(result.error || 'Verification failed')
        }
    }

    const handleResend = async () => {
        const result = await resendOtp(email)
        if (result.success) {
            toast.success('A new code is on its way')
            setCooldown(RESEND_COOLDOWN)
        } else {
            toast.error(result.error || 'Could not resend code')
        }
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-surface-900/90 backdrop-blur-md"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="max-w-md w-full bg-white dark:bg-surface-800 rounded-3xl p-8 shadow-2xl text-center border border-primary-100 dark:border-primary-900/30"
                >
                    <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <MailCheck className="w-10 h-10 text-primary-600 dark:text-primary-400" />
                    </div>

                    <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-3">
                        Verify your email
                    </h2>

                    <p className="text-surface-600 dark:text-surface-400 mb-6 leading-relaxed">
                        We sent a 6-digit code to{' '}
                        <span className="font-medium text-surface-800 dark:text-surface-200">{email}</span>.
                        Enter it below to unlock your account.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <input
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="123456"
                            className="input text-center text-2xl tracking-[0.5em] font-semibold"
                            maxLength={6}
                            required
                        />

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn-primary w-full py-3"
                        >
                            {isLoading ? 'Verifying...' : 'Verify Email'}
                        </button>
                    </form>

                    <div className="mt-6 text-sm">
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

                    <button
                        onClick={logout}
                        className="mt-6 w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-surface-100 hover:bg-surface-200 dark:bg-surface-700 dark:hover:bg-surface-600 text-surface-700 dark:text-surface-200 font-bold transition-all"
                    >
                        <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}

export default VerificationGate
