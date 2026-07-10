import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
    Plus, Pencil, Trash2, X, ChevronDown, ChevronRight, Loader2, Save,
    GraduationCap, Book, Layers, FileText, Hash, AlertTriangle, Search,
    ListChecks, CheckCircle2, Circle,
} from 'lucide-react'
import { contentBuilderService as svc } from '../../services/contentBuilderService'
import { NotesTextarea } from './builderShared'

/* ===========================================================================
 * Field / form configuration per entity
 * ========================================================================= */
const EXAM_TYPES = ['competitive', 'board', 'entrance', 'government', 'skill']
const EXAM_STATUS = ['active', 'coming_soon', 'inactive']
const DIFFICULTY = ['easy', 'medium', 'hard']
const IMPORTANCE = ['low', 'medium', 'high', 'critical']
const CONTENT_TYPES = ['notes', 'video', 'pdf', 'interactive', 'revision', 'formula']
const CONTENT_DIFFICULTY = ['beginner', 'intermediate', 'advanced']
const CONTENT_STATUS = ['draft', 'published', 'archived']
const QUIZ_TYPES = ['topic', 'subject', 'chapter', 'daily', 'custom', 'pyq']
const QUIZ_STATUS = ['draft', 'published', 'archived']
const QUESTION_TYPES = ['mcq', 'true_false', 'numerical', 'fill_blank']
const QUESTION_STATUS = ['draft', 'review', 'published', 'archived']
const QTYPE_LABEL = {
    mcq: 'Multiple Choice', true_false: 'True / False',
    numerical: 'Numerical', fill_blank: 'Fill in the Blank',
}

const opt = (arr) => arr.map((v) => ({ value: v, label: v.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) }))

const SCHEMAS = {
    exam: {
        title: 'Course',
        fields: [
            { name: 'name', label: 'Name', type: 'text', required: true },
            { name: 'code', label: 'Code', type: 'text', required: true, hint: 'Unique slug, e.g. neet' },
            { name: 'subtitle', label: 'Subtitle / tagline', type: 'text', full: true },
            { name: 'course_type', label: 'Type', type: 'select', options: opt(EXAM_TYPES), default: 'competitive' },
            { name: 'status', label: 'Status', type: 'select', options: opt(EXAM_STATUS), default: 'active' },
            { name: 'color', label: 'Color', type: 'color', default: '#3B82F6' },
            { name: 'duration_minutes', label: 'Duration (min)', type: 'number' },
            { name: 'total_marks', label: 'Total Marks', type: 'number' },
            { name: 'is_featured', label: 'Featured', type: 'checkbox' },
            { name: 'negative_marking', label: 'Negative Marking', type: 'checkbox' },
            { name: 'pricing_type', label: 'Pricing', type: 'select', options: opt(['free', 'paid']), default: 'free' },
            { name: 'price', label: 'Price', type: 'number', step: '0.01', default: 0, hint: 'Used when pricing is paid.' },
            { name: 'original_price', label: 'Original price (strike-through)', type: 'number', step: '0.01' },
            { name: 'currency', label: 'Currency', type: 'select', options: opt(['INR', 'USD', 'EUR', 'GBP']), default: 'INR' },
            { name: 'description', label: 'Description', type: 'textarea', full: true, image: true, rows: 10, hint: 'Supports rich HTML / Markdown and images — paste, drop, or add an image directly.' },
            { name: 'highlights', label: 'What you will get (one point per line)', type: 'stringlist', full: true, placeholder: 'All Previous Year Questions (PYQ)\nFully solved answers\nExam-oriented approach' },
            { name: 'refund_policy', label: 'Refund policy', type: 'textarea', full: true },
        ],
    },
    subject: {
        title: 'Subject',
        fields: [
            { name: 'name', label: 'Name', type: 'text', required: true },
            { name: 'code', label: 'Code', type: 'text', required: true },
            { name: 'weightage', label: 'Weightage (%)', type: 'number', step: '0.01' },
            { name: 'order', label: 'Order', type: 'number', default: 0 },
            { name: 'color', label: 'Color', type: 'color', default: '#10B981' },
            { name: 'icon', label: 'Icon name', type: 'text' },
            { name: 'description', label: 'Description', type: 'textarea', full: true },
        ],
    },
    chapter: {
        title: 'Chapter',
        fields: [
            { name: 'name', label: 'Name', type: 'text', required: true },
            { name: 'code', label: 'Code', type: 'text', required: true },
            { name: 'grade', label: 'Grade', type: 'text', hint: 'e.g. 11, 12' },
            { name: 'book_reference', label: 'Book Reference', type: 'text' },
            { name: 'estimated_hours', label: 'Est. Hours', type: 'number', step: '0.1', default: 2 },
            { name: 'order', label: 'Order', type: 'number', default: 0 },
            { name: 'description', label: 'Description', type: 'textarea', full: true },
        ],
    },
    topic: {
        title: 'Topic',
        fields: [
            { name: 'name', label: 'Name', type: 'text', required: true },
            { name: 'code', label: 'Code', type: 'text', required: true },
            { name: 'difficulty', label: 'Difficulty', type: 'select', options: opt(DIFFICULTY), default: 'medium' },
            { name: 'importance', label: 'Importance', type: 'select', options: opt(IMPORTANCE), default: 'medium' },
            { name: 'estimated_study_hours', label: 'Est. Study Hours', type: 'number', step: '0.1', default: 1 },
            { name: 'order', label: 'Order', type: 'number', default: 0 },
            { name: 'description', label: 'Description', type: 'textarea', full: true },
        ],
    },
    content: {
        title: 'Content',
        fields: [
            { name: 'title', label: 'Title', type: 'text', required: true, full: true },
            { name: 'content_type', label: 'Type', type: 'select', options: opt(CONTENT_TYPES), default: 'notes' },
            { name: 'status', label: 'Status', type: 'select', options: opt(CONTENT_STATUS), default: 'draft' },
            { name: 'difficulty', label: 'Difficulty', type: 'select', options: opt(CONTENT_DIFFICULTY), default: 'intermediate' },
            { name: 'estimated_time_minutes', label: 'Read Time (min)', type: 'number', default: 10 },
            { name: 'order', label: 'Order', type: 'number', default: 0 },
            { name: 'author_name', label: 'Author', type: 'text' },
            { name: 'video_url', label: 'Video URL', type: 'text', full: true },
            { name: 'is_free', label: 'Free', type: 'checkbox' },
            { name: 'is_premium', label: 'Premium', type: 'checkbox' },
            { name: 'description', label: 'Description', type: 'textarea', full: true },
            { name: 'content_html', label: 'Content (HTML)', type: 'textarea', full: true, rows: 10 },
        ],
    },
    quiz: {
        title: 'Quiz',
        fields: [
            { name: 'title', label: 'Title', type: 'text', required: true, full: true },
            { name: 'quiz_type', label: 'Type', type: 'select', options: opt(QUIZ_TYPES), default: 'topic' },
            { name: 'status', label: 'Status', type: 'select', options: opt(QUIZ_STATUS), default: 'draft' },
            { name: 'duration_minutes', label: 'Duration (min)', type: 'number', default: 15 },
            { name: 'passing_marks', label: 'Passing Marks', type: 'number', step: '0.01' },
            { name: 'is_free', label: 'Free', type: 'checkbox' },
            { name: 'shuffle_questions', label: 'Shuffle Questions', type: 'checkbox', default: true },
            { name: 'shuffle_options', label: 'Shuffle Options', type: 'checkbox', default: true },
            { name: 'description', label: 'Description', type: 'textarea', full: true },
        ],
    },
    question: {
        // Questions use a dedicated modal (QuestionModal); this entry only
        // supplies a title for delete/confirm toasts.
        title: 'Question',
        fields: [],
    },
}

