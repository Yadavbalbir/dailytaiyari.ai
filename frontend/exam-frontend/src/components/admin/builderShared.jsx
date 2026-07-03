import { useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
    Plus, Pencil, Trash2, X, Loader2, Save, AlertTriangle,
    CheckCircle2, Circle,
} from 'lucide-react'

/* ===========================================================================
 * Shared field / form configuration and modals used by the admin content
 * tools (ContentBuilder table view and the focused CourseManager).
 * Single source of truth so both stay in sync.
 * ========================================================================= */
export const EXAM_TYPES = ['competitive', 'board', 'entrance', 'government']
export const EXAM_STATUS = ['active', 'coming_soon', 'inactive']
export const DIFFICULTY = ['easy', 'medium', 'hard']
export const IMPORTANCE = ['low', 'medium', 'high', 'critical']
export const CONTENT_TYPES = ['notes', 'video', 'pdf', 'interactive', 'revision', 'formula']
export const CONTENT_DIFFICULTY = ['beginner', 'intermediate', 'advanced']
export const CONTENT_STATUS = ['draft', 'published', 'archived']
export const QUIZ_TYPES = ['topic', 'subject', 'chapter', 'daily', 'custom', 'pyq']
export const QUIZ_STATUS = ['draft', 'published', 'archived']
export const QUESTION_TYPES = ['mcq', 'true_false', 'numerical', 'fill_blank']
export const QUESTION_STATUS = ['draft', 'review', 'published', 'archived']
export const QTYPE_LABEL = {
    mcq: 'Multiple Choice', true_false: 'True / False',
    numerical: 'Numerical', fill_blank: 'Fill in the Blank',
}

export const opt = (arr) => arr.map((v) => ({ value: v, label: v.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) }))

export const SCHEMAS = {
    exam: {
        title: 'Course',
        fields: [
            { name: 'name', label: 'Name', type: 'text', required: true },
            { name: 'code', label: 'Code', type: 'text', required: true, hint: 'Unique slug, e.g. neet' },
            { name: 'course_type', label: 'Type', type: 'select', options: opt(EXAM_TYPES), default: 'competitive' },
            { name: 'status', label: 'Status', type: 'select', options: opt(EXAM_STATUS), default: 'active' },
            { name: 'color', label: 'Color', type: 'color', default: '#3B82F6' },
            { name: 'duration_minutes', label: 'Duration (min)', type: 'number' },
            { name: 'total_marks', label: 'Total Marks', type: 'number' },
            { name: 'is_featured', label: 'Featured', type: 'checkbox' },
            { name: 'negative_marking', label: 'Negative Marking', type: 'checkbox' },
            { name: 'description', label: 'Description', type: 'textarea', full: true },
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
        title: 'Question',
        fields: [],
    },
}

/** Format a DRF error payload into a human-readable toast string. */
export const formatApiError = (err, fallback = 'Something went wrong') => {
    const data = err?.response?.data
    if (data && typeof data === 'object') {
        return Object.entries(data)
            .map(([k, val]) => `${k}: ${Array.isArray(val) ? val.join(', ') : val}`)
            .join(' | ')
    }
    return data?.detail || fallback
}

export const buildInitial = (fields, instance) => {
    const out = {}
    fields.forEach((f) => {
        let v = instance ? instance[f.name] : undefined
        if (v === undefined || v === null) v = f.default ?? (f.type === 'checkbox' ? false : '')
        out[f.name] = v
    })
    return out
}

/* ===========================================================================
 * Generic entity modal (course/subject/chapter/topic/content/quiz)
 * ========================================================================= */
export const EntityModal = ({ type, instance, onClose, onSubmit, saving }) => {
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
                            <div key={f.name} className={f.full || f.type === 'textarea' ? 'sm:col-span-2' : ''}>
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
                                            <textarea
                                                className="input font-mono text-sm" rows={f.rows || 3}
                                                value={values[f.name] ?? ''}
                                                onChange={(e) => set(f.name, e.target.value)}
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
export const ConfirmDialog = ({ label, onCancel, onConfirm, deleting }) => (
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
 * Small row action buttons
 * ========================================================================= */
export const RowActions = ({ onEdit, onDelete, onAdd, addLabel }) => (
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
 * Question editor modal (dynamic by question type)
 * ========================================================================= */
export const QuestionModal = ({ instance, onClose, onSubmit, saving }) => {
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
