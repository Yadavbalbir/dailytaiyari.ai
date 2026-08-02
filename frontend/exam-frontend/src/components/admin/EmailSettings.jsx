import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Mail, Save, RotateCcw, Eye, Loader2, Info, AtSign } from 'lucide-react'

import { notificationService } from '../../services/notificationService'
import { tenantAdminService } from '../../services/tenantAdminService'

// Live client-side preview values (mirrors the backend sample context).
const SAMPLE = {
    student_name: 'Jane Doe',
    student_email: 'jane.doe@example.com',
    course_name: 'Sample Course 101',
    reason: 'Reason: Incomplete profile',
    tenant_name: 'Your Institute',
}

const fillPlaceholders = (text, values) =>
    (text || '').replace(/\{(\w+)\}/g, (m, key) => (key in values ? values[key] : ''))

const escapeHtml = (s) =>
    (s || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')

// Mirror backend text_to_html: blank-line paragraphs, single newline → <br>.
const textToHtml = (text) =>
    (text || '')
        .replace(/\r\n/g, '\n')
        .split('\n\n')
        .map((block) => block.split('\n').filter((l) => l.trim()))
        .filter((lines) => lines.length)
        .map((lines) => `<p>${lines.map(escapeHtml).join('<br>')}</p>`)
        .join('')

const TemplateEditor = ({ template, onSaved }) => {
    const queryClient = useQueryClient()
    const [subject, setSubject] = useState(template.subject || '')
    const [heading, setHeading] = useState(template.heading || '')
    const [body, setBody] = useState(template.body || '')
    const [showPreview, setShowPreview] = useState(false)

    useEffect(() => {
        setSubject(template.subject || '')
        setHeading(template.heading || '')
        setBody(template.body || '')
    }, [template])

    const saveMutation = useMutation({
        mutationFn: () => notificationService.updateEmailTemplate(template.type, { subject, heading, body }),
        onSuccess: (data) => {
            queryClient.setQueryData(['emailTemplates'], (old = []) =>
                old.map((t) => (t.type === data.type ? data : t)),
            )
            toast.success('Template saved')
            onSaved?.(data)
        },
        onError: () => toast.error('Failed to save template'),
    })

    const resetMutation = useMutation({
        mutationFn: () => notificationService.resetEmailTemplate(template.type),
        onSuccess: (data) => {
            queryClient.setQueryData(['emailTemplates'], (old = []) =>
                old.map((t) => (t.type === data.type ? data : t)),
            )
            toast.success('Reset to default')
            onSaved?.(data)
        },
        onError: () => toast.error('Failed to reset template'),
    })

    const insertPlaceholder = (ph) => {
        setBody((prev) => `${prev}{${ph}}`)
    }

    const effSubject = subject || template.default_subject
    const effHeading = heading || template.default_heading
    const effBody = body || template.default_body

    const previewSubject = fillPlaceholders(effSubject, { ...SAMPLE, tenant_name: template.tenant_name || SAMPLE.tenant_name })
    const previewHeading = fillPlaceholders(effHeading, SAMPLE)
    const previewBodyHtml = textToHtml(fillPlaceholders(effBody, SAMPLE))

    return (
        <div className="card p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h4 className="text-base font-bold text-surface-900 dark:text-white flex items-center gap-2">
                        <Mail className="w-4 h-4 text-primary-500" /> {template.label}
                    </h4>
                    {template.description && (
                        <p className="text-sm text-surface-500 mt-1">{template.description}</p>
                    )}
                </div>
                {template.is_custom ? (
                    <span className="shrink-0 text-xs font-semibold px-2 py-1 rounded-full text-primary-600 bg-primary-100 dark:bg-primary-900/30">
                        Customised
                    </span>
                ) : (
                    <span className="shrink-0 text-xs font-semibold px-2 py-1 rounded-full text-surface-500 bg-surface-100 dark:bg-surface-800">
                        Default
                    </span>
                )}
            </div>

            {/* Placeholder chips */}
            {template.placeholders?.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-surface-500 inline-flex items-center gap-1">
                        <Info className="w-3.5 h-3.5" /> Insert:
                    </span>
                    {template.placeholders.map((ph) => (
                        <button
                            key={ph}
                            type="button"
                            onClick={() => insertPlaceholder(ph)}
                            className="text-xs font-mono px-2 py-1 rounded-md border border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-300 hover:border-primary-400 hover:text-primary-600 transition-colors"
                            title={`Insert {${ph}} into the body`}
                        >
                            {`{${ph}}`}
                        </button>
                    ))}
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Subject</label>
                <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder={template.default_subject}
                    maxLength={500}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Heading</label>
                <input
                    type="text"
                    value={heading}
                    onChange={(e) => setHeading(e.target.value)}
                    placeholder={template.default_heading}
                    maxLength={255}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                    Body <span className="text-surface-400 font-normal">(plain text — blank line starts a new paragraph)</span>
                </label>
                <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder={template.default_body}
                    rows={6}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y"
                />
                <p className="text-xs text-surface-400 mt-1">
                    Leave a field blank to use the default. The tenant logo, name and action button are added automatically.
                </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                    type="button"
                    onClick={() => saveMutation.mutate()}
                    disabled={saveMutation.isPending}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold disabled:opacity-60 transition-colors"
                >
                    {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save
                </button>
                <button
                    type="button"
                    onClick={() => setShowPreview((v) => !v)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-200 text-sm font-semibold hover:border-primary-400 transition-colors"
                >
                    <Eye className="w-4 h-4" /> {showPreview ? 'Hide preview' : 'Preview'}
                </button>
                {template.is_custom && (
                    <button
                        type="button"
                        onClick={() => resetMutation.mutate()}
                        disabled={resetMutation.isPending}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 text-surface-500 text-sm font-semibold hover:text-red-600 hover:border-red-300 disabled:opacity-60 transition-colors"
                    >
                        {resetMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                        Reset to default
                    </button>
                )}
            </div>

            {showPreview && (
                <div className="rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
                    <div className="px-4 py-2.5 bg-surface-50 dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700">
                        <p className="text-xs text-surface-400">Subject</p>
                        <p className="text-sm font-semibold text-surface-900 dark:text-white">{previewSubject}</p>
                    </div>
                    <div className="p-5 bg-white dark:bg-surface-900">
                        <p className="text-lg font-bold text-surface-900 dark:text-white mb-3">{previewHeading}</p>
                        <div
                            className="prose prose-sm max-w-none text-surface-700 dark:text-surface-300 [&_p]:mb-3"
                            dangerouslySetInnerHTML={{ __html: previewBodyHtml }}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}

const EmailSettings = ({ settings }) => {
    const queryClient = useQueryClient()
    const [notificationEmail, setNotificationEmail] = useState(settings?.notification_email || '')

    useEffect(() => {
        setNotificationEmail(settings?.notification_email || '')
    }, [settings?.notification_email])

    const { data: templates = [], isLoading } = useQuery({
        queryKey: ['emailTemplates'],
        queryFn: () => notificationService.getEmailTemplates(),
    })

    const emailMutation = useMutation({
        mutationFn: (val) => tenantAdminService.updateNotificationEmail(val),
        onSuccess: (data) => {
            queryClient.setQueryData(['tenantSettings'], data)
            toast.success('Notification email updated')
        },
        onError: (err) => {
            const msg = err?.response?.data?.notification_email?.[0] || 'Failed to update notification email'
            toast.error(msg)
        },
    })

    return (
        <div className="space-y-6">
            {/* Recipient address */}
            <div className="card p-6 space-y-4">
                <div className="flex items-center gap-2">
                    <AtSign className="w-5 h-5 text-primary-500" />
                    <h3 className="text-lg font-bold text-surface-900 dark:text-white">Notification recipient</h3>
                </div>
                <p className="text-sm text-surface-500">
                    Where should admin notification emails (like new enrollment requests) be sent? Separate multiple
                    addresses with commas. Leave blank to send to all admin accounts.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                            Notification email(s)
                        </label>
                        <input
                            type="text"
                            value={notificationEmail}
                            onChange={(e) => setNotificationEmail(e.target.value)}
                            placeholder="admissions@institute.com, office@institute.com"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => emailMutation.mutate(notificationEmail)}
                        disabled={emailMutation.isPending}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold disabled:opacity-60 transition-colors"
                    >
                        {emailMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save
                    </button>
                </div>
            </div>

            {/* Template editors */}
            <div>
                <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-1">Email templates</h3>
                <p className="text-sm text-surface-500 mb-4">
                    Customise the wording of the automated enrollment emails. Every email keeps your institution's logo,
                    name and branding.
                </p>
                {isLoading ? (
                    <div className="flex items-center justify-center min-h-[160px]">
                        <Loader2 className="w-7 h-7 animate-spin text-primary-500" />
                    </div>
                ) : (
                    <div className="space-y-5">
                        {templates.map((t) => (
                            <TemplateEditor key={t.type} template={t} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default EmailSettings
