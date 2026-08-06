import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { Zap, Flame, ArrowLeft, Trophy, CalendarCheck, Sparkles, Info } from 'lucide-react'

import { gamificationService } from '../services/gamificationService'
import { analyticsService } from '../services/analyticsService'
import { useAuthStore } from '../context/authStore'
import { getXPMeta, getLevelBounds, getLevelProgress, XP_EARNING_RULES } from '../utils/xp'

const formatDayLabel = (iso) => {
    const d = new Date(iso)
    const today = new Date()
    const yesterday = new Date()
    yesterday.setDate(today.getDate() - 1)
    const same = (a, b) =>
        a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
    if (same(d, today)) return 'Today'
    if (same(d, yesterday)) return 'Yesterday'
    return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

const formatTime = (iso) =>
    new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })

const XPHistory = () => {
    const navigate = useNavigate()
    const { profile } = useAuthStore()

    const { data: history, isLoading } = useQuery({
        queryKey: ['xpHistory', 'all'],
        queryFn: () => gamificationService.getXPHistory(),
    })

    const { data: streak } = useQuery({
        queryKey: ['currentStreak'],
        queryFn: () => analyticsService.getCurrentStreak(),
        staleTime: 5 * 60 * 1000,
    })

    const transactions = useMemo(
        () => (Array.isArray(history) ? history : history?.results || []),
        [history]
    )

    const groups = useMemo(() => {
        const map = new Map()
        transactions.forEach((t) => {
            const key = new Date(t.created_at).toDateString()
            if (!map.has(key)) map.set(key, [])
            map.get(key).push(t)
        })
        return Array.from(map.entries())
    }, [transactions])

    const totalXP = profile?.total_xp || 0
    const level = profile?.current_level || 1
    const toNextLevel = Math.max(0, profile?.xp_for_next_level ?? 0)
    const progress = getLevelProgress(totalXP, level)
    const { end } = getLevelBounds(level)

    return (
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-1.5 text-sm font-medium text-surface-500 hover:text-surface-900 dark:hover:text-surface-100 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" /> Back
            </button>

            {/* XP summary */}
            <div className="card overflow-hidden">
                <div className="p-6 bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-violet-950/40 dark:to-fuchsia-950/20">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/30">
                            <Zap className="w-7 h-7 text-white" fill="currentColor" strokeWidth={1.5} />
                        </span>
                        <div>
                            <h1 className="text-2xl font-bold tabular-nums">{totalXP.toLocaleString()} XP</h1>
                            <p className="text-sm text-surface-500">
                                Level {level} · combined total from courses, AI learning and community
                            </p>
                        </div>
                    </div>

                    <div className="mt-5">
                        <div className="flex items-center justify-between text-xs font-medium mb-1.5">
                            <span className="text-violet-700 dark:text-violet-300">Level {level}</span>
                            <span className="text-surface-500 tabular-nums">
                                {totalXP.toLocaleString()} / {end.toLocaleString()} XP
                            </span>
                        </div>
                        <div className="h-2.5 rounded-full bg-white/70 dark:bg-surface-800 overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.6, ease: 'easeOut' }}
                                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                            />
                        </div>
                        <p className="text-xs text-surface-500 mt-1.5">
                            {toNextLevel > 0
                                ? `${toNextLevel.toLocaleString()} XP to reach Level ${level + 1}`
                                : `Ready for Level ${level + 1}!`}
                        </p>
                    </div>
                </div>
            </div>

            {/* Streak summary */}
            <div className="card p-6">
                <div className="flex items-center gap-4">
                    <span className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 shadow-lg shadow-orange-500/30">
                        <Flame className="w-7 h-7 text-white" fill="currentColor" strokeWidth={1.5} />
                    </span>
                    <div>
                        <h2 className="text-2xl font-bold tabular-nums">
                            {streak?.current_streak || 0}
                            <span className="text-base font-semibold text-surface-400 ml-1.5">day streak</span>
                        </h2>
                        <p className="text-sm text-surface-500">Consecutive days you have studied</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-5">
                    <div className="rounded-xl bg-surface-50 dark:bg-surface-800/50 px-4 py-3">
                        <div className="flex items-center gap-1.5 text-surface-500">
                            <Trophy className="w-3.5 h-3.5" />
                            <span className="text-[11px] font-medium uppercase tracking-wide">Longest streak</span>
                        </div>
                        <p className="text-xl font-bold mt-0.5 tabular-nums">
                            {streak?.longest_streak || 0}
                            <span className="text-xs font-medium text-surface-400 ml-1">days</span>
                        </p>
                    </div>
                    <div className="rounded-xl bg-surface-50 dark:bg-surface-800/50 px-4 py-3">
                        <div className="flex items-center gap-1.5 text-surface-500">
                            <CalendarCheck className="w-3.5 h-3.5" />
                            <span className="text-[11px] font-medium uppercase tracking-wide">Active days</span>
                        </div>
                        <p className="text-xl font-bold mt-0.5 tabular-nums">
                            {streak?.total_active_days || 0}
                            <span className="text-xs font-medium text-surface-400 ml-1">total</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-start gap-2 mt-4 text-xs text-surface-600 dark:text-surface-300 bg-surface-50 dark:bg-surface-800/50 rounded-xl px-4 py-3">
                    <Info className="w-4 h-4 shrink-0 mt-px text-surface-400" />
                    <span>
                        Any studying activity on a given day keeps the streak going. Study on the next calendar
                        day and it grows by one; miss a full day and it restarts at 1.
                    </span>
                </div>
            </div>

            {/* How XP is earned */}
            <div className="card p-6">
                <h2 className="text-lg font-semibold">How XP is earned</h2>
                <p className="text-sm text-surface-500 mt-1">
                    Your XP is a single running total across every course, AI learning <em>and</em> the
                    community — each point below is awarded automatically the moment you complete the activity.
                </p>

                <div className="grid sm:grid-cols-2 gap-3 mt-4">
                    {XP_EARNING_RULES.map((rule) => {
                        const { Icon } = rule
                        return (
                            <div
                                key={rule.title}
                                className="flex gap-3 rounded-xl border border-surface-200 dark:border-surface-700 p-3"
                            >
                                <div className="shrink-0 w-9 h-9 rounded-lg bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
                                    <Icon className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-baseline justify-between gap-2">
                                        <p className="text-sm font-semibold">{rule.title}</p>
                                        <span className="shrink-0 text-[11px] font-semibold text-violet-600 dark:text-violet-400 whitespace-nowrap">
                                            {rule.value}
                                        </span>
                                    </div>
                                    <p className="text-xs text-surface-500 mt-0.5 leading-relaxed">{rule.detail}</p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Ledger */}
            <div className="card overflow-hidden">
                <div className="px-6 py-4 border-b border-surface-200 dark:border-surface-700">
                    <h2 className="text-lg font-semibold">XP history</h2>
                    <p className="text-sm text-surface-500 mt-0.5">Every point you have ever earned.</p>
                </div>

                {isLoading ? (
                    <div className="p-8 text-center text-sm text-surface-500">Loading…</div>
                ) : groups.length === 0 ? (
                    <div className="p-10 text-center">
                        <Sparkles className="w-9 h-9 mx-auto text-surface-300 mb-2" />
                        <p className="text-sm text-surface-500">
                            No XP yet. Complete a lesson or a quiz to start earning.
                        </p>
                    </div>
                ) : (
                    groups.map(([day, items]) => {
                        const dayTotal = items.reduce((sum, t) => sum + (t.xp_amount || 0), 0)
                        return (
                            <div key={day}>
                                <div className="flex items-center justify-between px-6 py-2 bg-surface-50 dark:bg-surface-800/50 border-y border-surface-200 dark:border-surface-700">
                                    <span className="text-xs font-semibold text-surface-600 dark:text-surface-300">
                                        {formatDayLabel(items[0].created_at)}
                                    </span>
                                    <span className="text-xs font-bold text-green-600 dark:text-green-400 tabular-nums">
                                        {dayTotal >= 0 ? '+' : ''}{dayTotal} XP
                                    </span>
                                </div>
                                {items.map((t) => {
                                    const meta = getXPMeta(t.transaction_type)
                                    const { Icon } = meta
                                    return (
                                        <div
                                            key={t.id}
                                            className="flex items-center gap-3 px-6 py-3 border-b border-surface-100 dark:border-surface-800"
                                        >
                                            <div className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${meta.bg}`}>
                                                <Icon className={`w-4 h-4 ${meta.color}`} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium truncate">
                                                    {t.description || t.transaction_type_display || meta.label}
                                                </p>
                                                <p className="text-[11px] text-surface-400">
                                                    {t.transaction_type_display || meta.label} · {formatTime(t.created_at)}
                                                </p>
                                            </div>
                                            <div className="shrink-0 text-right">
                                                <p className={`text-sm font-bold tabular-nums ${t.xp_amount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                                                    {t.xp_amount >= 0 ? '+' : ''}{t.xp_amount}
                                                </p>
                                                {t.balance_after != null && (
                                                    <p className="text-[11px] text-surface-400 tabular-nums">
                                                        {t.balance_after.toLocaleString()} total
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}

export default XPHistory
