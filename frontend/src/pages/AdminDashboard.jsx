import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { analyticsService } from '../services/analyticsService'
import { tenantAdminService } from '../services/tenantAdminService'
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
    ChevronRight,
    Award,
    X,
    Calendar,
    MapPin,
    School,
    BookOpen,
    ExternalLink,
    Library,
    ChevronDown,
    Book,
    Layers,
    FileText
} from 'lucide-react'

const StatCard = ({ title, value, icon: Icon, color, description }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6"
    >
        <div className="flex items-start justify-between">
            <div>
                <p className="text-sm font-medium text-surface-500 mb-1">{title}</p>
                <h3 className="text-3xl font-bold text-surface-900 dark:text-white">{value}</h3>
                {description && (
                    <p className="mt-2 text-sm text-surface-500">{description}</p>
                )}
            </div>
            <div className={`p-3 rounded-xl ${color}`}>
                <Icon className="w-6 h-6 text-white" />
            </div>
        </div>
    </motion.div>
)

const StudentDetailModal = ({ student, onClose }) => {
    if (!student) return null;

    const sections = [
        {
            title: 'Personal Information',
            icon: Users,
            fields: [
                { label: 'Full Name', value: student.user.full_name },
                { label: 'Email', value: student.user.email },
                { label: 'Phone', value: student.user.phone || 'Not provided' },
                { label: 'Date of Birth', value: student.date_of_birth || 'Not provided', icon: Calendar },
                { label: 'Bio', value: student.bio || 'No bio available', fullWidth: true },
            ]
        },
        {
            title: 'Academic Details',
            icon: School,
            fields: [
                { label: 'Primary Exam', value: student.primary_exam_name, icon: BookOpen },
                { label: 'Target Year', value: student.target_year || 'Not set' },
                { label: 'Grade/Level', value: student.grade || 'Not provided' },
                { label: 'School/Institute', value: student.school || 'Not provided' },
                { label: 'Coaching Center', value: student.coaching || 'Not provided' },
                { label: 'Board/University', value: student.board || 'Not provided' },
                { label: 'Study Medium', value: student.medium || 'Not provided' },
            ]
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
            ]
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
            ]
        }
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-surface-900/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-white dark:bg-surface-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl border border-surface-100 dark:border-surface-700 flex flex-col"
            >
                {/* Header */}
                <div className="p-6 border-b dark:border-surface-700 flex items-center justify-between bg-surface-50/50 dark:bg-surface-900/20">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 text-xl font-black">
                            {student.user.full_name.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-surface-900 dark:text-white">{student.user.full_name}</h2>
                            <p className="text-sm text-surface-500">{student.user.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-xl transition-colors"
                    >
                        <X className="w-6 h-6 text-surface-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {sections.map((section, idx) => (
                            <div key={idx} className="space-y-4">
                                <h3 className="text-sm font-black uppercase tracking-widest text-primary-600 dark:text-primary-400 flex items-center gap-2">
                                    <section.icon className="w-4 h-4" />
                                    {section.title}
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {section.fields.map((field, fIdx) => (
                                        <div key={fIdx} className={`${field.fullWidth ? 'col-span-2' : ''} space-y-1`}>
                                            <p className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">{field.label}</p>
                                            <p className={`text-sm text-surface-700 dark:text-surface-200 ${field.className || ''}`}>
                                                {field.value}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-surface-50 dark:bg-surface-900/20 border-t dark:border-surface-700 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-surface-900 dark:bg-white text-white dark:text-surface-900 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
                    >
                        Close Profile
                    </button>
                </div>
            </motion.div>
        </div>
    )
}

const StudentManagement = () => {
    const queryClient = useQueryClient()
    const [searchTerm, setSearchTerm] = useState('')
    const [filterRole, setFilterRole] = useState('all')
    const [selectedStudent, setSelectedStudent] = useState(null)

    const { data: students, isLoading } = useQuery({
        queryKey: ['tenantStudents'],
        queryFn: () => tenantAdminService.getStudents()
    })

    const resetMutation = useMutation({
        mutationFn: (id) => tenantAdminService.resetStudentProgress(id),
        onSuccess: () => {
            queryClient.invalidateQueries(['tenantStudents'])
            alert('Student progress has been reset successfully.')
        }
    })

    const statusMutation = useMutation({
        mutationFn: (id) => tenantAdminService.toggleStudentStatus(id),
        onSuccess: () => {
            queryClient.invalidateQueries(['tenantStudents'])
        }
    })

    const roleMutation = useMutation({
        mutationFn: ({ id, role }) => tenantAdminService.updateStudent(id, { user: { role } }),
        onSuccess: () => {
            queryClient.invalidateQueries(['tenantStudents'])
            alert('User role updated successfully.')
        }
    })

    const studentList = Array.isArray(students) ? students : (students?.results || [])

    const filteredStudents = studentList.filter(student => {
        const matchesSearch = student.user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.user.email.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesRole = filterRole === 'all' || student.user.role === filterRole
        return matchesSearch && matchesRole
    })

    if (isLoading) return <div className="py-12 text-center text-surface-500">Loading students...</div>

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        className="input pl-10 w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    className="input w-full md:w-48"
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                >
                    <option value="all">All Roles</option>
                    <option value="student">Student</option>
                    <option value="instructor">Instructor</option>
                    <option value="admin">Admin</option>
                </select>
            </div>

            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-surface-50 dark:bg-surface-800/50 text-xs font-semibold text-surface-500 uppercase">
                            <tr>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Stats</th>
                                <th className="px-6 py-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                            {filteredStudents?.map((student) => (
                                <tr key={student.id} className="hover:bg-surface-50/50 dark:hover:bg-surface-800/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 font-bold">
                                                {student.user.full_name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-medium text-surface-900 dark:text-white">{student.user.full_name}</div>
                                                <div className="text-xs text-surface-500">{student.user.email}</div>
                                                <div className="mt-1">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${student.user.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                                                        student.user.role === 'instructor' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                            'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                                                        }`}>
                                                        {student.user.role}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => statusMutation.mutate(student.id)}
                                            className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border transition-all ${!student.user.is_suspended
                                                ? 'bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400'
                                                : 'bg-rose-50 border-rose-100 text-rose-700 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-400 hover:bg-rose-100'
                                                }`}
                                        >
                                            {!student.user.is_suspended ? (
                                                <><Shield className="w-3.5 h-3.5" /> Active</>
                                            ) : (
                                                <><ShieldOff className="w-3.5 h-3.5" /> Suspended</>
                                            )}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-xs space-y-1">
                                        <div className="flex justify-between">
                                            <span className="text-surface-500">XP:</span>
                                            <span className="font-semibold text-surface-900 dark:text-white">{student.total_xp}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-surface-500">Accuracy:</span>
                                            <span className="font-semibold text-surface-900 dark:text-white">{student.overall_accuracy}%</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    if (window.confirm(`Are you sure you want to reset all progress for ${student.user.full_name}? This action cannot be undone.`)) {
                                                        resetMutation.mutate(student.id)
                                                    }
                                                }}
                                                className="p-2 text-surface-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all tooltip"
                                                title="Reset Progress"
                                            >
                                                <RotateCcw className="w-4 h-4" />
                                            </button>

                                            <button
                                                onClick={() => setSelectedStudent(student)}
                                                className="p-2 text-surface-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all tooltip"
                                                title="View Full Profile"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </button>

                                            <div className="relative group/role">
                                                <button className="p-2 text-surface-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-all">
                                                    <UserCog className="w-4 h-4" />
                                                </button>
                                                <div className="absolute right-0 bottom-full mb-2 hidden group-hover/role:block bg-white dark:bg-surface-800 border dark:border-surface-700 rounded-xl shadow-xl p-2 z-50 min-w-[120px]">
                                                    {['student', 'instructor', 'admin'].map(r => (
                                                        student.user.role !== r && (
                                                            <button
                                                                key={r}
                                                                onClick={() => {
                                                                    if (window.confirm(`Change ${student.user.full_name}'s role to ${r}?`)) {
                                                                        roleMutation.mutate({ id: student.id, role: r })
                                                                    }
                                                                }}
                                                                className="w-full text-left px-3 py-1.5 text-xs rounded-lg hover:bg-surface-50 dark:hover:bg-surface-700 capitalize"
                                                            >
                                                                Make {r}
                                                            </button>
                                                        )
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredStudents?.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-surface-500 italic">
                                        No students found matching your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <AnimatePresence>
                {selectedStudent && (
                    <StudentDetailModal
                        student={selectedStudent}
                        onClose={() => setSelectedStudent(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}

const PerformanceReports = () => {
    const { data: subjectStats, isLoading: loadingStats } = useQuery({
        queryKey: ['tenantSubjectStats'],
        queryFn: () => analyticsService.getTenantSubjectStats()
    })

    const { data: leaderboard, isLoading: loadingLeaderboard } = useQuery({
        queryKey: ['tenantLeaderboard'],
        queryFn: () => analyticsService.getTenantLeaderboard(5)
    })

    if (loadingStats || loadingLeaderboard) return <div className="py-12 text-center text-surface-500">Generating reports...</div>

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                <div className="card p-6">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-primary-500" />
                        Subject-wise Accuracy
                    </h3>
                    <div className="space-y-6">
                        {subjectStats?.map((item) => (
                            <div key={item.subject} className="group">
                                <div className="flex justify-between items-end mb-2">
                                    <div>
                                        <span className="text-sm font-semibold text-surface-700 dark:text-surface-300 group-hover:text-primary-500 transition-colors">
                                            {item.subject}
                                        </span>
                                        <span className="text-[10px] text-surface-500 ml-2">
                                            ({item.student_count} students)
                                        </span>
                                    </div>
                                    <span className="text-sm font-bold text-primary-600 dark:text-primary-400">{item.accuracy}%</span>
                                </div>
                                <div className="h-3 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${item.accuracy}%` }}
                                        className="h-full bg-gradient-to-r from-primary-500 to-primary-400"
                                    />
                                </div>
                                <div className="mt-1 flex justify-between text-[10px] text-surface-400">
                                    <span>Avg. Study Time: {item.avg_study_minutes}m</span>
                                </div>
                            </div>
                        ))}
                        {(!subjectStats || subjectStats.length === 0) && (
                            <div className="text-center py-12 text-surface-500 italic font-medium">
                                No subject data available yet.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="card p-6 bg-gradient-to-br from-surface-50 to-white dark:from-surface-900 dark:to-surface-800 border-primary-500/10">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <Award className="w-5 h-5 text-amber-500" />
                        Institutional Top 5
                    </h3>
                    <div className="space-y-4">
                        {leaderboard?.map((student, index) => (
                            <div
                                key={student.id}
                                className="flex items-center gap-4 p-3 rounded-xl bg-white dark:bg-surface-800/50 shadow-sm border border-surface-100 dark:border-surface-700"
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-amber-100 text-amber-600' :
                                    index === 1 ? 'bg-slate-100 text-slate-600' :
                                        index === 2 ? 'bg-orange-100 text-orange-600' :
                                            'bg-surface-100 text-surface-500'
                                    }`}>
                                    {index + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-sm truncate dark:text-white">
                                        {student.name}
                                    </div>
                                    <div className="text-[10px] text-surface-500 flex items-center gap-1">
                                        Level {student.level} • {student.accuracy}% Accuracy
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs font-black text-primary-600 dark:text-primary-400">
                                        {student.xp.toLocaleString()}
                                    </div>
                                    <div className="text-[8px] uppercase tracking-wider text-surface-400 font-bold">XP</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="w-full mt-6 py-2.5 rounded-xl border border-surface-200 dark:border-surface-700 text-xs font-bold text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-700 transition-all flex items-center justify-center gap-2">
                        View Full Leaderboard <ChevronRight className="w-3 h-3" />
                    </button>
                </div>
            </div>
        </div>
    )
}

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
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h2 className="text-xl font-bold text-surface-900 dark:text-white">Institutional Content Library</h2>
                    <p className="text-sm text-surface-500">Explore exams, subjects, and chapters available to your students</p>
                </div>
            </div>

            <div className="space-y-4">
                {explorer?.map((exam) => (
                    <div key={exam.id} className="bg-white dark:bg-surface-800 rounded-3xl border border-surface-100 dark:border-surface-700 overflow-hidden shadow-sm">
                        {/* Exam Header */}
                        <button
                            onClick={() => setExpandedExam(expandedExam === exam.id ? null : exam.id)}
                            className="w-full p-6 flex items-center justify-between hover:bg-surface-50/50 dark:hover:bg-surface-900/10 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-surface-100 dark:bg-surface-900/30 flex items-center justify-center">
                                    <Library className="w-6 h-6 text-primary-500" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-bold text-lg text-surface-900 dark:text-white">{exam.name}</h3>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-xs font-bold text-surface-400 uppercase tracking-widest">{exam.exam_type}</span>
                                        <div className="w-1 h-1 rounded-full bg-surface-300"></div>
                                        <span className="text-xs text-surface-500">{exam.subjects_count} Subjects</span>
                                    </div>
                                </div>
                            </div>
                            <ChevronDown className={`w-5 h-5 text-surface-400 transition-transform ${expandedExam === exam.id ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                            {expandedExam === exam.id && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden border-t dark:border-surface-700"
                                >
                                    <div className="p-6 space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                            <div className="p-4 bg-surface-50 dark:bg-surface-900/30 rounded-2xl">
                                                <p className="text-[10px] font-bold text-surface-400 uppercase tracking-wider mb-1">Duration</p>
                                                <p className="font-bold text-surface-700 dark:text-surface-200">{exam.duration_minutes} Minutes</p>
                                            </div>
                                            <div className="p-4 bg-surface-50 dark:bg-surface-900/30 rounded-2xl">
                                                <p className="text-[10px] font-bold text-surface-400 uppercase tracking-wider mb-1">Marking Scheme</p>
                                                <p className="font-bold text-surface-700 dark:text-surface-200">+{exam.total_marks} Total / No Neg</p>
                                            </div>
                                            <div className="p-4 bg-surface-50 dark:bg-surface-900/30 rounded-2xl">
                                                <p className="text-[10px] font-bold text-surface-400 uppercase tracking-wider mb-1">Testing Resources</p>
                                                <p className="font-bold text-surface-700 dark:text-surface-200">{exam.mock_tests_count} Mock Tests / {exam.quizzes_count} Quizzes</p>
                                            </div>
                                            <div className="p-4 bg-surface-50 dark:bg-surface-900/30 rounded-2xl">
                                                <p className="text-[10px] font-bold text-surface-400 uppercase tracking-wider mb-1">Global Database</p>
                                                <p className="font-bold text-surface-700 dark:text-surface-200">{exam.total_questions?.toLocaleString()}+ Questions</p>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <h4 className="text-xs font-black text-surface-400 uppercase tracking-widest px-2">Subjects & Chapters</h4>
                                            {exam.subjects?.map((subject) => (
                                                <div key={subject.id} className="border dark:border-surface-700 rounded-2xl overflow-hidden bg-surface-50/30 dark:bg-surface-900/10">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            setExpandedSubject(expandedSubject === subject.id ? null : subject.id)
                                                        }}
                                                        className="w-full p-4 flex items-center justify-between hover:bg-surface-100/50 dark:hover:bg-surface-700/30 transition-colors"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-white dark:bg-surface-800 flex items-center justify-center border border-surface-100 dark:border-surface-700">
                                                                <Book className="w-4 h-4 text-primary-600" />
                                                            </div>
                                                            <div className="text-left">
                                                                <p className="font-bold text-surface-800 dark:text-surface-200">{subject.name}</p>
                                                                <p className="text-[10px] text-surface-500">{subject.weightage}% weightage • {subject.total_topics} Topics</p>
                                                            </div>
                                                        </div>
                                                        <ChevronDown className={`w-4 h-4 text-surface-400 transition-transform ${expandedSubject === subject.id ? 'rotate-180' : ''}`} />
                                                    </button>

                                                    <AnimatePresence>
                                                        {expandedSubject === subject.id && (
                                                            <motion.div
                                                                initial={{ opacity: 0, height: 0 }}
                                                                animate={{ opacity: 1, height: 'auto' }}
                                                                exit={{ opacity: 0, height: 0 }}
                                                                className="overflow-hidden bg-white dark:bg-surface-800"
                                                            >
                                                                <div className="p-4 pt-0 divide-y dark:divide-surface-700/50">
                                                                    {subject.chapters?.map((chapter) => (
                                                                        <div key={chapter.id} className="py-3 flex items-center justify-between group">
                                                                            <div className="flex items-center gap-3">
                                                                                <Layers className="w-3.5 h-3.5 text-surface-400 group-hover:text-primary-500 transition-colors" />
                                                                                <div>
                                                                                    <p className="text-sm font-medium text-surface-700 dark:text-surface-300">{chapter.name}</p>
                                                                                    <p className="text-[10px] text-surface-500 italic">{chapter.grade ? `Grade ${chapter.grade}` : 'Resource'} • {chapter.estimated_hours}h estimated</p>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="text-[10px] bg-surface-100 dark:bg-surface-900 border dark:border-surface-700 px-2 py-0.5 rounded-full text-surface-500">
                                                                                    {chapter.topics_count} Topics
                                                                                </span>
                                                                            </div>
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
            </div>
        </div>
    )
}

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview')

    const { data: stats, isLoading, error } = useQuery({
        queryKey: ['tenantAdminStats'],
        queryFn: () => analyticsService.getTenantAdminStats(),
        refreshInterval: 60000,
    })

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="alert alert-error">
                Failed to load admin statistics. Please ensure you have administrator privileges.
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-surface-900 dark:text-white">Admin Dashboard</h1>
                    <p className="text-surface-500 mt-1">Manage your institution and track student performance</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="p-1 px-3 py-1.5 rounded-full bg-primary-50 dark:bg-primary-900/30 border border-primary-100 dark:border-primary-800 text-xs font-medium text-primary-600 dark:text-primary-400">
                        Institutional Admin
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-surface-100 dark:bg-surface-800 rounded-xl w-fit">
                {[
                    { id: 'overview', label: 'Overview', icon: TrendingUp },
                    { id: 'students', label: 'User Management', icon: Users },
                    { id: 'performance', label: 'Performance Reports', icon: BarChart3 },
                    { id: 'content', label: 'Content Explorer', icon: Library },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === tab.id
                            ? 'bg-white dark:bg-surface-700 text-primary-600 dark:text-primary-400 shadow-sm'
                            : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {activeTab === 'overview' && (
                        <div className="space-y-8">
                            {/* Main Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <StatCard
                                    title="Total Students"
                                    value={stats?.total_students || 0}
                                    icon={Users}
                                    color="bg-blue-500"
                                    description="Registered locally"
                                />
                                <StatCard
                                    title="Active Today"
                                    value={stats?.active_today || 0}
                                    icon={Zap}
                                    color="bg-amber-500"
                                    description="Student engagement"
                                />
                                <StatCard
                                    title="Avg. Accuracy"
                                    value={`${stats?.avg_accuracy || 0}%`}
                                    icon={CheckCircle2}
                                    color="bg-emerald-500"
                                    description="Target score performance"
                                />
                                <StatCard
                                    title="Total XP Distributed"
                                    value={stats?.total_xp?.toLocaleString() || 0}
                                    icon={TrendingUp}
                                    color="bg-purple-500"
                                    description="Collective progress"
                                />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Level Distribution */}
                                <div className="card p-6">
                                    <h3 className="text-lg font-bold mb-6">Student Level Distribution</h3>
                                    <div className="space-y-4">
                                        {Object.entries(stats?.level_distribution || {}).map(([level, count]) => {
                                            const percentage = stats?.total_students > 0
                                                ? (count / stats.total_students) * 100
                                                : 0

                                            return (
                                                <div key={level} className="space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="font-medium text-surface-700 dark:text-surface-300">Level {level}</span>
                                                        <span className="text-surface-500">{count} students ({Math.round(percentage)}%)</span>
                                                    </div>
                                                    <div className="h-2 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${percentage}%` }}
                                                            className="h-full bg-primary-500"
                                                        />
                                                    </div>
                                                </div>
                                            )
                                        })}
                                        {Object.keys(stats?.level_distribution || {}).length === 0 && (
                                            <p className="text-center text-surface-500 py-8 italic">No institutional participation data yet.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Performance Trend */}
                                <div className="card p-6">
                                    <h3 className="text-lg font-bold mb-6 flex items-center justify-between">
                                        <span>30-Day Student Activity</span>
                                        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-surface-400 font-bold">
                                            <div className="w-2 h-2 rounded-full bg-primary-500"></div>
                                            Active Users
                                        </div>
                                    </h3>

                                    <div className="relative h-64">
                                        {/* Background Grid Lines */}
                                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                                            {[...Array(5)].map((_, i) => (
                                                <div key={i} className="w-full border-t border-surface-100 dark:border-surface-800/50 h-0"></div>
                                            ))}
                                        </div>

                                        <div className="relative h-full flex items-end gap-1 px-2">
                                            {(() => {
                                                const trend = stats?.activity_trend || []
                                                const maxUsers = Math.max(...trend.map(i => i.active_users), 1)

                                                return trend.map((item) => {
                                                    const height = (item.active_users / maxUsers) * 100
                                                    return (
                                                        <div
                                                            key={item.date}
                                                            className="group relative flex-1 h-full flex flex-col justify-end items-center"
                                                        >
                                                            {/* Ghost Bar (Background) */}
                                                            <div className="absolute inset-x-0 bottom-0 top-0 bg-primary-500/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-lg"></div>

                                                            {/* Actual Data Bar */}
                                                            <motion.div
                                                                initial={{ height: 0 }}
                                                                animate={{ height: `${height}%` }}
                                                                className="w-1.5 md:w-2.5 bg-gradient-to-t from-primary-600 to-primary-400 rounded-full relative z-10 shadow-sm"
                                                            />

                                                            {/* Tooltip */}
                                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 hidden group-hover:block z-50">
                                                                <div className="bg-surface-900 dark:bg-surface-800 text-white p-2 rounded-xl shadow-2xl border border-surface-700/50 whitespace-nowrap">
                                                                    <div className="text-[8px] uppercase tracking-tighter text-surface-400 font-black mb-0.5">{item.date}</div>
                                                                    <div className="text-sm font-black flex items-center gap-1.5">
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-primary-400"></div>
                                                                        {item.active_users} Users
                                                                    </div>
                                                                </div>
                                                                <div className="w-2 h-2 bg-surface-900 dark:bg-surface-800 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2 border-r border-b border-surface-700/50"></div>
                                                            </div>
                                                        </div>
                                                    )
                                                })
                                            })()}

                                            {(!stats?.activity_trend || stats.activity_trend.length === 0) && (
                                                <div className="absolute inset-0 flex items-center justify-center text-surface-500 italic text-sm">
                                                    No activity trend data recorded.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'students' && <StudentManagement />}
                    {activeTab === 'performance' && <PerformanceReports />}
                    {activeTab === 'content' && <ContentManagement />}
                </motion.div>
            </AnimatePresence>
        </div>
    )
}

export default AdminDashboard
