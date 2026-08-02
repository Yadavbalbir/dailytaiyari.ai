import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, CheckCheck } from 'lucide-react'

import { notificationService } from '../services/notificationService'
import { NOTIFICATION_META, timeAgo } from '../components/layout/NotificationBell'

const Notifications = () => {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [filter, setFilter] = useState('all') // all | unread
    const [page, setPage] = useState(1)

    const { data, isLoading, isFetching } = useQuery({
        queryKey: ['notifications', 'page', filter, page],
        queryFn: () => notificationService.getNotifications({
            page,
            page_size: 20,
            ...(filter === 'unread' ? { unread: 1 } : {}),
        }),
        keepPreviousData: true,
    })

    const items = data?.results || []
    const unreadCount = data?.unread_count ?? 0
    const hasNext = Boolean(data?.next)

    const refresh = () => queryClient.invalidateQueries({ queryKey: ['notifications'] })

    const openItem = async (n) => {
        try {
            if (!n.is_read) { await notificationService.markRead(n.id); refresh() }
        } catch { /* non-blocking */ }
        if (n.link) navigate(n.link)
    }

    const markAll = async () => {
        try { await notificationService.markAllRead(); refresh() } catch { /* noop */ }
    }

    const selectFilter = (f) => { setFilter(f); setPage(1) }

    return (
        <div className="max-w-3xl mx-auto px-4 py-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                        <Bell className="w-5 h-5 text-primary-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Notifications</h1>
                        {unreadCount > 0 && <p className="text-sm text-surface-500">{unreadCount} unread</p>}
                    </div>
                </div>
                {unreadCount > 0 && (
                    <button onClick={markAll} className="btn-secondary text-sm flex items-center gap-1.5">
                        <CheckCheck className="w-4 h-4" /> Mark all as read
                    </button>
                )}
            </div>

            <div className="flex gap-1 p-1 bg-surface-100 dark:bg-surface-800 rounded-lg w-fit mb-4">
                {['all', 'unread'].map((f) => (
                    <button
                        key={f}
                        onClick={() => selectFilter(f)}
                        className={`px-4 py-1.5 rounded-md text-sm font-semibold capitalize transition-all ${filter === f ? 'bg-white dark:bg-surface-700 text-primary-600 shadow-sm' : 'text-surface-500'}`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            <div className="card divide-y divide-surface-100 dark:divide-surface-800 overflow-hidden">
                {isLoading ? (
                    <div className="p-10 text-center text-surface-500">Loading…</div>
                ) : items.length === 0 ? (
                    <div className="p-16 text-center">
                        <Bell className="w-10 h-10 mx-auto text-surface-300 mb-3" />
                        <p className="font-medium">No notifications yet</p>
                        <p className="text-sm text-surface-500 mt-1">Updates about your courses and announcements will show up here.</p>
                    </div>
                ) : (
                    items.map((n) => {
                        const meta = NOTIFICATION_META[n.type] || NOTIFICATION_META.announcement
                        const { Icon } = meta
                        return (
                            <motion.button
                                key={n.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                onClick={() => openItem(n)}
                                className={`w-full text-left flex gap-4 px-4 sm:px-5 py-4 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors ${!n.is_read ? 'bg-primary-50/40 dark:bg-primary-900/10' : ''}`}
                            >
                                <div className={`shrink-0 w-11 h-11 rounded-full flex items-center justify-center ${meta.bg}`}>
                                    <Icon className={`w-5 h-5 ${meta.color}`} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className={`${!n.is_read ? 'font-semibold' : 'font-medium'}`}>{n.title}</p>
                                    {n.body && <p className="text-sm text-surface-500 mt-0.5">{n.body}</p>}
                                    <p className="text-xs text-surface-400 mt-1.5">{timeAgo(n.created_at)}</p>
                                </div>
                                {!n.is_read && <span className="shrink-0 w-2.5 h-2.5 rounded-full bg-primary-500 mt-2" />}
                            </motion.button>
                        )
                    })
                )}
            </div>

            {(hasNext || page > 1) && (
                <div className="flex items-center justify-center gap-3 mt-5">
                    <button
                        disabled={page <= 1 || isFetching}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="btn-secondary text-sm disabled:opacity-40"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-surface-500">Page {page}</span>
                    <button
                        disabled={!hasNext || isFetching}
                        onClick={() => setPage((p) => p + 1)}
                        className="btn-secondary text-sm disabled:opacity-40"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    )
}

export default Notifications
