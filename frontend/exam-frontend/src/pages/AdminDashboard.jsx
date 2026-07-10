import { useState, useMemo, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { analyticsService } from '../services/analyticsService'
import { tenantAdminService } from '../services/tenantAdminService'
import { courseService } from '../services/courseService'
import { useTenantStore } from '../context/tenantStore'
import ContentBuilder from '../components/admin/ContentBuilder'
import {
    Users,
    GraduationCap,
    Zap,
    BarChart3,
    TrendingUp,
    CheckCircle2,
    Search,
    Shield,
    ShieldOff,
    RotateCcw,
    UserCog,
    Award,
    X,
    MapPin,
    School,
    BookOpen,
    ExternalLink,
    Library,
    ChevronDown,
    Book,
    Layers,
    Clock,
    XCircle,
    Check,
    Pencil,
    Save,
    Loader2,
    Download,
    SlidersHorizontal,
    RefreshCw,
    Mail,
    Phone,
    Filter,
    ClipboardList,
    Upload,
    Image as ImageIcon,
    ToggleRight,
    SlidersHorizontal as SlidersIcon,
} from 'lucide-react'

/* ---------------------------------------------------------------------------
 * Choice constants — kept in sync with backend users/models.py
 * ------------------------------------------------------------------------- */
const GRADE_OPTIONS = [
    { value: '', label: '—' },
    { value: '6', label: 'Class 6' },
    { value: '7', label: 'Class 7' },
    { value: '8', label: 'Class 8' },
    { value: '9', label: 'Class 9' },
    { value: '10', label: 'Class 10' },
    { value: '11', label: 'Class 11' },
    { value: '12', label: 'Class 12' },
    { value: 'graduate', label: 'Graduate' },
    { value: 'other', label: 'Other' },
]

const BOARD_OPTIONS = [
    { value: '', label: '—' },
    { value: 'cbse', label: 'CBSE' },
    { value: 'icse', label: 'ICSE' },
    { value: 'state', label: 'State Board' },
    { value: 'ib', label: 'IB' },
    { value: 'igcse', label: 'IGCSE' },
    { value: 'other', label: 'Other' },
]

const MEDIUM_OPTIONS = [
    { value: 'english', label: 'English' },
    { value: 'hindi', label: 'Hindi' },
    { value: 'bilingual', label: 'Bilingual' },
    { value: 'other', label: 'Other' },
]

const STUDY_TIME_OPTIONS = [
    { value: 'morning', label: 'Morning (6AM-12PM)' },
    { value: 'afternoon', label: 'Afternoon (12PM-6PM)' },
    { value: 'evening', label: 'Evening (6PM-10PM)' },
    { value: 'night', label: 'Night (10PM-6AM)' },
]

const ROLE_OPTIONS = [
    { value: 'student', label: 'Student' },
    { value: 'instructor', label: 'Instructor' },
    { value: 'admin', label: 'Admin' },
]

const roleBadgeClass = (role) =>
    role === 'admin'
        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
        : role === 'instructor'
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
            : 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-300'

/* ---------------------------------------------------------------------------
 * StatCard
 * ------------------------------------------------------------------------- */
const StatCard = ({ title, value, icon: Icon, color, description }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-5 sm:p-6"
    >
        <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
                <p className="text-sm font-medium text-surface-500 mb-1 truncate">{title}</p>
                <h3 className="text-2xl sm:text-3xl font-bold text-surface-900 dark:text-white">{value}</h3>
                {description && <p className="mt-2 text-xs sm:text-sm text-surface-500">{description}</p>}
            </div>
            <div className={`p-3 rounded-xl shrink-0 ${color}`}>
                <Icon className="w-6 h-6 text-white" />
            </div>
        </div>
    </motion.div>
)

/* ---------------------------------------------------------------------------
 * Reusable form field helpers (used by the edit modal)
 * ------------------------------------------------------------------------- */
const Field = ({ label, children, hint }) => (
    <div className="space-y-1.5">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-surface-400">{label}</label>
        {children}
        {hint && <p className="text-[10px] text-surface-400">{hint}</p>}
    </div>
)

const TextInput = (props) => <input {...props} className={`input ${props.className || ''}`} />
const SelectInput = ({ options, ...props }) => (
    <select {...props} className={`input ${props.className || ''}`}>
        {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
        ))}
    </select>
)

/* ---------------------------------------------------------------------------
 * StudentEditModal — edit ANY metadata of a student
 * ------------------------------------------------------------------------- */
