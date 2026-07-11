import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
    GraduationCap, Plus, Search, X, Settings2, Pencil, Trash2, Loader2,
} from 'lucide-react'
import { contentBuilderService as svc } from '../../services/contentBuilderService'
import { EntityModal, ConfirmDialog, formatApiError } from './builderShared'

const statusPill = (status) =>
    status === 'active'
        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
        : status === 'coming_soon'
            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
            : 'bg-surface-200 text-surface-600 dark:bg-surface-700 dark:text-surface-300'

/* ===========================================================================
 * CourseBuilder — top level of the admin Content Builder.
 * Lists courses with create/edit/delete and hands off editing to the shared
 * "Manage course" experience (CourseManager), rendered inside the admin layout.
 * ========================================================================= */
const CourseBuilder = () => {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [search, setSearch] = useState('')
    const [modal, setModal] = useState(null)   // { instance } | null (null instance = create)
    const [del, setDel] = useState(null)        // { instance, label } | null

    const { data: courses = [], isLoading } = useQuery({
        queryKey: ['cb-courses'],
        queryFn: () => svc.getExams(),
    })

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase()
        if (!q) return courses
        return courses.filter((c) =>
            (c.name || '').toLowerCase().includes(q) ||
            (c.code || '').toLowerCase().includes(q)
        )
    }, [courses, search])

    const saveMutation = useMutation({
        mutationFn: ({ instance, payload }) =>
            instance ? svc.updateExam(instance.id, payload) : svc.createExam(payload),
        onSuccess: (_d, vars) => {
            toast.success(`Course ${vars.instance ? 'saved' : 'created'}`)
            queryClient.invalidateQueries({ queryKey: ['cb-courses'] })
            queryClient.invalidateQueries({ queryKey: ['availableCourses'] })
            setModal(null)
        },
        onError: (err) => toast.error(formatApiError(err)),
    })

    const deleteMutation = useMutation({
        mutationFn: ({ instance }) => svc.deleteExam(instance.id),
        onSuccess: () => {
            toast.success('Course deleted')
            queryClient.invalidateQueries({ queryKey: ['cb-courses'] })
            queryClient.invalidateQueries({ queryKey: ['availableCourses'] })
            setDel(null)
        },
        onError: (err) => toast.error(formatApiError(err)),
    })

    const manage = (course) => navigate(`/admin-dashboard/content/${course.id}`)

    if (isLoading) {
        return <div className="py-16 flex justify-center"><Loader2 className="w-7 h-7 animate-spin text-primary-500" /></div>
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl font-display font-bold text-surface-900 dark:text-white">Courses</h2>
                    <p className="text-sm text-surface-500">Create courses and manage their subjects, chapters, topics, content &amp; quizzes</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400 pointer-events-none" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search courses..."
                            className="w-full sm:w-56 pl-9 pr-9 py-2.5 rounded-xl text-sm bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-700 focus:border-primary-400 dark:focus:border-primary-600 focus:ring-2 focus:ring-primary-500/20 outline-none transition-colors"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch('')}
                                aria-label="Clear search"
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-md text-surface-400 hover:text-surface-600 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                            >
                                <X size={15} />
                            </button>
                        )}
                    </div>
                    <button onClick={() => setModal({ instance: null })} className="btn-primary py-2.5 whitespace-nowrap">
                        <Plus className="w-4 h-4" /> New Course
                    </button>
                </div>
            </div>

            {/* Course grid */}
            {courses.length === 0 ? (
                <div className="card p-12 text-center">
                    <GraduationCap className="w-10 h-10 mx-auto text-surface-300 mb-3" />
                    <p className="text-surface-500">No courses yet. Create your first course to start building content.</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="card p-10 text-center text-surface-500">
                    <Search className="w-9 h-9 mx-auto mb-3 text-surface-300" />
                    <p className="font-medium">No courses match your search</p>
                    <button
                        type="button"
                        onClick={() => setSearch('')}
                        className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
                    >
                        <X size={14} /> Clear search
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filtered.map((course) => (
                        <motion.div
                            key={course.id}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="card p-5 flex flex-col gap-4"
                        >
                            <div className="flex items-start gap-3">
                                <span
                                    className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                                    style={{ background: (course.color || '#3B82F6') + '22' }}
                                >
                                    <GraduationCap className="w-5 h-5" style={{ color: course.color || '#3B82F6' }} />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-semibold truncate text-surface-900 dark:text-white">{course.name}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded capitalize ${statusPill(course.status)}`}>
                                            {(course.status || 'active').replace('_', ' ')}
                                        </span>
                                        <span className="text-[11px] text-surface-500 capitalize">{course.course_type}</span>
                                    </div>
                                    <p className="text-xs text-surface-400 mt-1.5">{course.subjects_count ?? 0} subjects</p>
                                </div>
                            </div>

                            <div className="mt-auto flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => manage(course)}
                                    className="btn-primary flex-1 inline-flex items-center justify-center gap-2 text-sm py-2.5"
                                >
                                    <Settings2 size={15} /> Manage course
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setModal({ instance: course })}
                                    aria-label="Edit course"
                                    className="p-2.5 rounded-xl text-surface-500 bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
                                >
                                    <Pencil size={15} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDel({ instance: course, label: course.name })}
                                    aria-label="Delete course"
                                    className="p-2.5 rounded-xl text-rose-500 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors"
                                >
                                    <Trash2 size={15} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            <AnimatePresence>
                {modal && (
                    <EntityModal
                        type="exam"
                        instance={modal.instance}
                        saving={saveMutation.isPending}
                        onClose={() => setModal(null)}
                        onSubmit={(payload) => saveMutation.mutate({ instance: modal.instance, payload })}
                    />
                )}
                {del && (
                    <ConfirmDialog
                        label={del.label}
                        deleting={deleteMutation.isPending}
                        onCancel={() => setDel(null)}
                        onConfirm={() => deleteMutation.mutate({ instance: del.instance })}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}

export default CourseBuilder