/* ===========================================================================
 * Generic modal form
 * ========================================================================= */
const buildInitial = (fields, instance) => {
    const out = {}
    fields.forEach((f) => {
        let v = instance ? instance[f.name] : undefined
        if (f.type === 'stringlist') {
            out[f.name] = Array.isArray(v) ? v : (v == null ? (f.default ?? []) : [])
            return
        }
        if (v === undefined || v === null) v = f.default ?? (f.type === 'checkbox' ? false : '')
        out[f.name] = v
    })
    return out
}

const EntityModal = ({ type, instance, onClose, onSubmit, saving }) => {
    const schema = SCHEMAS[type]
    const [values, setValues] = useState(() => buildInitial(schema.fields, instance))
    const isEdit = !!instance

    const set = (name, val) => setValues((p) => ({ ...p, [name]: val }))

    const handleSubmit = (e) => {
        e.preventDefault()
        const payload = {}
        schema.fields.forEach((f) => {
            let v = values[f.name]
            if (f.type === 'number') {
                v = v === '' || v === null ? null : Number(v)
                if (v === null && !f.required) return
            }
            if (f.type === 'stringlist') {
                const arr = Array.isArray(v) ? v : String(v || '').split('\n')
                v = arr.map((s) => String(s).trim()).filter(Boolean)
            }
            payload[f.name] = v
        })
        onSubmit(payload)
    }

    return (
        <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
            <motion.div
                className="card w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
                initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
            >
                <div className="flex items-center justify-between p-5 border-b border-surface-200 dark:border-surface-800">
                    <h3 className="text-lg font-bold text-surface-900 dark:text-white">
                        {isEdit ? 'Edit' : 'New'} {schema.title}
                    </h3>
                    <button onClick={onClose} className="btn-icon"><X className="w-5 h-5" /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {schema.fields.map((f) => (
                            <div key={f.name} className={f.full || f.type === 'textarea' || f.type === 'stringlist' ? 'sm:col-span-2' : ''}>
                                {f.type === 'checkbox' ? (
                                    <label className="flex items-center gap-2 cursor-pointer py-2">
                                        <input
                                            type="checkbox"
                                            checked={!!values[f.name]}
                                            onChange={(e) => set(f.name, e.target.checked)}
                                            className="w-4 h-4 rounded accent-primary-500"
                                        />
                                        <span className="text-sm font-medium text-surface-700 dark:text-surface-300">{f.label}</span>
                                    </label>
                                ) : (
                                    <>
                                        <label className="block text-xs font-semibold text-surface-500 mb-1.5">
                                            {f.label}{f.required && <span className="text-rose-500"> *</span>}
                                        </label>
                                        {f.type === 'textarea' ? (
                                            f.image ? (
                                                <NotesTextarea value={values[f.name] ?? ''} onChange={(val) => set(f.name, val)} rows={f.rows} />
                                            ) : (
                                                <textarea
                                                    className="input font-mono text-sm" rows={f.rows || 3}
                                                    value={values[f.name] ?? ''}
                                                    onChange={(e) => set(f.name, e.target.value)}
                                                />
                                            )
                                        ) : f.type === 'stringlist' ? (
                                            <textarea
                                                className="input text-sm" rows={f.rows || 4}
                                                placeholder={f.placeholder || 'One item per line'}
                                                value={(Array.isArray(values[f.name]) ? values[f.name] : []).join('\n')}
                                                onChange={(e) => set(f.name, e.target.value.split('\n'))}
                                            />
                                        ) : f.type === 'select' ? (
                                            <select className="input" value={values[f.name] ?? ''} onChange={(e) => set(f.name, e.target.value)}>
                                                {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                            </select>
                                        ) : f.type === 'color' ? (
                                            <div className="flex items-center gap-2">
                                                <input type="color" value={values[f.name] || '#3B82F6'} onChange={(e) => set(f.name, e.target.value)} className="h-11 w-14 rounded-lg border border-surface-200 dark:border-surface-700 bg-transparent cursor-pointer" />
                                                <input type="text" className="input" value={values[f.name] ?? ''} onChange={(e) => set(f.name, e.target.value)} />
                                            </div>
                                        ) : (
                                            <input
                                                type={f.type} step={f.step}
                                                className="input"
                                                value={values[f.name] ?? ''}
                                                onChange={(e) => set(f.name, e.target.value)}
                                                required={f.required}
                                            />
                                        )}
                                        {f.hint && <p className="text-[11px] text-surface-400 mt-1">{f.hint}</p>}
                                    </>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                        <button type="submit" disabled={saving} className="btn-primary">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {isEdit ? 'Save Changes' : 'Create'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    )
}

/* ===========================================================================
 * Confirm delete dialog
 * ========================================================================= */
const ConfirmDialog = ({ label, onCancel, onConfirm, deleting }) => (
    <motion.div
        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onMouseDown={(e) => e.target === e.currentTarget && onCancel()}
    >
        <motion.div className="card w-full max-w-md p-6 text-center" initial={{ scale: 0.95 }} animate={{ scale: 1 }}>
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-rose-500" />
            </div>
            <h3 className="text-lg font-bold text-surface-900 dark:text-white">Delete {label}?</h3>
            <p className="text-sm text-surface-500 mt-1">This action cannot be undone. All nested content will be removed.</p>
            <div className="flex justify-center gap-2 mt-5">
                <button onClick={onCancel} className="btn-secondary">Cancel</button>
                <button onClick={onConfirm} disabled={deleting} className="btn bg-rose-500 text-white hover:bg-rose-600">
                    {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} Delete
                </button>
            </div>
        </motion.div>
    </motion.div>
)

/* ===========================================================================
 * Small action buttons
 * ========================================================================= */
const RowActions = ({ onEdit, onDelete, onAdd, addLabel }) => (
    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
        {onAdd && (
            <button onClick={onAdd} title={addLabel} className="p-1.5 rounded-lg text-surface-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
                <Plus className="w-4 h-4" />
            </button>
        )}
        {onEdit && (
            <button onClick={onEdit} title="Edit" className="p-1.5 rounded-lg text-surface-400 hover:text-primary-600 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
                <Pencil className="w-3.5 h-3.5" />
            </button>
        )}
        {onDelete && (
            <button onClick={onDelete} title="Delete" className="p-1.5 rounded-lg text-surface-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
            </button>
        )}
    </div>
)

/* ===========================================================================
 * Content rows (leaf level for a topic)
 * ========================================================================= */
const ContentList = ({ topic, subjectId, openModal, askDelete }) => {
    const { data: contents = [], isLoading } = useQuery({
        queryKey: ['cb-contents', topic.id],
        queryFn: () => svc.getContents(topic.id),
    })

    return (
        <div className="pl-6 sm:pl-9 py-2 space-y-1">
            <div className="flex items-center justify-between px-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-surface-400">Content</span>
                <button
                    onClick={() => openModal('content', null, { topic: topic.id, subject: subjectId })}
                    className="text-xs font-semibold text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
                >
                    <Plus className="w-3.5 h-3.5" /> Add Content
                </button>
            </div>
            {isLoading ? (
                <div className="py-3 flex justify-center"><Loader2 className="w-4 h-4 animate-spin text-surface-400" /></div>
            ) : contents.length === 0 ? (
                <p className="text-xs text-surface-400 italic px-2 py-2">No content yet.</p>
            ) : (
                contents.map((ct) => (
                    <div key={ct.id} className="group flex items-center justify-between gap-2 px-2 py-2 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800/50">
                        <div className="flex items-center gap-2 min-w-0">
                            <FileText className="w-3.5 h-3.5 text-surface-400 shrink-0" />
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-surface-700 dark:text-surface-200 truncate">{ct.title}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-100 dark:bg-surface-800 text-surface-500 capitalize">{ct.content_type}</span>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded capitalize ${ct.status === 'published' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>{ct.status}</span>
                                </div>
                            </div>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <RowActions
                                onEdit={() => openModal('content', ct, { topic: topic.id, subject: subjectId })}
                                onDelete={() => askDelete('content', ct, ct.title)}
                            />
                        </div>
                    </div>
                ))
            )}
        </div>
    )
}

/* ===========================================================================
 * Question editor modal (dynamic by question type)
 * ========================================================================= */
const QuestionModal = ({ instance, onClose, onSubmit, saving }) => {
    const isEdit = !!instance
    const initType = instance?.question_type || 'mcq'

    const initOptions = () => {
        if (instance?.options?.length) {
            return [...instance.options]
                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                .map((o) => ({ option_text: o.option_text }))
        }
        return [{ option_text: '' }, { option_text: '' }]
    }
    const initCorrect = () => {
        const n = Number(instance?.correct_answer)
        return Number.isInteger(n) && n >= 0 ? n : 0
    }

    const [v, setV] = useState(() => ({
        question_text: instance?.question_text || '',
        question_type: initType,
        difficulty: instance?.difficulty || 'medium',
        status: instance?.status || 'published',
        marks: instance?.marks ?? 1,
        negative_marks: instance?.negative_marks ?? 0,
        explanation: instance?.explanation || '',
        numerical_answer: instance?.numerical_answer ?? '',
        numerical_tolerance: instance?.numerical_tolerance ?? 0.01,
        fill_answer: initType === 'fill_blank' ? (instance?.correct_answer || '') : '',
    }))
    const [options, setOptions] = useState(initOptions)
    const [correctIndex, setCorrectIndex] = useState(initCorrect)

    const set = (k, val) => setV((p) => ({ ...p, [k]: val }))
    const type = v.question_type

    const setOption = (i, text) => setOptions((p) => p.map((o, idx) => (idx === i ? { option_text: text } : o)))
    const addOption = () => setOptions((p) => [...p, { option_text: '' }])
    const removeOption = (i) => {
        setOptions((p) => p.filter((_, idx) => idx !== i))
        setCorrectIndex((c) => (c === i ? 0 : c > i ? c - 1 : c))
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!v.question_text.trim()) return toast.error('Question text is required')

        const base = {
            question_text: v.question_text.trim(),
            question_type: type,
            difficulty: v.difficulty,
            status: v.status,
            marks: Number(v.marks) || 0,
            negative_marks: Number(v.negative_marks) || 0,
            explanation: v.explanation,
        }

        if (type === 'mcq') {
            const cleaned = options
                .map((o, i) => ({ option_text: o.option_text.trim(), is_correct: i === correctIndex }))
                .filter((o) => o.option_text !== '')
            if (cleaned.length < 2) return toast.error('Add at least two options')
            let ci = cleaned.findIndex((o) => o.is_correct)
            if (ci < 0) ci = 0
            base.options = cleaned.map((o, i) => ({ option_text: o.option_text, is_correct: i === ci }))
            base.correct_answer = String(ci)
        } else if (type === 'true_false') {
            base.options = [
                { option_text: 'True', is_correct: correctIndex === 0 },
                { option_text: 'False', is_correct: correctIndex === 1 },
            ]
            base.correct_answer = String(correctIndex)
        } else if (type === 'numerical') {
            if (v.numerical_answer === '' || v.numerical_answer === null)
                return toast.error('Numerical answer is required')
            base.numerical_answer = Number(v.numerical_answer)
            base.numerical_tolerance = Number(v.numerical_tolerance) || 0
            base.correct_answer = String(v.numerical_answer)
            base.options = []
        } else if (type === 'fill_blank') {
            if (!v.fill_answer.trim()) return toast.error('Expected answer is required')
            base.correct_answer = v.fill_answer.trim()
            base.options = []
        }
        onSubmit(base)
    }

    const tfIndex = correctIndex === 1 ? 1 : 0

    return (
        <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
            <motion.div
                className="card w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
                initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
            >
                <div className="flex items-center justify-between p-5 border-b border-surface-200 dark:border-surface-800">
                    <h3 className="text-lg font-bold text-surface-900 dark:text-white">{isEdit ? 'Edit' : 'New'} Question</h3>
                    <button onClick={onClose} className="btn-icon"><X className="w-5 h-5" /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-surface-500 mb-1.5">Question<span className="text-rose-500"> *</span></label>
                        <textarea className="input" rows={3} value={v.question_text} onChange={(e) => set('question_text', e.target.value)} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-surface-500 mb-1.5">Type</label>
                            <select className="input" value={type} onChange={(e) => { set('question_type', e.target.value); setCorrectIndex(0) }}>
                                {QUESTION_TYPES.map((t) => <option key={t} value={t}>{QTYPE_LABEL[t]}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-surface-500 mb-1.5">Difficulty</label>
                            <select className="input" value={v.difficulty} onChange={(e) => set('difficulty', e.target.value)}>
                                {DIFFICULTY.map((d) => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-surface-500 mb-1.5">Status</label>
                            <select className="input" value={v.status} onChange={(e) => set('status', e.target.value)}>
                                {QUESTION_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Type-specific answer editor */}
                    {type === 'mcq' && (
                        <div className="space-y-2">
                            <label className="block text-xs font-semibold text-surface-500">Options <span className="text-surface-400 font-normal">(select the correct one)</span></label>
                            {options.map((o, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <button type="button" onClick={() => setCorrectIndex(i)} title="Mark correct" className="shrink-0">
                                        {correctIndex === i
                                            ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                            : <Circle className="w-5 h-5 text-surface-300 hover:text-surface-400" />}
                                    </button>
                                    <input className="input" placeholder={`Option ${i + 1}`} value={o.option_text} onChange={(e) => setOption(i, e.target.value)} />
                                    {options.length > 2 && (
                                        <button type="button" onClick={() => removeOption(i)} className="btn-icon text-surface-400 hover:text-rose-500"><X className="w-4 h-4" /></button>
                                    )}
                                </div>
                            ))}
                            <button type="button" onClick={addOption} className="text-xs font-semibold text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add Option</button>
                        </div>
                    )}

                    {type === 'true_false' && (
                        <div>
                            <label className="block text-xs font-semibold text-surface-500 mb-1.5">Correct Answer</label>
                            <div className="flex gap-2">
                                {['True', 'False'].map((lbl, i) => (
                                    <button key={lbl} type="button" onClick={() => setCorrectIndex(i)}
                                        className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all ${tfIndex === i ? 'bg-primary-500 text-white border-primary-500' : 'bg-white dark:bg-surface-900 text-surface-600 dark:text-surface-300 border-surface-200 dark:border-surface-700'}`}>
                                        {lbl}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {type === 'numerical' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-surface-500 mb-1.5">Answer<span className="text-rose-500"> *</span></label>
                                <input type="number" step="any" className="input" value={v.numerical_answer} onChange={(e) => set('numerical_answer', e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-surface-500 mb-1.5">Tolerance (±)</label>
                                <input type="number" step="any" className="input" value={v.numerical_tolerance} onChange={(e) => set('numerical_tolerance', e.target.value)} />
                            </div>
                        </div>
                    )}

                    {type === 'fill_blank' && (
                        <div>
                            <label className="block text-xs font-semibold text-surface-500 mb-1.5">Expected Answer<span className="text-rose-500"> *</span></label>
                            <input className="input" value={v.fill_answer} onChange={(e) => set('fill_answer', e.target.value)} />
                            <p className="text-[11px] text-surface-400 mt-1">Matched case-insensitively, ignoring leading/trailing spaces.</p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-surface-500 mb-1.5">Marks</label>
                            <input type="number" step="0.01" className="input" value={v.marks} onChange={(e) => set('marks', e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-surface-500 mb-1.5">Negative Marks</label>
                            <input type="number" step="0.01" className="input" value={v.negative_marks} onChange={(e) => set('negative_marks', e.target.value)} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-surface-500 mb-1.5">Explanation</label>
                        <textarea className="input" rows={2} value={v.explanation} onChange={(e) => set('explanation', e.target.value)} />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                        <button type="submit" disabled={saving} className="btn-primary">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {isEdit ? 'Save Changes' : 'Create'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    )
}

/* ===========================================================================
 * Questions inside a quiz
 * ========================================================================= */
const QuestionList = ({ quiz, topicId, subjectId, askDelete }) => {
    const queryClient = useQueryClient()
    const [qModal, setQModal] = useState(null) // { instance } | null
    const { data: questions = [], isLoading } = useQuery({
        queryKey: ['cb-questions', quiz.id],
        queryFn: () => svc.getQuestions(quiz.id),
    })

    const refresh = () => {
        queryClient.invalidateQueries({ queryKey: ['cb-questions', quiz.id] })
        queryClient.invalidateQueries({ queryKey: ['cb-quizzes'] })
    }

    const saveMutation = useMutation({
        mutationFn: ({ instance, payload }) =>
            instance
                ? svc.updateQuestion(instance.id, payload)
                : svc.createQuestion({ ...payload, quiz: quiz.id, topic: topicId, subject: subjectId }),
        onSuccess: (_d, vars) => {
            toast.success(`Question ${vars.instance ? 'updated' : 'created'}`)
            refresh()
            setQModal(null)
        },
        onError: (err) => {
            const data = err?.response?.data
            toast.error(data && typeof data === 'object'
                ? Object.entries(data).map(([k, val]) => `${k}: ${Array.isArray(val) ? val.join(', ') : val}`).join(' | ')
                : 'Something went wrong')
        },
    })

    return (
        <div className="pl-6 sm:pl-9 py-2 space-y-1">
            <div className="flex items-center justify-between px-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-surface-400">Questions</span>
                <button onClick={() => setQModal({ instance: null })} className="text-xs font-semibold text-primary-600 hover:text-primary-700 inline-flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" /> Add Question
                </button>
            </div>
            {isLoading ? (
                <div className="py-3 flex justify-center"><Loader2 className="w-4 h-4 animate-spin text-surface-400" /></div>
            ) : questions.length === 0 ? (
                <p className="text-xs text-surface-400 italic px-2 py-2">No questions yet.</p>
            ) : (
                questions.map((q, idx) => (
                    <div key={q.id} className="group flex items-center justify-between gap-2 px-2 py-2 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800/50">
                        <div className="flex items-start gap-2 min-w-0">
                            <span className="text-[11px] font-bold text-surface-400 mt-0.5 shrink-0">{idx + 1}.</span>
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-surface-700 dark:text-surface-200 line-clamp-2">{q.question_text}</p>
                                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-100 dark:bg-surface-800 text-surface-500">{QTYPE_LABEL[q.question_type] || q.question_type}</span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-100 dark:bg-surface-800 text-surface-500 capitalize">{q.difficulty}</span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-100 dark:bg-surface-800 text-surface-500">{q.marks} mk</span>
                                </div>
                            </div>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <RowActions
                                onEdit={() => setQModal({ instance: q })}
                                onDelete={() => askDelete('question', q, q.question_text?.slice(0, 40) || 'question')}
                            />
                        </div>
                    </div>
                ))
            )}

            <AnimatePresence>
                {qModal && (
                    <QuestionModal
                        instance={qModal.instance}
                        saving={saveMutation.isPending}
                        onClose={() => setQModal(null)}
                        onSubmit={(payload) => saveMutation.mutate({ instance: qModal.instance, payload })}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}

/* ===========================================================================
 * Quizzes under a topic
 * ========================================================================= */
const QuizList = ({ topic, subjectId, openModal, askDelete }) => {
    const [expanded, setExpanded] = useState(null)
    const { data: quizzes = [], isLoading } = useQuery({
        queryKey: ['cb-quizzes', topic.id],
        queryFn: () => svc.getQuizzes(topic.id),
    })

    return (
        <div className="pl-6 sm:pl-9 py-2 space-y-1">
            <div className="flex items-center justify-between px-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-surface-400">Quizzes</span>
                <button
                    onClick={() => openModal('quiz', null, { topic: topic.id, subject: subjectId })}
                    className="text-xs font-semibold text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
                >
                    <Plus className="w-3.5 h-3.5" /> Add Quiz
                </button>
            </div>
            {isLoading ? (
                <div className="py-3 flex justify-center"><Loader2 className="w-4 h-4 animate-spin text-surface-400" /></div>
            ) : quizzes.length === 0 ? (
                <p className="text-xs text-surface-400 italic px-2 py-2">No quizzes yet.</p>
            ) : (
                quizzes.map((qz) => (
                    <div key={qz.id} className="rounded-lg border border-surface-100 dark:border-surface-800 overflow-hidden">
                        <div
                            className="group flex items-center justify-between gap-2 px-2 py-2 cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-800/50"
                            onClick={() => setExpanded(expanded === qz.id ? null : qz.id)}
                        >
                            <div className="flex items-center gap-2 min-w-0">
                                {expanded === qz.id ? <ChevronDown className="w-3.5 h-3.5 text-surface-400 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-surface-400 shrink-0" />}
                                <ListChecks className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                                <span className="text-sm font-medium text-surface-700 dark:text-surface-200 truncate">{qz.title}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-100 dark:bg-surface-800 text-surface-500 shrink-0">{qz.questions_count ?? 0} Q</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded capitalize shrink-0 ${qz.status === 'published' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>{qz.status}</span>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <RowActions
                                    onEdit={() => openModal('quiz', qz, { topic: topic.id, subject: subjectId })}
                                    onDelete={() => askDelete('quiz', qz, qz.title)}
                                />
                            </div>
                        </div>
                        <AnimatePresence>
                            {expanded === qz.id && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-surface-50/40 dark:bg-surface-900/30 border-t border-surface-100 dark:border-surface-800">
                                    <QuestionList quiz={qz} topicId={topic.id} subjectId={subjectId} askDelete={askDelete} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))
            )}
        </div>
    )
}

/* ===========================================================================
 * Topic rows (under a chapter)
 * ========================================================================= */
const TopicList = ({ chapter, subjectId, openModal, askDelete }) => {
    const [expanded, setExpanded] = useState(null)
    const { data: topics = [], isLoading } = useQuery({
        queryKey: ['cb-topics', chapter.id],
        queryFn: () => svc.getTopics({ chapterId: chapter.id }),
    })

    return (
        <div className="pl-6 sm:pl-9 py-2 space-y-1">
            <div className="flex items-center justify-between px-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-surface-400">Topics</span>
                <button
                    onClick={() => openModal('topic', null, { subject: subjectId, chapter: chapter.id })}
                    className="text-xs font-semibold text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
                >
                    <Plus className="w-3.5 h-3.5" /> Add Topic
                </button>
            </div>
            {isLoading ? (
                <div className="py-3 flex justify-center"><Loader2 className="w-4 h-4 animate-spin text-surface-400" /></div>
            ) : topics.length === 0 ? (
                <p className="text-xs text-surface-400 italic px-2 py-2">No topics yet.</p>
            ) : (
                topics.map((tp) => (
                    <div key={tp.id} className="rounded-lg border border-surface-100 dark:border-surface-800 overflow-hidden">
                        <div
                            className="group flex items-center justify-between gap-2 px-2 py-2 cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-800/50"
                            onClick={() => setExpanded(expanded === tp.id ? null : tp.id)}
                        >
                            <div className="flex items-center gap-2 min-w-0">
                                {expanded === tp.id ? <ChevronDown className="w-3.5 h-3.5 text-surface-400 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-surface-400 shrink-0" />}
                                <Hash className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                                <span className="text-sm font-medium text-surface-700 dark:text-surface-200 truncate">{tp.name}</span>
                                <span className="text-[10px] text-surface-400 shrink-0 hidden sm:inline">{tp.content_count ?? 0} content</span>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <RowActions
                                    onEdit={() => openModal('topic', tp, { subject: subjectId })}
                                    onDelete={() => askDelete('topic', tp, tp.name)}
                                />
                            </div>
                        </div>
                        <AnimatePresence>
                            {expanded === tp.id && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-surface-50/40 dark:bg-surface-900/30 border-t border-surface-100 dark:border-surface-800">
                                    <ContentList topic={tp} subjectId={subjectId} openModal={openModal} askDelete={askDelete} />
                                    <QuizList topic={tp} subjectId={subjectId} openModal={openModal} askDelete={askDelete} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))
            )}
        </div>
    )
}

/* ===========================================================================
 * Chapter rows (under a subject)
 * ========================================================================= */
const ChapterList = ({ subject, openModal, askDelete }) => {
    const [expanded, setExpanded] = useState(null)
    const { data: chapters = [], isLoading } = useQuery({
        queryKey: ['cb-chapters', subject.id],
        queryFn: () => svc.getChapters(subject.id),
    })

    return (
        <div className="pl-4 sm:pl-6 py-2 space-y-1.5">
            <div className="flex items-center justify-between px-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-surface-400">Chapters</span>
                <button
                    onClick={() => openModal('chapter', null, { subject: subject.id })}
                    className="text-xs font-semibold text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
                >
                    <Plus className="w-3.5 h-3.5" /> Add Chapter
                </button>
            </div>
            {isLoading ? (
                <div className="py-3 flex justify-center"><Loader2 className="w-4 h-4 animate-spin text-surface-400" /></div>
            ) : chapters.length === 0 ? (
                <p className="text-xs text-surface-400 italic px-2 py-2">No chapters yet.</p>
            ) : (
                chapters.map((ch) => (
                    <div key={ch.id} className="rounded-xl border border-surface-100 dark:border-surface-800 overflow-hidden bg-white dark:bg-surface-900">
                        <div
                            className="group flex items-center justify-between gap-2 px-3 py-2.5 cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-800/50"
                            onClick={() => setExpanded(expanded === ch.id ? null : ch.id)}
                        >
                            <div className="flex items-center gap-2 min-w-0">
                                {expanded === ch.id ? <ChevronDown className="w-4 h-4 text-surface-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-surface-400 shrink-0" />}
                                <Layers className="w-4 h-4 text-indigo-500 shrink-0" />
                                <span className="text-sm font-semibold text-surface-800 dark:text-surface-100 truncate">{ch.name}</span>
                                <span className="text-[10px] bg-surface-100 dark:bg-surface-800 px-1.5 py-0.5 rounded-full text-surface-500 shrink-0">{ch.topics_count ?? 0} topics</span>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <RowActions
                                    onEdit={() => openModal('chapter', ch, { subject: subject.id })}
                                    onDelete={() => askDelete('chapter', ch, ch.name)}
                                />
                            </div>
                        </div>
                        <AnimatePresence>
                            {expanded === ch.id && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-surface-100 dark:border-surface-800">
                                    <TopicList chapter={ch} subjectId={subject.id} openModal={openModal} askDelete={askDelete} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))
            )}
        </div>
    )
}

/* ===========================================================================
 * Subject rows (under an exam)
 * ========================================================================= */
const SubjectList = ({ examId, openModal, askDelete }) => {
    const [expanded, setExpanded] = useState(null)
    const { data: subjects = [], isLoading } = useQuery({
        queryKey: ['cb-subjects', examId],
        queryFn: () => svc.getSubjects(examId),
    })

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-surface-700 dark:text-surface-200">Subjects</h3>
                <button onClick={() => openModal('subject', null, { course: examId })} className="btn-primary text-sm py-2">
                    <Plus className="w-4 h-4" /> Add Subject
                </button>
            </div>
            {isLoading ? (
                <div className="py-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-primary-500" /></div>
            ) : subjects.length === 0 ? (
                <div className="card p-8 text-center text-sm text-surface-400 italic">No subjects yet. Add one to get started.</div>
            ) : (
                subjects.map((sb) => (
                    <div key={sb.id} className="card overflow-hidden">
                        <div
                            className="group flex items-center justify-between gap-2 p-4 cursor-pointer hover:bg-surface-50 dark:hover:bg-surface-800/40"
                            onClick={() => setExpanded(expanded === sb.id ? null : sb.id)}
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                {expanded === sb.id ? <ChevronDown className="w-5 h-5 text-surface-400 shrink-0" /> : <ChevronRight className="w-5 h-5 text-surface-400 shrink-0" />}
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: (sb.color || '#10B981') + '22' }}>
                                    <Book className="w-4 h-4" style={{ color: sb.color || '#10B981' }} />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-surface-900 dark:text-white truncate">{sb.name}</p>
                                    <p className="text-[11px] text-surface-500">{sb.weightage}% weightage • {sb.chapters_count ?? 0} chapters • {sb.topics_count ?? 0} topics</p>
                                </div>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <RowActions
                                    onEdit={() => openModal('subject', sb, { course: examId })}
                                    onDelete={() => askDelete('subject', sb, sb.name)}
                                />
                            </div>
                        </div>
                        <AnimatePresence>
                            {expanded === sb.id && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-surface-200 dark:border-surface-800 bg-surface-50/30 dark:bg-surface-900/20">
                                    <ChapterList subject={sb} openModal={openModal} askDelete={askDelete} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))
            )}
        </div>
    )
}

/* ===========================================================================
 * Root: ContentBuilder
 * ========================================================================= */
const SERVICE_MAP = {
    exam: { create: svc.createExam, update: svc.updateExam, remove: svc.deleteExam },
    subject: { create: svc.createSubject, update: svc.updateSubject, remove: svc.deleteSubject },
    chapter: { create: svc.createChapter, update: svc.updateChapter, remove: svc.deleteChapter },
    topic: { create: svc.createTopic, update: svc.updateTopic, remove: svc.deleteTopic },
    content: { create: svc.createContent, update: svc.updateContent, remove: svc.deleteContent },
    quiz: { create: svc.createQuiz, update: svc.updateQuiz, remove: svc.deleteQuiz },
    question: { create: svc.createQuestion, update: svc.updateQuestion, remove: svc.deleteQuestion },
}

const ContentBuilder = () => {
    const queryClient = useQueryClient()
    const [activeExam, setActiveExam] = useState(null)
    const [search, setSearch] = useState('')
    const [modal, setModal] = useState(null)   // { type, instance, context }
    const [confirm, setConfirm] = useState(null) // { type, instance, label }

    const { data: exams = [], isLoading } = useQuery({
        queryKey: ['cb-exams'],
        queryFn: svc.getExams,
    })

    // Auto-select first exam once data is available
    if (!activeExam && exams.length) setTimeout(() => setActiveExam(exams[0].id), 0)

    const invalidateAll = () => {
        ['cb-exams', 'cb-subjects', 'cb-chapters', 'cb-topics', 'cb-contents', 'cb-quizzes', 'cb-questions'].forEach((k) =>
            queryClient.invalidateQueries({ queryKey: [k] })
        )
    }

    const saveMutation = useMutation({
        mutationFn: ({ type, instance, payload }) =>
            instance ? SERVICE_MAP[type].update(instance.id, payload) : SERVICE_MAP[type].create(payload),
        onSuccess: (_d, vars) => {
            toast.success(`${SCHEMAS[vars.type].title} ${vars.instance ? 'updated' : 'created'}`)
            invalidateAll()
            setModal(null)
        },
        onError: (err) => {
            const data = err?.response?.data
            const msg = data && typeof data === 'object'
                ? Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ')
                : 'Something went wrong'
            toast.error(msg)
        },
    })

    const deleteMutation = useMutation({
        mutationFn: ({ type, instance }) => SERVICE_MAP[type].remove(instance.id),
        onSuccess: (_d, vars) => {
            toast.success(`${SCHEMAS[vars.type].title} deleted`)
            invalidateAll()
            setConfirm(null)
            if (vars.type === 'exam' && vars.instance.id === activeExam) setActiveExam(null)
        },
        onError: () => toast.error('Failed to delete'),
    })

    const openModal = (type, instance, context = {}) => setModal({ type, instance, context })
    const askDelete = (type, instance, label) => setConfirm({ type, instance, label })

    const handleSubmit = (payload) => {
        const merged = { ...(modal.context || {}), ...payload }
        saveMutation.mutate({ type: modal.type, instance: modal.instance, payload: merged })
    }

    const filteredExams = exams.filter((e) => e.name.toLowerCase().includes(search.toLowerCase()))
    const activeExamObj = exams.find((e) => e.id === activeExam)

    if (isLoading) {
        return <div className="py-16 flex justify-center"><Loader2 className="w-7 h-7 animate-spin text-primary-500" /></div>
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold text-surface-900 dark:text-white">Content Builder</h2>
                    <p className="text-sm text-surface-500">Create and manage courses, subjects, chapters, topics, content &amp; quizzes</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search courses…" className="input pl-9 py-2 w-full sm:w-48" />
                    </div>
                    <button onClick={() => openModal('exam', null, {})} className="btn-primary py-2 whitespace-nowrap">
                        <Plus className="w-4 h-4" /> New Course
                    </button>
                </div>
            </div>

            {exams.length === 0 ? (
                <div className="card p-12 text-center">
                    <GraduationCap className="w-10 h-10 mx-auto text-surface-300 mb-3" />
                    <p className="text-surface-500">No courses yet. Create your first course to start building content.</p>
                </div>
            ) : (
                <>
                    {/* Exam selector pills */}
                    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                        {filteredExams.map((ex) => (
                            <button
                                key={ex.id}
                                onClick={() => setActiveExam(ex.id)}
                                className={`group relative px-4 py-2.5 rounded-2xl text-sm font-semibold whitespace-nowrap border transition-all flex items-center gap-2 ${activeExam === ex.id ? 'bg-primary-500 text-white border-primary-500 shadow-lg shadow-primary-500/25' : 'bg-white dark:bg-surface-900 text-surface-600 dark:text-surface-300 border-surface-200 dark:border-surface-800 hover:border-primary-300'}`}
                            >
                                <span className="w-2 h-2 rounded-full" style={{ background: ex.color || '#3B82F6' }} />
                                {ex.name}
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeExam === ex.id ? 'bg-white/20' : 'bg-surface-100 dark:bg-surface-800'}`}>{ex.subjects_count ?? 0}</span>
                            </button>
                        ))}
                    </div>

                    {activeExamObj && (
                        <div className="space-y-4">
                            {/* Exam meta + actions */}
                            <div className="card p-4 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: (activeExamObj.color || '#3B82F6') + '22' }}>
                                        <GraduationCap className="w-5 h-5" style={{ color: activeExamObj.color || '#3B82F6' }} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-surface-900 dark:text-white truncate">{activeExamObj.name}</p>
                                        <p className="text-[11px] text-surface-500 capitalize">{activeExamObj.course_type} • {activeExamObj.status?.replace('_', ' ')}</p>
                                    </div>
                                </div>
                                <RowActions
                                    onEdit={() => openModal('exam', activeExamObj, {})}
                                    onDelete={() => askDelete('exam', activeExamObj, activeExamObj.name)}
                                />
                            </div>

                            <SubjectList examId={activeExam} openModal={openModal} askDelete={askDelete} />
                        </div>
                    )}
                </>
            )}

            <AnimatePresence>
                {modal && (
                    <EntityModal
                        type={modal.type}
                        instance={modal.instance}
                        saving={saveMutation.isPending}
                        onClose={() => setModal(null)}
                        onSubmit={handleSubmit}
                    />
                )}
                {confirm && (
                    <ConfirmDialog
                        label={confirm.label}
                        deleting={deleteMutation.isPending}
                        onCancel={() => setConfirm(null)}
                        onConfirm={() => deleteMutation.mutate({ type: confirm.type, instance: confirm.instance })}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}

export default ContentBuilder
