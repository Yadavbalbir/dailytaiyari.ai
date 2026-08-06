import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Zap, ChevronRight, Sparkles } from 'lucide-react'

import { gamificationService } from '../../services/gamificationService'
import { useAuthStore } from '../../context/authStore'
import { getXPMeta, getLevelBounds, getLevelProgress } from '../../utils/xp'
import { timeAgo } from './NotificationBell'

const XPChip = ({ enabled = true }) => {
    const navigate = useNavigate()
    const { profile } = useAuthStore()
    const [open, setOpen] = useState(false)
    const ref = useRef(null)

    const { data: history, isLoading } = useQuery({
        queryKey: ['xpHistory', 'recent'],
        queryFn: () => gamificationService.getXPHistory(),
        enabled: enabled && open,
        staleTime: 60 * 1000,
    })

    useEffect(() => {
        if (!open) return undefined
        const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
        const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
        document.addEventListener('mousedown', onClick)
        document.addEventListener('keydown', onKey)
        return () => {
            document.removeEventListener('mousedown', onClick)
            document.removeEventListener('keydown', onKey)
        }
    }, [open])

    if (!enabled) return null

    const totalXP = profile?.total_xp || 0
    const level = profile?.current_level || 1
    const toNextLevel = Math.max(0, profile?.xp_for_next_level ?? 0)
    const progress = getLevelProgress(totalXP, level)
    const { end } = getLevelBounds(level)

    const items = (Array.isArray(history) ? history : history?.results || []).slice(0, 5)

    return (
        <div className="relative hidden sm:block" ref={ref}>
            <button
                onClick={() => setOpen((v) => !v)}
                aria-label={`Total XP: ${totalXP}. Click for details`}
                aria-expanded={open}
                className="flex items-center gap-1.5 pl-2 pr-3 py-1.5 rounded-full bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-violet-950/40 dark:to-fuchsia-950/30 ring-1 ring-violet-200/70 dark:ring-violet-800/50 hover:ring-violet-300 dark:hover:ring-violet-700 transition-all"
            >
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-sm shadow-violet-500/30">
                    <Zap className="w-3.5 h-3.5 text-white" fill="currentColor" strokeWidth={1.5} />
                </span>
                <span className="font-semibold text-sm text-violet-600 dark:text-violet-400 tabular-nums">
                    {totalXP.toLocaleString()}
                </span>
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] card shadow-xl overflow-hidden z-50"
                    >
                        <div className="px-4 py-3 bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-violet-950/40 dark:to-fuchsia-950/20 border-b border-surface-200 dark:border-surface-700">
                            <div className="flex items-center gap-3">
                                <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-sm shadow-violet-500/30">
                                    <Zap className="w-5 h-5 text-white" fill="currentColor" strokeWidth={1.5} />
                                </span>
                                <div className="min-w-0">
                                    <p className="font-semibold leading-tight">
                                        {totalXP.toLocaleString()} XP earned
                                    </p>
                                    <p className="text-xs text-surface-500 mt-0.5">
                                        Your combined total from courses and community
                                    </p>
                                </div>
                            </div>

                            <div className="mt-3">
                                <div className="flex items-center justify-between text-[11px] font-medium mb-1">
                                    <span className="text-violet-700 dark:text-violet-300">Level {level}</span>
                                    <span className="text-surface-500 tabular-nums">
                                        {totalXP.toLocaleString()} / {end.toLocaleString()} XP
                                    </span>
                                </div>
                                <div className="h-2 rounded-full bg-white/70 dark:bg-surface-800 overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        transition={{ duration: 0.5, ease: 'easeOut' }}
                                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                                    />
                                </div>
                                <p className="text-[11px] text-surface-500 mt-1">
                                    {toNextLevel > 0
                                        ? `${toNextLevel.toLocaleString()} XP to reach Level ${level + 1}`
                                        : `Ready for Level ${level + 1}!`}
                                </p>
                            </div>
                        </div>

                        <div className="px-4 pt-3 pb-1">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-surface-500">
                                Recent XP
                            </p>
                        </div>

                        <div className="max-h-64 overflow-y-auto pb-1">
                            {isLoading ? (
                                <div className="p-6 text-center text-sm text-surface-500">Loading…</div>
                            ) : items.length === 0 ? (
                                <div className="px-4 py-6 text-center">
                                    <Sparkles className="w-7 h-7 mx-auto text-surface-300 mb-2" />
                                    <p className="text-sm text-surface-500">
                                        No XP yet. Finish a lesson or quiz to get started.
                                    </p>
                                </div>
                            ) : (
                                items.map((t) => {
                                    const meta = getXPMeta(t.transaction_type)
                                    const { Icon } = meta
                                    return (
                                        <div key={t.id} className="flex items-center gap-3 px-4 py-2">
                                            <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${meta.bg}`}>
                                                <Icon className={`w-4 h-4 ${meta.color}`} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium truncate">
                                                    {t.description || t.transaction_type_display || meta.label}
                                                </p>
                                                <p className="text-[11px] text-surface-400">
                                                    {t.transaction_type_display || meta.label} · {timeAgo(t.created_at)}
                                                </p>
                                            </div>
                                            <span className={`shrink-0 text-sm font-bold tabular-nums ${t.xp_amount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                                                {t.xp_amount >= 0 ? '+' : ''}{t.xp_amount}
                                            </span>
                                        </div>
                                    )
                                })
                            )}
                        </div>

                        <button
                            onClick={() => { setOpen(false); navigate('/xp') }}
                            className="w-full py-3 text-sm font-medium text-primary-600 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors border-t border-surface-200 dark:border-surface-700 flex items-center justify-center gap-1"
                        >
                            View all XP &amp; how it&apos;s earned
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default XPChip
