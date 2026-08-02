import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Megaphone, Send, Users, BookOpen, Mail, Bell, CheckCircle2, Clock, XCircle, Plus, X } from 'lucide-react'

import { notificationService } from '../../services/notificationService'
import { courseService } from '../../services/courseService'

const STATUS_META = {
    sent: { label: 'Sent', Icon: CheckCircle2, cls: 'text-green-600 bg-green-100 dark:bg-green-900/30' },
    sending: { label: 'Sending', Icon: Clock, cls: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' },
    failed: { label: 'Failed', Icon: XCircle, cls: 'text-red-600 bg-red-100 dark:bg-red-900/30' },
}

const emptyForm = { title: '', body: '', audience: 'all', courseIds: [], sendEmail: true, sendInApp: true }

const ComposeModal = ({ onClose }) => {
    const queryClient = useQueryClient()
    const [form, setForm] = useState(emptyForm)
    const { title, body, audience, courseIds, sendEmail, sendInApp } = form
    const set = (patch) => setForm((prev) => ({ ...prev, ...patch }))

    const { data: coursesRaw = [] } = useQuery({
        queryKey: ['adminCourses'],
        queryFn: () => courseService.getCourses(),
    })
    const courses = useMemo(
        () => (Array.isArray(coursesRaw) ? coursesRaw : (coursesRaw?.results || [])),
        [coursesRaw],
    )

    const createMutation = useMutation({
        mutationFn: (payload) => notificationService.createAnnouncement(payload),
        onSuccess: (data) => {
            toast.success(`Announcement sent to ${data.recipients_count ?? 0} recipient(s)`)
            queryClient.invalidateQueries({ queryKey: ['announcements'] })
            onClose()
        },
        onError: (err) => {
            const msg = err?.response?.data
            const detail = typeof msg === 'string' ? msg
                : msg?.non_field_errors?.[0] || msg?.detail || 'Failed to send announcement'
            toast.error(detail)
        },
    })

    const toggleCourse = (id) => {
        set({ courseIds: courseIds.includes(id) ? courseIds.filter((c) => c !== id) : [...courseIds, id] })
    }

    const submit = (e) => {
        e.preventDefault()
        if (!title.trim() || !body.trim()) { toast.error('Title and message are required'); return }
        if (!sendEmail && !sendInApp) { toast.error('Choose at least one delivery channel'); return }
        if (audience === 'courses' && courseIds.length === 0) { toast.error('Select at least one course'); return }
        createMutation.mutate({
            title: title.trim(),
            body: body.trim(),
            audience,
            courses: audience === 'courses' ? courseIds : [],
            send_email: sendEmail,
            send_in_app: sendInApp,
        })
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
            <div className="card w-full max-w-2xl max-h-[88vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-surface-200 dark:border-surface-700 sticky top-0 bg-white dark:bg-surface-900 z-10">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <Megaphone className="w-5 h-5 text-primary-500" /> New announcement
                    </h3>
                    <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={submit} className="p-5 sm:p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-medium mb-1.5">Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => set({ title: e.target.value })}
                            maxLength={255}
                            placeholder="e.g. Holiday schedule update"
                            autoFocus
                            className="w-full px-4 py-2.5 rounded-xl bg-surface-100 dark:bg-surface-800 border-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1.5">Message</label>
                        <textarea
                            value={body}
                            onChange={(e) => set({ body: e.target.value })}
                            rows={5}
                            placeholder="Write your announcement…"
                            className="w-full px-4 py-2.5 rounded-xl bg-surface-100 dark:bg-surface-800 border-none focus:ring-2 focus:ring-primary-500 resize-y"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Audience</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => set({ audience: 'all' })}
                                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${audience === 'all' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-surface-200 dark:border-surface-700'}`}
                            >
                                <Users className={`w-5 h-5 ${audience === 'all' ? 'text-primary-500' : 'text-surface-400'}`} />
                                <div className="text-left">
                                    <p className="font-medium text-sm">Everyone</p>
                                    <p className="text-xs text-surface-500">All students on the platform</p>
                                </div>
                            </button>
                            <button
                                type="button"
                                onClick={() => set({ audience: 'courses' })}
                                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${audience === 'courses' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-surface-200 dark:border-surface-700'}`}
                            >
                                <BookOpen className={`w-5 h-5 ${audience === 'courses' ? 'text-primary-500' : 'text-surface-400'}`} />
                                <div className="text-left">
                                    <p className="font-medium text-sm">Selected courses</p>
                                    <p className="text-xs text-surface-500">Only enrolled students</p>
                                </div>
                            </button>
                        </div>
                    </div>

                    {audience === 'courses' && (
                        <div className="rounded-xl border border-surface-200 dark:border-surface-700 p-3 max-h-56 overflow-y-auto space-y-1">
                            {courses.length === 0 ? (
                                <p className="text-sm text-surface-500 p-2">No courses found.</p>
                            ) : (
                                courses.map((c) => (
                                    <label key={c.id} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={courseIds.includes(c.id)}
                                            onChange={() => toggleCourse(c.id)}
                                            className="w-4 h-4 rounded text-primary-500 focus:ring-primary-500"
                                        />
                                        <span className="text-sm">{c.name}</span>
                                        {c.code && <span className="text-xs text-surface-400">({c.code})</span>}
                                    </label>
                                ))
                            )}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium mb-2">Delivery channels</label>
                        <div className="flex flex-wrap gap-3">
                            <label className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 cursor-pointer transition-all ${sendInApp ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-surface-200 dark:border-surface-700'}`}>
                                <input type="checkbox" checked={sendInApp} onChange={(e) => set({ sendInApp: e.target.checked })} className="w-4 h-4 rounded text-primary-500" />
                                <Bell className="w-4 h-4" /> <span className="text-sm font-medium">In-app notification</span>
                            </label>
                            <label className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 cursor-pointer transition-all ${sendEmail ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-surface-200 dark:border-surface-700'}`}>
                                <input type="checkbox" checked={sendEmail} onChange={(e) => set({ sendEmail: e.target.checked })} className="w-4 h-4 rounded text-primary-500" />
                                <Mail className="w-4 h-4" /> <span className="text-sm font-medium">Email</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-1">
                        <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={createMutation.isPending}
                            className="btn-primary flex items-center gap-2 disabled:opacity-60"
                        >
                            <Send className="w-4 h-4" />
                            {createMutation.isPending ? 'Sending…' : 'Send announcement'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

const Announcements = () => {
    const [composing, setComposing] = useState(false)

    const { data: annData, isLoading } = useQuery({
        queryKey: ['announcements'],
        queryFn: () => notificationService.getAnnouncements(),
    })
    const announcements = Array.isArray(annData) ? annData : (annData?.results || [])

    const stats = useMemo(() => {
        const sent = announcements.filter((a) => a.status === 'sent')
        const recipients = announcements.reduce((sum, a) => sum + (a.recipients_count || 0), 0)
        const lastSent = sent
            .map((a) => a.sent_at)
            .filter(Boolean)
            .sort((a, b) => new Date(b) - new Date(a))[0]
        return { total: announcements.length, sent: sent.length, recipients, lastSent }
    }, [announcements])

    const statCards = [
        { label: 'Announcements sent', value: stats.sent, icon: CheckCircle2, color: 'text-green-600' },
        { label: 'Recipients reached', value: stats.recipients.toLocaleString(), icon: Users, color: 'text-primary-500' },
        { label: 'Last sent', value: stats.lastSent ? new Date(stats.lastSent).toLocaleDateString() : '—', icon: Clock, color: 'text-amber-500' },
    ]

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {statCards.map((s) => (
                    <div key={s.label} className="card p-4 flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-surface-100 dark:bg-surface-800">
                            <s.icon className={`w-5 h-5 ${s.color}`} />
                        </div>
                        <div>
                            <p className="text-xl font-bold leading-tight">{s.value}</p>
                            <p className="text-xs text-surface-500">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* History header with New button */}
            <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold text-lg">Sent announcements</h3>
                <button
                    onClick={() => setComposing(true)}
                    className="btn-primary inline-flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" /> New announcement
                </button>
            </div>

            {/* History list */}
            {isLoading ? (
                <div className="card p-8 text-center text-surface-500">Loading…</div>
            ) : announcements.length === 0 ? (
                <div className="card p-10 text-center">
                    <Megaphone className="w-8 h-8 mx-auto text-surface-300 mb-3" />
                    <p className="text-sm text-surface-500 mb-4">No announcements sent yet.</p>
                    <button onClick={() => setComposing(true)} className="btn-primary inline-flex items-center gap-2 mx-auto">
                        <Plus className="w-4 h-4" /> Create your first announcement
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {announcements.map((a) => {
                        const meta = STATUS_META[a.status] || STATUS_META.sending
                        const { Icon } = meta
                        return (
                            <div key={a.id} className="card p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="font-semibold">{a.title}</p>
                                        <p className="text-sm text-surface-500 mt-0.5 line-clamp-2">{a.body}</p>
                                    </div>
                                    <span className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${meta.cls}`}>
                                        <Icon className="w-3.5 h-3.5" /> {meta.label}
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-surface-400">
                                    <span className="inline-flex items-center gap-1">
                                        {a.audience === 'all'
                                            ? <><Users className="w-3.5 h-3.5" /> Everyone</>
                                            : <><BookOpen className="w-3.5 h-3.5" /> {(a.course_names || []).join(', ') || 'Selected courses'}</>}
                                    </span>
                                    <span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {a.recipients_count} recipient(s)</span>
                                    <span className="inline-flex items-center gap-2">
                                        {a.send_in_app && <span className="inline-flex items-center gap-0.5"><Bell className="w-3.5 h-3.5" /> In-app</span>}
                                        {a.send_email && <span className="inline-flex items-center gap-0.5"><Mail className="w-3.5 h-3.5" /> Email</span>}
                                    </span>
                                    {a.sent_at && <span>{new Date(a.sent_at).toLocaleString()}</span>}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {composing && <ComposeModal onClose={() => setComposing(false)} />}
        </div>
    )
}

export default Announcements
