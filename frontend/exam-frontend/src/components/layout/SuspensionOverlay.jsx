import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldAlert, Mail, LogOut } from 'lucide-react'
import { useAuthStore } from '../../context/authStore'

const SuspensionOverlay = () => {
    const { user, logout } = useAuthStore()

    if (!user?.is_suspended) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-surface-900/90 backdrop-blur-md"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="max-w-md w-full bg-white dark:bg-surface-800 rounded-3xl p-8 shadow-2xl text-center border border-rose-100 dark:border-rose-900/30"
                >
                    <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShieldAlert className="w-10 h-10 text-rose-600 dark:text-rose-400" />
                    </div>

                    <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-3">
                        Institutional Access Suspended
                    </h2>

                    <p className="text-surface-600 dark:text-surface-400 mb-8 leading-relaxed">
                        Your account has been temporarily deactivated by your institutional administrator.
                        You can still log in, but access to study materials, quizzes, and analytics is restricted.
                    </p>

                    <div className="space-y-4">
                        <div className="p-4 bg-surface-50 dark:bg-surface-900/50 rounded-2xl flex items-start gap-3 text-left">
                            <Mail className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-xs font-bold text-surface-400 uppercase tracking-wider mb-1">How to resolve</p>
                                <p className="text-sm text-surface-700 dark:text-surface-300">
                                    Please contact your academy administrator or reach out to us at <span className="text-primary-600 font-medium">support@dailytaiyari.ai</span> for assistance.
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={logout}
                            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-surface-100 hover:bg-surface-200 dark:bg-surface-700 dark:hover:bg-surface-600 text-surface-700 dark:text-surface-200 font-bold transition-all"
                        >
                            <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}

export default SuspensionOverlay