const StudentEditModal = ({ student, exams, onClose }) => {
    const queryClient = useQueryClient()

    const [form, setForm] = useState(() => ({
        // user
        first_name: student.user.first_name || '',
        last_name: student.user.last_name || '',
        phone: student.user.phone || '',
        role: student.user.role || 'student',
        // profile — personal
        date_of_birth: student.date_of_birth || '',
        bio: student.bio || '',
        instagram_handle: student.instagram_handle || '',
        parent_phone: student.parent_phone || '',
        // profile — academic
        grade: student.grade || '',
        school: student.school || '',
        coaching: student.coaching || '',
        board: student.board || '',
        medium: student.medium || 'english',
        target_year: student.target_year || '',
        primary_course: student.primary_course || '',
        // profile — location & prefs
        city: student.city || '',
        state: student.state || '',
        daily_study_goal_minutes: student.daily_study_goal_minutes ?? 60,
        preferred_study_time: student.preferred_study_time || 'evening',
    }))

    const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

    const mutation = useMutation({
        mutationFn: (payload) => tenantAdminService.updateStudent(student.id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tenantStudents'] })
            toast.success('Student record updated')
            onClose()
        },
        onError: (err) => {
            const data = err?.response?.data
            const msg = typeof data === 'string'
                ? data
                : data
                    ? Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' • ')
                    : 'Failed to update record'
            toast.error(msg)
        },
    })

    const handleSubmit = (e) => {
        e.preventDefault()
        const payload = {
            user: {
                first_name: form.first_name.trim(),
                last_name: form.last_name.trim(),
                phone: form.phone.trim(),
                role: form.role,
            },
            date_of_birth: form.date_of_birth || null,
            bio: form.bio,
            instagram_handle: form.instagram_handle.replace('@', ''),
            parent_phone: form.parent_phone,
            grade: form.grade,
            school: form.school,
            coaching: form.coaching,
            board: form.board,
            medium: form.medium,
            target_year: form.target_year === '' ? null : Number(form.target_year),
            primary_course: form.primary_course || null,
            city: form.city,
            state: form.state,
            daily_study_goal_minutes: Number(form.daily_study_goal_minutes) || 0,
            preferred_study_time: form.preferred_study_time,
        }
        mutation.mutate(payload)
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-surface-900/60 backdrop-blur-sm">
            <motion.form
                onSubmit={handleSubmit}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-white dark:bg-surface-800 rounded-3xl w-full max-w-4xl max-h-[92vh] overflow-hidden shadow-2xl border border-surface-100 dark:border-surface-700 flex flex-col"
            >
                {/* Header */}
                <div className="p-5 sm:p-6 border-b dark:border-surface-700 flex items-center justify-between bg-surface-50/50 dark:bg-surface-900/20">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 text-lg font-black shrink-0">
                            {student.user.full_name.charAt(0) || '?'}
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-lg font-bold text-surface-900 dark:text-white truncate">Edit Student Record</h2>
                            <p className="text-xs text-surface-500 truncate">{student.user.email}</p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-xl transition-colors shrink-0">
                        <X className="w-5 h-5 text-surface-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-8">
                    {/* Personal */}
                    <section className="space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-widest text-primary-600 dark:text-primary-400 flex items-center gap-2">
                            <Users className="w-4 h-4" /> Personal Information
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="First Name"><TextInput value={form.first_name} onChange={set('first_name')} placeholder="First name" /></Field>
                            <Field label="Last Name"><TextInput value={form.last_name} onChange={set('last_name')} placeholder="Last name" /></Field>
                            <Field label="Email (read-only)"><TextInput value={student.user.email} disabled className="opacity-60 cursor-not-allowed" /></Field>
                            <Field label="Phone"><TextInput value={form.phone} onChange={set('phone')} placeholder="Phone number" /></Field>
                            <Field label="Date of Birth"><TextInput type="date" value={form.date_of_birth || ''} onChange={set('date_of_birth')} /></Field>
                            <Field label="Parent Contact"><TextInput value={form.parent_phone} onChange={set('parent_phone')} placeholder="Parent phone" /></Field>
                            <Field label="Instagram Handle"><TextInput value={form.instagram_handle} onChange={set('instagram_handle')} placeholder="username" /></Field>
                            <Field label="Role" hint="Controls platform permissions">
                                <SelectInput options={ROLE_OPTIONS} value={form.role} onChange={set('role')} />
                            </Field>
                            <div className="sm:col-span-2">
                                <Field label="Bio">
                                    <textarea
                                        value={form.bio}
                                        onChange={set('bio')}
                                        rows={3}
                                        maxLength={500}
                                        placeholder="Short bio…"
                                        className="input resize-none"
                                    />
                                </Field>
                            </div>
                        </div>
                    </section>

                    {/* Academic */}
                    <section className="space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-widest text-primary-600 dark:text-primary-400 flex items-center gap-2">
                            <School className="w-4 h-4" /> Academic Details
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="Primary Course">
                                <SelectInput
                                    options={[{ value: '', label: '—' }, ...exams.map((ex) => ({ value: ex.id, label: ex.name }))]}
                                    value={form.primary_course}
                                    onChange={set('primary_course')}
                                />
                            </Field>
                            <Field label="Target Year"><TextInput type="number" value={form.target_year} onChange={set('target_year')} placeholder="e.g. 2026" /></Field>
                            <Field label="Grade / Class"><SelectInput options={GRADE_OPTIONS} value={form.grade} onChange={set('grade')} /></Field>
                            <Field label="Board / University"><SelectInput options={BOARD_OPTIONS} value={form.board} onChange={set('board')} /></Field>
                            <Field label="School / Institute"><TextInput value={form.school} onChange={set('school')} placeholder="School name" /></Field>
                            <Field label="Coaching Center"><TextInput value={form.coaching} onChange={set('coaching')} placeholder="Coaching name" /></Field>
                            <Field label="Study Medium"><SelectInput options={MEDIUM_OPTIONS} value={form.medium} onChange={set('medium')} /></Field>
                        </div>
                    </section>

                    {/* Location & Preferences */}
                    <section className="space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-widest text-primary-600 dark:text-primary-400 flex items-center gap-2">
                            <MapPin className="w-4 h-4" /> Location & Preferences
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="City"><TextInput value={form.city} onChange={set('city')} placeholder="City" /></Field>
                            <Field label="State"><TextInput value={form.state} onChange={set('state')} placeholder="State" /></Field>
                            <Field label="Daily Study Goal (minutes)"><TextInput type="number" min="0" value={form.daily_study_goal_minutes} onChange={set('daily_study_goal_minutes')} /></Field>
                            <Field label="Preferred Study Time"><SelectInput options={STUDY_TIME_OPTIONS} value={form.preferred_study_time} onChange={set('preferred_study_time')} /></Field>
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <div className="p-4 sm:p-5 bg-surface-50 dark:bg-surface-900/20 border-t dark:border-surface-700 flex items-center justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl font-bold text-sm text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors">
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={mutation.isPending}
                        className="px-6 py-2.5 bg-primary-600 text-white rounded-xl font-bold text-sm hover:bg-primary-700 transition-colors flex items-center gap-2 disabled:opacity-60"
                    >
                        {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Changes
                    </button>
                </div>
            </motion.form>
        </div>
    )
}

/* ---------------------------------------------------------------------------
 * StudentDetailModal — read-only full profile
 * ------------------------------------------------------------------------- */
