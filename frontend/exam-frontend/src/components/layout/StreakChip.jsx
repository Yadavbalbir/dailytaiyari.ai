import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Flame, Trophy, CalendarCheck, CheckCircle2, AlertCircle } from 'lucide-react'

import { analyticsService } from '../../services/analyticsService'

const formatDate = (iso) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

const isToday = (iso) => {
    if (!iso) return false
    const today = new Date()
    const d = new Date(iso)
    return (
        d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate()
    )
}

const StreakChip = ({ enabled = true }) => {
    const [open, setOpen] = useState(false)
    const ref = useRef(null)

    const { data } = useQuery({
        queryKey: ['currentStreak'],
        queryFn: () => analyticsService.getCurrentStreak(),
        staleTime: 5 * 60 * 1000,
        enabled,
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

    const current = data?.current_streak || 0
    if (!enabled || current <= 0) return null

    const countedToday = isToday(data?.last_activity_date)

    return (
        <div className="relative hidden sm:block" ref={ref}>
            <button
                onClick={() => setOpen((v) => !v)}
                aria-label={`Study streak: ${current} days. Click for details`}
                aria-expanded={open}
                className="flex items-center gap-1.5 pl-2 pr-3 py-1.5 rounded-full bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/40 dark:to-amber-950/30 ring-1 ring-orange-200/70 dark:ring-orange-800/50 hover:ring-orange-300 dark:hover:ring-orange-700 transition-all"
            >
                <span className="relative flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-red-500 shadow-sm shadow-orange-500/30">
                    <Flame className="w-3.5 h-3.5 text-white" fill="currentColor" strokeWidth={1.5} />
                </span>
                <span className="font-semibold text-sm text-orange-600 dark:text-orange-400 tabular-nums">
                    {current}
                </span>
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] card shadow-xl overflow-hidden z-50"
                    >
                        <div className="px-4 py-3 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/40 dark:to-amber-950/20 border-b border-surface-200 dark:border-surface-700">
                            <div className="flex items-center gap-3">
                                <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 shadow-sm shadow-orange-500/30">
                                    <Flame className="w-5 h-5 text-white" fill="currentColor" strokeWidth={1.5} />
                                </span>
                                <div>
                                    <p className="font-semibold leading-tight">
                                        {current} day{current === 1 ? '' : 's'} in a row
                                    </p>
                                    <p className="text-xs text-surface-500 mt-0.5">
                                        Your study streak
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="px-4 py-3">
                            <p className="text-xs text-surface-600 dark:text-surface-300 leading-relaxed">
                                Your streak counts the number of <strong>consecutive days</strong> you have studied.
                                It goes up by one each new day you are active, and resets to 1 if you skip a full day.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-px bg-surface-200 dark:bg-surface-700 border-y border-surface-200 dark:border-surface-700">
                            <div className="bg-white dark:bg-surface-900 px-4 py-3">
                                <div className="flex items-center gap-1.5 text-surface-500">
                                    <Trophy className="w-3.5 h-3.5" />
                                    <span className="text-[11px] font-medium uppercase tracking-wide">Longest</span>
                                </div>
                                <p className="text-lg font-bold mt-0.5 tabular-nums">
                                    {data?.longest_streak || 0}
                                    <span className="text-xs font-medium text-surface-400 ml-1">days</span>
                                </p>
                            </div>
                            <div className="bg-white dark:bg-surface-900 px-4 py-3">
                                <div className="flex items-center gap-1.5 text-surface-500">
                                    <CalendarCheck className="w-3.5 h-3.5" />
                                    <span className="text-[11px] font-medium uppercase tracking-wide">Active days</span>
                                </div>
                                <p className="text-lg font-bold mt-0.5 tabular-nums">
                                    {data?.total_active_days || 0}
                                    <span className="text-xs font-medium text-surface-400 ml-1">total</span>
                                </p>
                            </div>
                        </div>

                        <div className={`flex items-start gap-2 px-4 py-3 text-xs ${countedToday
                            ? 'text-green-700 dark:text-green-400 bg-green-50/60 dark:bg-green-900/10'
                            : 'text-amber-700 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-900/10'
                            }`}>
                            {countedToday ? (
                                <>
                                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-px" />
                                    <span>Today is counted. Come back tomorrow to make it {current + 1}.</span>
                                </>
                            ) : (
                                <>
                                    <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
                                    <span>
                                        Study today to keep your streak alive — last active {formatDate(data?.last_activity_date)}.
                                    </span>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default StreakChip
