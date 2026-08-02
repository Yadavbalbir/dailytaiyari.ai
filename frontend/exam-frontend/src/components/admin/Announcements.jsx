import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Megaphone, Send, Users, BookOpen, Mail, Bell, CheckCircle2, Clock, XCircle } from 'lucide-react'

import { notificationService } from '../../services/notificationService'
import { courseService } from '../../services/courseService'

const STATUS_META = {
    sent: { label: 'Sent', Icon: CheckCircle2, cls: 'text-green-600 bg-green-100 dark:bg-green-900/30' },
    sending: { label: 'Sending', Icon: Clock, cls: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' },
    failed: { label: 'Failed', Icon: XCircle, cls: 'text-red-600 bg-red-100 dark:bg-red-900/30' },
}

const Announcements = () => {
    const queryClient = useQueryClient()
    const [title, setTitle] = useState('')
    const [body, setBody] = useState('')
    const [audience, setAudience] = useState('all')
    const [courseIds, setCourseIds] = useState([])
    const [sendEmail, setSendEmail] = useState(true)
    const [sendInApp, setSendInApp] = useState(true)

    const { data: coursesRaw = [] } = useQuery({
        queryKey: ['adminCourses'],
        queryFn: () => courseService.getCourses(),
    })
    const courses = useMemo(
        () => (Array.isArray(coursesRaw) ? coursesRaw : (coursesRaw?.results || [])),
        [coursesRaw],
    )

    const { data: annData, isLoading } = useQuery({
        queryKey: ['announcements'],
        queryFn: () => notificationService.getAnnouncements(),
    })
    const announcements = Array.isArray(annData) ? annData : (annData?.results || [])

    const createMutation = useMutation({
        mutationFn: (payload) => notificationService.createAnnouncement(payload),
        onSuccess: (data) => {
            toast.success(`Announcement sent to ${data.recipients_count ?? 0} recipient(s)`)
            setTitle(''); setBody(''); setAudience('all'); setCourseIds([]); setSendEmail(true); setSendInApp(true)
            queryClient.invalidateQueries({ queryKey: ['announcements'] })
        },
        onError: (err) => {
            const msg = err?.response?.data
            const detail = typeof msg === 'string' ? msg
                : msg?.non_field_errors?.[0] || msg?.detail || 'Failed to send announcement'
            toast.error(detail)
        },
    })

    const toggleCourse = (id) => {
        setCourseIds((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id])
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
        <div className="space-y-8">
            <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Megaphone className="w-5 h-5 text-primary-500" /> Announcements
                </h2>
                <p className="text-sm text-surface-500 mt-1">
                    Broadcast an update to everyone or to specific courses. Recipients get it as an
                    in-app notification and/or a branded email.
                </p>
            </div>

            {/* Compose */}
            <form onSubmit={submit} className="card p-5 sm:p-6 space-y-5">
                <div>
                    <label className="block text-sm font-medium mb-1.5">Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        maxLength={255}
                        placeholder="e.g. Holiday schedule update"
                        className="w-full px-4 py-2.5 rounded-xl bg-surface-100 dark:bg-surface-800 border-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1.5">Message</label>
                    <textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        rows={5}
                        placeholder="Write your announcement…"
                        className="w-full px-4 py-2.5 rounded-xl bg-surface-100 dark:bg-surface-800 border-none focus:ring-2 focus:ring-primary-500 resize-y"
                    />
                </div>

                {/* Audience */}
                <div>
                    <label className="block text-sm font-medium mb-2">Audience</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setAudience('all')}
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
                            onClick={() => setAudience('courses')}
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

                {/* Channels */}
                <div>
                    <label className="block text-sm font-medium mb-2">Delivery channels</label>
                    <div className="flex flex-wrap gap-3">
                        <label className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 cursor-pointer transition-all ${sendInApp ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-surface-200 dark:border-surface-700'}`}>
                            <input type="checkbox" checked={sendInApp} onChange={(e) => setSendInApp(e.target.checked)} className="w-4 h-4 rounded text-primary-500" />
                            <Bell className="w-4 h-4" /> <span className="text-sm font-medium">In-app notification</span>
                        </label>
                        <label className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 cursor-pointer transition-all ${sendEmail ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-surface-200 dark:border-surface-700'}`}>
                            <input type="checkbox" checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)} className="w-4 h-4 rounded text-primary-500" />
                            <Mail className="w-4 h-4" /> <span className="text-sm font-medium">Email</span>
                        </label>
                    </div>
                </div>

                <div className="flex justify-end pt-1">
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

            {/* History */}
            <div>
                <h3 className="font-semibold mb-3">Recent announcements</h3>
                {isLoading ? (
                    <div className="card p-8 text-center text-surface-500">Loading…</div>
                ) : announcements.length === 0 ? (
                    <div className="card p-10 text-center">
                        <Megaphone className="w-8 h-8 mx-auto text-surface-300 mb-2" />
                        <p className="text-sm text-surface-500">No announcements sent yet.</p>
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
                                        <span>{a.recipients_count} recipient(s)</span>
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
            </div>
        </div>
    )
}

export default Announcements