const StudentDetailModal = ({ student, onClose, onEdit }) => {
    if (!student) return null

    const sections = [
        {
            title: 'Personal Information',
            icon: Users,
            fields: [
                { label: 'Full Name', value: student.user.full_name },
                { label: 'Email', value: student.user.email },
                { label: 'Phone', value: student.user.phone || 'Not provided' },
                { label: 'Date of Birth', value: student.date_of_birth || 'Not provided' },
                { label: 'Bio', value: student.bio || 'No bio available', fullWidth: true },
            ],
        },
        {
            title: 'Academic Details',
            icon: School,
            fields: [
                { label: 'Primary Course', value: student.primary_course_name || 'Not set' },
                { label: 'Target Year', value: student.target_year || 'Not set' },
                { label: 'Grade/Level', value: student.grade || 'Not provided' },
                { label: 'School/Institute', value: student.school || 'Not provided' },
                { label: 'Coaching Center', value: student.coaching || 'Not provided' },
                { label: 'Board/University', value: student.board || 'Not provided' },
                { label: 'Study Medium', value: student.medium || 'Not provided' },
            ],
        },
        {
            title: 'Location & Preferences',
            icon: MapPin,
            fields: [
                { label: 'City', value: student.city || 'Not provided' },
                { label: 'State', value: student.state || 'Not provided' },
                { label: 'Daily Study Goal', value: `${student.daily_study_goal_minutes} minutes` },
                { label: 'Preferred Study Time', value: student.preferred_study_time, className: 'capitalize' },
                { label: 'Instagram', value: student.instagram_handle ? `@${student.instagram_handle}` : 'Not provided' },
                { label: 'Parent Contact', value: student.parent_phone || 'Not provided' },
            ],
        },
        {
            title: 'Performance Statistics',
            icon: BarChart3,
            fields: [
                { label: 'Current Level', value: `Level ${student.current_level}`, className: 'font-bold text-primary-600' },
                { label: 'Total XP', value: student.total_xp.toLocaleString() },
                { label: 'Overall Accuracy', value: `${student.overall_accuracy}%` },
                { label: 'Questions Attempted', value: student.total_questions_attempted },
                { label: 'Correct Answers', value: student.total_correct_answers },
                { label: 'Total Study Time', value: `${student.total_study_time_minutes} minutes` },
            ],
        },
    ]

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-surface-900/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-white dark:bg-surface-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl border border-surface-100 dark:border-surface-700 flex flex-col"
            >
                <div className="p-5 sm:p-6 border-b dark:border-surface-700 flex items-center justify-between bg-surface-50/50 dark:bg-surface-900/20">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 text-lg font-black shrink-0">
                            {student.user.full_name.charAt(0) || '?'}
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-lg sm:text-xl font-bold text-surface-900 dark:text-white truncate">{student.user.full_name}</h2>
                            <p className="text-xs sm:text-sm text-surface-500 truncate">{student.user.email}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-xl transition-colors shrink-0">
                        <X className="w-5 h-5 text-surface-500" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-8 sm:space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10">
                        {sections.map((section, idx) => (
                            <div key={idx} className="space-y-4">
                                <h3 className="text-xs font-black uppercase tracking-widest text-primary-600 dark:text-primary-400 flex items-center gap-2">
                                    <section.icon className="w-4 h-4" />
                                    {section.title}
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {section.fields.map((field, fIdx) => (
                                        <div key={fIdx} className={`${field.fullWidth ? 'col-span-2' : ''} space-y-1`}>
                                            <p className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">{field.label}</p>
                                            <p className={`text-sm text-surface-700 dark:text-surface-200 break-words ${field.className || ''}`}>{field.value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-4 sm:p-5 bg-surface-50 dark:bg-surface-900/20 border-t dark:border-surface-700 flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-bold text-sm text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors">
                        Close
                    </button>
                    <button onClick={() => onEdit(student)} className="px-6 py-2.5 bg-primary-600 text-white rounded-xl font-bold text-sm hover:bg-primary-700 transition-colors flex items-center gap-2">
                        <Pencil className="w-4 h-4" /> Edit Record
                    </button>
                </div>
            </motion.div>
        </div>
    )
}

/* ---------------------------------------------------------------------------
 * Row action buttons shared between desktop table & mobile cards
 * ------------------------------------------------------------------------- */
const RowActions = ({ student, onView, onEdit, onReset }) => (
    <div className="flex items-center gap-1">
        <button onClick={() => onEdit(student)} className="p-2 text-surface-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all" title="Edit record">
            <Pencil className="w-4 h-4" />
        </button>
        <button onClick={() => onView(student)} className="p-2 text-surface-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all" title="View full profile">
            <ExternalLink className="w-4 h-4" />
        </button>
        <button onClick={() => onReset(student)} className="p-2 text-surface-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all" title="Reset progress">
            <RotateCcw className="w-4 h-4" />
        </button>
    </div>
)

/* ---------------------------------------------------------------------------
 * StudentManagement — search, filters, export, edit
 * ------------------------------------------------------------------------- */
const StudentManagement = () => {
    const queryClient = useQueryClient()
    const [searchTerm, setSearchTerm] = useState('')
    const [filterRole, setFilterRole] = useState('all')
    const [filterStatus, setFilterStatus] = useState('all')
    const [filterExam, setFilterExam] = useState('all')
    const [sortBy, setSortBy] = useState('name')
    const [selectedStudent, setSelectedStudent] = useState(null)
    const [editingStudent, setEditingStudent] = useState(null)

    const { data: students, isLoading } = useQuery({
        queryKey: ['tenantStudents'],
        queryFn: () => tenantAdminService.getStudents(),
    })

    const { data: examsData } = useQuery({
        queryKey: ['adminExamOptions'],
        queryFn: () => courseService.getAvailableCoursesForEnrollment(),
    })
    const exams = Array.isArray(examsData) ? examsData : (examsData?.results || examsData?.courses || [])

    const resetMutation = useMutation({
        mutationFn: (id) => tenantAdminService.resetStudentProgress(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tenantStudents'] })
            toast.success('Student progress reset')
        },
        onError: () => toast.error('Failed to reset progress'),
    })

    const statusMutation = useMutation({
        mutationFn: (id) => tenantAdminService.toggleStudentStatus(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tenantStudents'] })
            toast.success('Account status updated')
        },
        onError: (err) => toast.error(err?.response?.data?.error || 'Failed to update status'),
    })

    const studentList = Array.isArray(students) ? students : (students?.results || [])

    const filteredStudents = useMemo(() => {
        const term = searchTerm.trim().toLowerCase()
        const result = studentList.filter((s) => {
            const matchesSearch =
                !term ||
                s.user.full_name.toLowerCase().includes(term) ||
                s.user.email.toLowerCase().includes(term) ||
                (s.user.phone || '').toLowerCase().includes(term)
            const matchesRole = filterRole === 'all' || s.user.role === filterRole
            const matchesStatus =
                filterStatus === 'all' ||
                (filterStatus === 'active' && !s.user.is_suspended) ||
                (filterStatus === 'suspended' && s.user.is_suspended)
            const matchesExam = filterExam === 'all' || String(s.primary_course) === String(filterExam)
            return matchesSearch && matchesRole && matchesStatus && matchesExam
        })

        const sorted = [...result].sort((a, b) => {
            switch (sortBy) {
                case 'xp':
                    return (b.total_xp || 0) - (a.total_xp || 0)
                case 'accuracy':
                    return (b.overall_accuracy || 0) - (a.overall_accuracy || 0)
                case 'level':
                    return (b.current_level || 0) - (a.current_level || 0)
                case 'email':
                    return a.user.email.localeCompare(b.user.email)
                default:
                    return a.user.full_name.localeCompare(b.user.full_name)
            }
        })
        return sorted
    }, [studentList, searchTerm, filterRole, filterStatus, filterExam, sortBy])

    const handleReset = (student) => {
        if (window.confirm(`Reset ALL progress for ${student.user.full_name}? This cannot be undone.`)) {
            resetMutation.mutate(student.id)
        }
    }

    const exportCsv = () => {
        if (filteredStudents.length === 0) {
            toast.error('No records to export')
            return
        }
        const headers = [
            'Full Name', 'Email', 'Phone', 'Role', 'Status', 'Primary Course', 'Target Year',
            'Grade', 'School', 'Coaching', 'Board', 'Medium', 'City', 'State',
            'Level', 'Total XP', 'Accuracy %', 'Questions Attempted', 'Correct Answers', 'Study Minutes',
        ]
        const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
        const rows = filteredStudents.map((s) => [
            s.user.full_name, s.user.email, s.user.phone, s.user.role,
            s.user.is_suspended ? 'Suspended' : 'Active',
            s.primary_course_name, s.target_year, s.grade, s.school, s.coaching, s.board, s.medium,
            s.city, s.state, s.current_level, s.total_xp, s.overall_accuracy,
            s.total_questions_attempted, s.total_correct_answers, s.total_study_time_minutes,
        ].map(escape).join(','))
        const csv = [headers.map(escape).join(','), ...rows].join('\n')
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `student-records-${new Date().toISOString().slice(0, 10)}.csv`
        link.click()
        URL.revokeObjectURL(url)
        toast.success(`Exported ${filteredStudents.length} records`)
    }

    const resetFilters = () => {
        setSearchTerm(''); setFilterRole('all'); setFilterStatus('all'); setFilterExam('all'); setSortBy('name')
    }

    const hasActiveFilters = searchTerm || filterRole !== 'all' || filterStatus !== 'all' || filterExam !== 'all' || sortBy !== 'name'

    if (isLoading) return <div className="py-12 text-center text-surface-500">Loading students…</div>

    return (
        <div className="space-y-5">
            {/* Toolbar */}
            <div className="card p-4 sm:p-5 space-y-4">
                <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                        <input
                            type="text"
                            placeholder="Search by name, email or phone…"
                            className="input pl-10 w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600">
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    <button onClick={exportCsv} className="btn-secondary justify-center whitespace-nowrap">
                        <Download className="w-4 h-4" /> Export CSV
                    </button>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-surface-400 flex items-center gap-1"><UserCog className="w-3 h-3" /> Role</label>
                        <select className="input py-2.5" value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
                            <option value="all">All Roles</option>
                            <option value="student">Student</option>
                            <option value="instructor">Instructor</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-surface-400 flex items-center gap-1"><Shield className="w-3 h-3" /> Status</label>
                        <select className="input py-2.5" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="suspended">Suspended</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-surface-400 flex items-center gap-1"><BookOpen className="w-3 h-3" /> Course</label>
                        <select className="input py-2.5" value={filterExam} onChange={(e) => setFilterExam(e.target.value)}>
                            <option value="all">All Courses</option>
                            {exams.map((ex) => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-surface-400 flex items-center gap-1"><SlidersHorizontal className="w-3 h-3" /> Sort By</label>
                        <select className="input py-2.5" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                            <option value="name">Name (A-Z)</option>
                            <option value="email">Email (A-Z)</option>
                            <option value="xp">XP (High-Low)</option>
                            <option value="accuracy">Accuracy (High-Low)</option>
                            <option value="level">Level (High-Low)</option>
                        </select>
                    </div>
                </div>

                <div className="flex items-center justify-between text-xs text-surface-500">
                    <span className="flex items-center gap-1.5">
                        <Filter className="w-3.5 h-3.5" />
                        Showing <span className="font-bold text-surface-700 dark:text-surface-200">{filteredStudents.length}</span> of {studentList.length} students
                    </span>
                    {hasActiveFilters && (
                        <button onClick={resetFilters} className="font-semibold text-primary-600 hover:underline">Clear filters</button>
                    )}
                </div>
            </div>

            {/* Desktop table */}
            <div className="card overflow-hidden hidden md:block">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-surface-50 dark:bg-surface-800/50 text-xs font-semibold text-surface-500 uppercase">
                            <tr>
                                <th className="px-6 py-4">Student</th>
                                <th className="px-6 py-4">Course</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Performance</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                            {filteredStudents.map((student) => (
                                <tr key={student.id} className="hover:bg-surface-50/50 dark:hover:bg-surface-800/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 font-bold shrink-0">
                                                {student.user.full_name.charAt(0) || '?'}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-medium text-surface-900 dark:text-white truncate">{student.user.full_name}</div>
                                                <div className="text-xs text-surface-500 truncate">{student.user.email}</div>
                                                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${roleBadgeClass(student.user.role)}`}>
                                                    {student.user.role}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-surface-600 dark:text-surface-300">
                                        {student.primary_course_name || <span className="text-surface-400">—</span>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => statusMutation.mutate(student.id)}
                                            className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border transition-all ${!student.user.is_suspended
                                                ? 'bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400'
                                                : 'bg-rose-50 border-rose-100 text-rose-700 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400 hover:bg-rose-100'}`}
                                        >
                                            {!student.user.is_suspended ? <><Shield className="w-3.5 h-3.5" /> Active</> : <><ShieldOff className="w-3.5 h-3.5" /> Suspended</>}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-xs space-y-1 whitespace-nowrap">
                                        <div className="flex justify-between gap-4"><span className="text-surface-500">Lvl</span><span className="font-semibold text-surface-900 dark:text-white">{student.current_level}</span></div>
                                        <div className="flex justify-between gap-4"><span className="text-surface-500">XP</span><span className="font-semibold text-surface-900 dark:text-white">{student.total_xp}</span></div>
                                        <div className="flex justify-between gap-4"><span className="text-surface-500">Acc</span><span className="font-semibold text-surface-900 dark:text-white">{student.overall_accuracy}%</span></div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-end">
                                            <RowActions student={student} onView={setSelectedStudent} onEdit={setEditingStudent} onReset={handleReset} />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredStudents.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-surface-500 italic">No students match your filters.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
                {filteredStudents.map((student) => (
                    <div key={student.id} className="card p-4 space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="w-11 h-11 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 font-bold shrink-0">
                                {student.user.full_name.charAt(0) || '?'}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="font-semibold text-surface-900 dark:text-white truncate">{student.user.full_name}</div>
                                <div className="text-xs text-surface-500 flex items-center gap-1 truncate"><Mail className="w-3 h-3 shrink-0" /> {student.user.email}</div>
                                {student.user.phone && <div className="text-xs text-surface-500 flex items-center gap-1"><Phone className="w-3 h-3" /> {student.user.phone}</div>}
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold shrink-0 ${roleBadgeClass(student.user.role)}`}>{student.user.role}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center text-xs bg-surface-50 dark:bg-surface-800/50 rounded-xl p-2.5">
                            <div><div className="font-bold text-surface-900 dark:text-white">{student.current_level}</div><div className="text-surface-400">Level</div></div>
                            <div><div className="font-bold text-surface-900 dark:text-white">{student.total_xp}</div><div className="text-surface-400">XP</div></div>
                            <div><div className="font-bold text-surface-900 dark:text-white">{student.overall_accuracy}%</div><div className="text-surface-400">Accuracy</div></div>
                        </div>
                        <div className="flex items-center justify-between">
                            <button
                                onClick={() => statusMutation.mutate(student.id)}
                                className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border ${!student.user.is_suspended
                                    ? 'bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400'
                                    : 'bg-rose-50 border-rose-100 text-rose-700 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400'}`}
                            >
                                {!student.user.is_suspended ? <><Shield className="w-3.5 h-3.5" /> Active</> : <><ShieldOff className="w-3.5 h-3.5" /> Suspended</>}
                            </button>
                            <RowActions student={student} onView={setSelectedStudent} onEdit={setEditingStudent} onReset={handleReset} />
                        </div>
                    </div>
                ))}
                {filteredStudents.length === 0 && (
                    <div className="card p-10 text-center text-surface-500 italic">No students match your filters.</div>
                )}
            </div>

            <AnimatePresence>
                {selectedStudent && (
                    <StudentDetailModal
                        student={selectedStudent}
                        onClose={() => setSelectedStudent(null)}
                        onEdit={(s) => { setSelectedStudent(null); setEditingStudent(s) }}
                    />
                )}
                {editingStudent && (
                    <StudentEditModal
                        student={editingStudent}
                        exams={exams}
                        onClose={() => setEditingStudent(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}

/* ---------------------------------------------------------------------------
 * PerformanceReports
 * ------------------------------------------------------------------------- */
const PerformanceReports = () => {
    const { data: subjectStats, isLoading: loadingStats } = useQuery({
        queryKey: ['tenantSubjectStats'],
        queryFn: () => analyticsService.getTenantSubjectStats(),
    })

    const { data: leaderboard, isLoading: loadingLeaderboard } = useQuery({
        queryKey: ['tenantLeaderboard'],
        queryFn: () => analyticsService.getTenantLeaderboard(5),
    })

    if (loadingStats || loadingLeaderboard) return <div className="py-12 text-center text-surface-500">Generating reports…</div>

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            <div className="lg:col-span-2 space-y-6">
                <div className="card p-5 sm:p-6">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-primary-500" /> Subject-wise Accuracy
                    </h3>
                    <div className="space-y-6">
                        {subjectStats?.map((item) => (
                            <div key={item.subject} className="group">
                                <div className="flex justify-between items-end mb-2">
                                    <div>
                                        <span className="text-sm font-semibold text-surface-700 dark:text-surface-300 group-hover:text-primary-500 transition-colors">{item.subject}</span>
                                        <span className="text-[10px] text-surface-500 ml-2">({item.student_count} students)</span>
                                    </div>
                                    <span className="text-sm font-bold text-primary-600 dark:text-primary-400">{item.accuracy}%</span>
                                </div>
                                <div className="h-3 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${item.accuracy}%` }} className="h-full bg-gradient-to-r from-primary-500 to-primary-400" />
                                </div>
                                <div className="mt-1 flex justify-between text-[10px] text-surface-400">
                                    <span>Avg. Study Time: {item.avg_study_minutes}m</span>
                                </div>
                            </div>
                        ))}
                        {(!subjectStats || subjectStats.length === 0) && (
                            <div className="text-center py-12 text-surface-500 italic font-medium">No subject data available yet.</div>
                        )}
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="card p-5 sm:p-6 bg-gradient-to-br from-surface-50 to-white dark:from-surface-900 dark:to-surface-800 border-primary-500/10">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <Award className="w-5 h-5 text-amber-500" /> Institutional Top 5
                    </h3>
                    <div className="space-y-4">
                        {leaderboard?.map((student, index) => (
                            <div key={student.id} className="flex items-center gap-4 p-3 rounded-xl bg-white dark:bg-surface-800/50 shadow-sm border border-surface-100 dark:border-surface-700">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-amber-100 text-amber-600' : index === 1 ? 'bg-slate-100 text-slate-600' : index === 2 ? 'bg-orange-100 text-orange-600' : 'bg-surface-100 text-surface-500'}`}>
                                    {index + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-sm truncate dark:text-white">{student.name}</div>
                                    <div className="text-[10px] text-surface-500">Level {student.level} • {student.accuracy}% Accuracy</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs font-black text-primary-600 dark:text-primary-400">{student.xp.toLocaleString()}</div>
                                    <div className="text-[8px] uppercase tracking-wider text-surface-400 font-bold">XP</div>
                                </div>
                            </div>
                        ))}
                        {(!leaderboard || leaderboard.length === 0) && (
                            <p className="text-center text-surface-500 py-8 italic text-sm">No leaderboard data yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

/* ---------------------------------------------------------------------------
 * ContentManagement
 * ------------------------------------------------------------------------- */
const ContentManagement = () => {
    const { data: explorer, isLoading } = useQuery({
        queryKey: ['contentExplorer'],
        queryFn: () => analyticsService.getContentExplorer(),
    })

    const [expandedExam, setExpandedExam] = useState(null)
    const [expandedSubject, setExpandedSubject] = useState(null)

    if (isLoading) return <div className="py-12 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div></div>

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold text-surface-900 dark:text-white">Institutional Content Library</h2>
                <p className="text-sm text-surface-500">Explore courses, subjects, and chapters available to your students</p>
            </div>

            <div className="space-y-4">
                {explorer?.map((exam) => (
                    <div key={exam.id} className="bg-white dark:bg-surface-800 rounded-3xl border border-surface-100 dark:border-surface-700 overflow-hidden shadow-sm">
                        <button onClick={() => setExpandedExam(expandedExam === exam.id ? null : exam.id)} className="w-full p-5 sm:p-6 flex items-center justify-between hover:bg-surface-50/50 dark:hover:bg-surface-900/10 transition-colors">
                            <div className="flex items-center gap-4 min-w-0">
                                <div className="w-12 h-12 rounded-2xl bg-surface-100 dark:bg-surface-900/30 flex items-center justify-center shrink-0">
                                    <Library className="w-6 h-6 text-primary-500" />
                                </div>
                                <div className="text-left min-w-0">
                                    <h3 className="font-bold text-base sm:text-lg text-surface-900 dark:text-white truncate">{exam.name}</h3>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-xs font-bold text-surface-400 uppercase tracking-widest">{exam.course_type}</span>
                                        <div className="w-1 h-1 rounded-full bg-surface-300"></div>
                                        <span className="text-xs text-surface-500">{exam.subjects_count} Subjects</span>
                                    </div>
                                </div>
                            </div>
                            <ChevronDown className={`w-5 h-5 text-surface-400 transition-transform shrink-0 ${expandedExam === exam.id ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {expandedExam === exam.id && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden border-t dark:border-surface-700">
                                    <div className="p-5 sm:p-6 space-y-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                            <div className="p-4 bg-surface-50 dark:bg-surface-900/30 rounded-2xl">
                                                <p className="text-[10px] font-bold text-surface-400 uppercase tracking-wider mb-1">Duration</p>
                                                <p className="font-bold text-surface-700 dark:text-surface-200">{exam.duration_minutes} Minutes</p>
                                            </div>
                                            <div className="p-4 bg-surface-50 dark:bg-surface-900/30 rounded-2xl">
                                                <p className="text-[10px] font-bold text-surface-400 uppercase tracking-wider mb-1">Marking Scheme</p>
                                                <p className="font-bold text-surface-700 dark:text-surface-200">+{exam.total_marks} Total</p>
                                            </div>
                                            <div className="p-4 bg-surface-50 dark:bg-surface-900/30 rounded-2xl">
                                                <p className="text-[10px] font-bold text-surface-400 uppercase tracking-wider mb-1">Testing Resources</p>
                                                <p className="font-bold text-surface-700 dark:text-surface-200">{exam.mock_tests_count} Mocks / {exam.quizzes_count} Quizzes</p>
                                            </div>
                                            <div className="p-4 bg-surface-50 dark:bg-surface-900/30 rounded-2xl">
                                                <p className="text-[10px] font-bold text-surface-400 uppercase tracking-wider mb-1">Question Bank</p>
                                                <p className="font-bold text-surface-700 dark:text-surface-200">{exam.total_questions?.toLocaleString()}+ Questions</p>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <h4 className="text-xs font-black text-surface-400 uppercase tracking-widest px-2">Subjects & Chapters</h4>
                                            {exam.subjects?.map((subject) => (
                                                <div key={subject.id} className="border dark:border-surface-700 rounded-2xl overflow-hidden bg-surface-50/30 dark:bg-surface-900/10">
                                                    <button onClick={(e) => { e.stopPropagation(); setExpandedSubject(expandedSubject === subject.id ? null : subject.id) }} className="w-full p-4 flex items-center justify-between hover:bg-surface-100/50 dark:hover:bg-surface-700/30 transition-colors">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className="w-8 h-8 rounded-lg bg-white dark:bg-surface-800 flex items-center justify-center border border-surface-100 dark:border-surface-700 shrink-0">
                                                                <Book className="w-4 h-4 text-primary-600" />
                                                            </div>
                                                            <div className="text-left min-w-0">
                                                                <p className="font-bold text-surface-800 dark:text-surface-200 truncate">{subject.name}</p>
                                                                <p className="text-[10px] text-surface-500">{subject.weightage}% weightage • {subject.total_topics} Topics</p>
                                                            </div>
                                                        </div>
                                                        <ChevronDown className={`w-4 h-4 text-surface-400 transition-transform shrink-0 ${expandedSubject === subject.id ? 'rotate-180' : ''}`} />
                                                    </button>

                                                    <AnimatePresence>
                                                        {expandedSubject === subject.id && (
                                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden bg-white dark:bg-surface-800">
                                                                <div className="p-4 pt-0 divide-y dark:divide-surface-700/50">
                                                                    {subject.chapters?.map((chapter) => (
                                                                        <div key={chapter.id} className="py-3 flex items-center justify-between group">
                                                                            <div className="flex items-center gap-3 min-w-0">
                                                                                <Layers className="w-3.5 h-3.5 text-surface-400 group-hover:text-primary-500 transition-colors shrink-0" />
                                                                                <div className="min-w-0">
                                                                                    <p className="text-sm font-medium text-surface-700 dark:text-surface-300 truncate">{chapter.name}</p>
                                                                                    <p className="text-[10px] text-surface-500 italic">{chapter.grade ? `Grade ${chapter.grade}` : 'Resource'} • {chapter.estimated_hours}h estimated</p>
                                                                                </div>
                                                                            </div>
                                                                            <span className="text-[10px] bg-surface-100 dark:bg-surface-900 border dark:border-surface-700 px-2 py-0.5 rounded-full text-surface-500 shrink-0">{chapter.topics_count} Topics</span>
                                                                        </div>
                                                                    ))}
                                                                    {subject.chapters?.length === 0 && (
                                                                        <p className="py-4 text-center text-xs text-surface-400 italic">No chapters defined for this subject.</p>
                                                                    )}
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
                {(!explorer || explorer.length === 0) && (
                    <div className="card p-10 text-center text-surface-500 italic">No content library available yet.</div>
                )}
            </div>
        </div>
    )
}

/* ---------------------------------------------------------------------------
 * EnrollmentRequests
 * ------------------------------------------------------------------------- */
const EnrollmentRequests = () => {
    const queryClient = useQueryClient()
    const [filter, setFilter] = useState('pending')
    const [busyId, setBusyId] = useState(null)

    const { data: requests = [], isLoading } = useQuery({
        queryKey: ['enrollmentRequests', filter],
        queryFn: () => tenantAdminService.getEnrollmentRequests(filter === 'all' ? {} : { status: filter }),
    })
    const list = Array.isArray(requests) ? requests : (requests?.results || [])

    const refresh = () => queryClient.invalidateQueries({ queryKey: ['enrollmentRequests'] })

    const approve = async (id) => {
        setBusyId(id)
        try { await tenantAdminService.approveEnrollment(id); refresh(); toast.success('Enrollment approved') }
        catch { toast.error('Failed to approve') } finally { setBusyId(null) }
    }
    const reject = async (id) => {
        const reason = window.prompt('Reason for rejection (optional):', '') ?? ''
        setBusyId(id)
        try { await tenantAdminService.rejectEnrollment(id, reason); refresh(); toast.success('Enrollment rejected') }
        catch { toast.error('Failed to reject') } finally { setBusyId(null) }
    }

    const badge = {
        pending: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600',
        approved: 'bg-green-100 dark:bg-green-900/30 text-green-600',
        rejected: 'bg-red-100 dark:bg-red-900/30 text-red-600',
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-primary-500" /> Enrollment Requests
                </h2>
                <div className="flex gap-1 p-1 bg-surface-100 dark:bg-surface-800 rounded-lg overflow-x-auto">
                    {['pending', 'approved', 'rejected', 'all'].map((f) => (
                        <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 rounded-md text-sm font-semibold capitalize transition-all whitespace-nowrap ${filter === f ? 'bg-white dark:bg-surface-700 text-primary-600 shadow-sm' : 'text-surface-500'}`}>
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {isLoading ? (
                <p className="text-surface-500">Loading…</p>
            ) : list.length === 0 ? (
                <div className="card p-10 text-center text-surface-500">
                    <Clock className="w-10 h-10 mx-auto mb-3 text-surface-300" />
                    No {filter !== 'all' ? filter : ''} requests.
                </div>
            ) : (
                <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-surface-50 dark:bg-surface-800 text-xs uppercase text-surface-500">
                                <tr>
                                    <th className="px-4 py-3">Student</th>
                                    <th className="px-4 py-3">Course</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-surface-100 dark:divide-surface-700">
                                {list.map((r) => (
                                    <tr key={r.id}>
                                        <td className="px-4 py-3">
                                            <p className="font-medium">{r.student_name || '—'}</p>
                                            <p className="text-xs text-surface-500">{r.student_email}</p>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">{r.course_name} <span className="text-xs text-surface-400">{r.course_code}</span></td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${badge[r.status]}`}>{r.status}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {r.status === 'pending' ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => approve(r.id)} disabled={busyId === r.id} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-500 text-white text-sm font-semibold hover:bg-green-600 disabled:opacity-50">
                                                        <Check size={14} /> Approve
                                                    </button>
                                                    <button onClick={() => reject(r.id)} disabled={busyId === r.id} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-50">
                                                        <XCircle size={14} /> Reject
                                                    </button>
                                                </div>
                                            ) : r.status === 'rejected' ? (
                                                <div className="text-right">
                                                    <button onClick={() => approve(r.id)} disabled={busyId === r.id} className="text-sm text-green-600 hover:underline">Approve anyway</button>
                                                </div>
                                            ) : (
                                                <div className="text-right"><span className="text-sm text-surface-400">—</span></div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}

/* ---------------------------------------------------------------------------
 * Overview
 * ------------------------------------------------------------------------- */
const Overview = ({ stats }) => (
    <div className="space-y-6 sm:space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <StatCard title="Total Students" value={stats?.total_students || 0} icon={Users} color="bg-blue-500" description="Registered locally" />
            <StatCard title="Active Today" value={stats?.active_today || 0} icon={Zap} color="bg-amber-500" description="Student engagement" />
            <StatCard title="Avg. Accuracy" value={`${stats?.avg_accuracy || 0}%`} icon={CheckCircle2} color="bg-emerald-500" description="Target score performance" />
            <StatCard title="Total XP Distributed" value={stats?.total_xp?.toLocaleString() || 0} icon={TrendingUp} color="bg-purple-500" description="Collective progress" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            <div className="card p-5 sm:p-6">
                <h3 className="text-lg font-bold mb-6">Student Level Distribution</h3>
                <div className="space-y-4">
                    {Object.entries(stats?.level_distribution || {}).map(([level, count]) => {
                        const percentage = stats?.total_students > 0 ? (count / stats.total_students) * 100 : 0
                        return (
                            <div key={level} className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium text-surface-700 dark:text-surface-300">Level {level}</span>
                                    <span className="text-surface-500">{count} students ({Math.round(percentage)}%)</span>
                                </div>
                                <div className="h-2 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} className="h-full bg-primary-500" />
                                </div>
                            </div>
                        )
                    })}
                    {Object.keys(stats?.level_distribution || {}).length === 0 && (
                        <p className="text-center text-surface-500 py-8 italic">No institutional participation data yet.</p>
                    )}
                </div>
            </div>

            <div className="card p-5 sm:p-6">
                <h3 className="text-lg font-bold mb-6 flex items-center justify-between">
                    <span>30-Day Student Activity</span>
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-surface-400 font-bold">
                        <div className="w-2 h-2 rounded-full bg-primary-500"></div> Active Users
                    </div>
                </h3>
                <div className="relative h-56 sm:h-64">
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                        {[...Array(5)].map((_, i) => <div key={i} className="w-full border-t border-surface-100 dark:border-surface-800/50 h-0"></div>)}
                    </div>
                    <div className="relative h-full flex items-end gap-1 px-2">
                        {(() => {
                            const trend = stats?.activity_trend || []
                            const maxUsers = Math.max(...trend.map((i) => i.active_users), 1)
                            return trend.map((item) => {
                                const height = (item.active_users / maxUsers) * 100
                                return (
                                    <div key={item.date} className="group relative flex-1 h-full flex flex-col justify-end items-center">
                                        <div className="absolute inset-x-0 bottom-0 top-0 bg-primary-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-lg"></div>
                                        <motion.div initial={{ height: 0 }} animate={{ height: `${height}%` }} className="w-1.5 md:w-2.5 bg-gradient-to-t from-primary-600 to-primary-400 rounded-full relative z-10 shadow-sm" />
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 hidden group-hover:block z-50">
                                            <div className="bg-surface-900 dark:bg-surface-800 text-white p-2 rounded-xl shadow-2xl border border-surface-700/50 whitespace-nowrap">
                                                <div className="text-[8px] uppercase tracking-tighter text-surface-400 font-black mb-0.5">{item.date}</div>
                                                <div className="text-sm font-black flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-primary-400"></div>{item.active_users} Users</div>
                                            </div>
                                            <div className="w-2 h-2 bg-surface-900 dark:bg-surface-800 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2 border-r border-b border-surface-700/50"></div>
                                        </div>
                                    </div>
                                )
                            })
                        })()}
                        {(!stats?.activity_trend || stats.activity_trend.length === 0) && (
                            <div className="absolute inset-0 flex items-center justify-center text-surface-500 italic text-sm">No activity trend data recorded.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    </div>
)

/* ---------------------------------------------------------------------------
 * TenantSettings — branding (logo) + feature toggles
 * ------------------------------------------------------------------------- */
const TenantSettings = () => {
    const queryClient = useQueryClient()
    const fetchTenantConfig = useTenantStore((s) => s.fetchTenantConfig)
    const fileInputRef = useRef(null)

    const { data: settings, isLoading } = useQuery({
        queryKey: ['tenantSettings'],
        queryFn: () => tenantAdminService.getSettings(),
    })

    const [features, setFeatures] = useState({})

    useEffect(() => {
        if (settings?.features) setFeatures(settings.features)
    }, [settings])

    const availableFeatures = settings?.available_features || []

    const featuresMutation = useMutation({
        mutationFn: (next) => tenantAdminService.updateFeatures(next),
        onSuccess: (data) => {
            queryClient.setQueryData(['tenantSettings'], data)
            fetchTenantConfig()
            toast.success('Features updated')
        },
        onError: () => toast.error('Failed to update features'),
    })

    const logoMutation = useMutation({
        mutationFn: (file) => tenantAdminService.updateLogo(file),
        onSuccess: (data) => {
            queryClient.setQueryData(['tenantSettings'], data)
            fetchTenantConfig()
            toast.success('Logo updated')
        },
        onError: () => toast.error('Failed to upload logo'),
    })

    const toggleFeature = (key) => {
        const next = { ...features, [key]: !features[key] }
        setFeatures(next)
        featuresMutation.mutate({ [key]: next[key] })
    }

    const handleLogoChange = (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (!file.type.startsWith('image/')) {
            toast.error('Please choose an image file')
            return
        }
        logoMutation.mutate(file)
        e.target.value = ''
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[240px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Branding */}
            <div className="card p-6 space-y-4">
                <div className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-primary-500" />
                    <h3 className="text-lg font-bold text-surface-900 dark:text-white">Branding</h3>
                </div>
                <p className="text-sm text-surface-500">Upload your institution's logo. It appears in the sidebar for all your students.</p>
                <div className="flex items-center gap-5">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700">
                        {settings?.logo ? (
                            <img src={settings.logo} alt="Logo" className="w-full h-full object-contain" />
                        ) : (
                            <span className="text-2xl font-bold text-surface-400">
                                {(settings?.name || 'DT').slice(0, 2).toUpperCase()}
                            </span>
                        )}
                    </div>
                    <div>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={logoMutation.isPending}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold transition-colors disabled:opacity-60"
                        >
                            {logoMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                            {settings?.logo ? 'Change Logo' : 'Upload Logo'}
                        </button>
                        <p className="text-xs text-surface-400 mt-2">PNG, JPG or SVG. Square images look best.</p>
                    </div>
                </div>
            </div>

            {/* Feature toggles */}
            <div className="card p-6 space-y-4">
                <div className="flex items-center gap-2">
                    <SlidersIcon className="w-5 h-5 text-primary-500" />
                    <h3 className="text-lg font-bold text-surface-900 dark:text-white">Features</h3>
                </div>
                <p className="text-sm text-surface-500">Show or hide modules for your students. Disabled features are removed from navigation and blocked entirely.</p>
                <div className="divide-y divide-surface-100 dark:divide-surface-800">
                    {availableFeatures.map((f) => {
                        const enabled = Boolean(features[f.key])
                        return (
                            <div key={f.key} className="flex items-center justify-between py-3">
                                <span className="font-medium text-surface-800 dark:text-surface-200">{f.label}</span>
                                <button
                                    role="switch"
                                    aria-checked={enabled}
                                    onClick={() => toggleFeature(f.key)}
                                    disabled={featuresMutation.isPending}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-60 ${enabled ? 'bg-primary-500' : 'bg-surface-300 dark:bg-surface-700'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

/* ---------------------------------------------------------------------------
 * AdminDashboard (root)
 * ------------------------------------------------------------------------- */
const TABS = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'students', label: 'Student Records', icon: Users },
    { id: 'enrollments', label: 'Enrollments', icon: GraduationCap },
    { id: 'performance', label: 'Reports', icon: BarChart3 },
    { id: 'content', label: 'Content Builder', icon: Library },
    { id: 'settings', label: 'Settings', icon: SlidersIcon },
]

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview')
    const queryClient = useQueryClient()
    const navigate = useNavigate()

    const { data: stats, isLoading, error, isFetching } = useQuery({
        queryKey: ['tenantAdminStats'],
        queryFn: () => analyticsService.getTenantAdminStats(),
        refetchInterval: 60000,
    })

    useEffect(() => { window.scrollTo(0, 0) }, [activeTab])

    const refreshAll = () => {
        queryClient.invalidateQueries()
        toast.success('Dashboard refreshed')
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="max-w-2xl mx-auto card p-8 text-center space-y-3">
                <ShieldOff className="w-10 h-10 mx-auto text-rose-500" />
                <h2 className="text-lg font-bold text-surface-900 dark:text-white">Unable to load dashboard</h2>
                <p className="text-surface-500 text-sm">Failed to load admin statistics. Please ensure you have administrator privileges.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-600 to-primary-700 p-6 sm:p-8 text-white shadow-lg shadow-primary-500/20">
                <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
                <div className="absolute -right-4 bottom-0 w-32 h-32 bg-white/5 rounded-full blur-xl" />
                <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold mb-3">
                            <Shield className="w-3.5 h-3.5" /> Institutional Admin
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold">Admin Dashboard</h1>
                        <p className="text-white/80 mt-1 text-sm sm:text-base">Manage student records and track institutional performance</p>
                    </div>
                    <button onClick={refreshAll} className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 transition-colors text-sm font-semibold backdrop-blur-sm">
                        <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} /> Refresh
                    </button>
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                        <button onClick={() => navigate('/admin/mock-tests')} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 transition-colors text-sm font-semibold backdrop-blur-sm">
                            <ClipboardList className="w-4 h-4" /> Mock Tests
                        </button>
                        <button onClick={refreshAll} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 transition-colors text-sm font-semibold backdrop-blur-sm">
                            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} /> Refresh
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="overflow-x-auto -mx-1 px-1">
                <div className="flex gap-1 p-1 bg-surface-100 dark:bg-surface-800 rounded-xl w-max min-w-full sm:w-fit sm:min-w-0">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 sm:px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'bg-white dark:bg-surface-700 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'}`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                    {activeTab === 'overview' && <Overview stats={stats} />}
                    {activeTab === 'students' && <StudentManagement />}
                    {activeTab === 'enrollments' && <EnrollmentRequests />}
                    {activeTab === 'performance' && <PerformanceReports />}
                    {activeTab === 'content' && <ContentBuilder />}
                    {activeTab === 'settings' && <TenantSettings />}
                </motion.div>
            </AnimatePresence>
        </div>
    )
}

export default AdminDashboard
