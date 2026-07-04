import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
    ArrowLeft, Plus, ChevronRight, ChevronDown, Loader2, Layers, Book,
    FileText, ListChecks, GraduationCap, Pencil, Eye, Video, FileType,
    Sparkles, HelpCircle, ClipboardList, Clock, Users, X, CheckCircle2, Save,
} from 'lucide-react'
import { contentBuilderService as svc } from '../services/contentBuilderService'
import { useAuthStore } from '../context/authStore'
import {
    EntityModal, ConfirmDialog, RowActions, QuestionModal, formatApiError, QTYPE_LABEL,
} from '../components/admin/builderShared'
import Loading from '../components/common/Loading'

/* Content-type icon + tint */
const CONTENT_ICON = { video: Video, pdf: FileType, notes: FileText, revision: FileText, formula: Sparkles, interactive: Sparkles }
const statusPill = (status) =>
    status === 'published'
        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
        : status === 'archived'
            ? 'bg-surface-200 text-surface-600 dark:bg-surface-700 dark:text-surface-300'
            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'

/* ===========================================================================
 * Content list for the selected topic
 * ========================================================================= */
const ContentSection = ({ topic, subjectId, openModal, askDelete }) => {
    const { data: contents = [], isLoading } = useQuery({
        queryKey: ['cb-contents', topic.id],
        queryFn: () => svc.getContents(topic.id),
    })

    const videos = contents.filter((ct) => ct.content_type === 'video')
    const reading = contents.filter((ct) => ct.content_type !== 'video')

    const ContentRow = ({ ct }) => {
        const Icon = CONTENT_ICON[ct.content_type] || FileText
        return (
            <div className="group card p-3.5 flex items-center justify-between gap-3 hover:border-primary-200 dark:hover:border-primary-800 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-surface-800 dark:text-surface-100 truncate">{ct.title}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-100 dark:bg-surface-800 text-surface-500 capitalize">{ct.content_type}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded capitalize ${statusPill(ct.status)}`}>{ct.status}</span>
                        </div>
                    </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <RowActions
                        onEdit={() => openModal('content', ct, { topicId: topic.id, subjectId })}
                        onDelete={() => askDelete('content', ct, ct.title)}
                    />
                </div>
            </div>
        )
    }

    if (isLoading) {
        return <div className="py-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-surface-400" /></div>
    }

    return (
        <div className="space-y-6">
            {/* Reading material */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-surface-700 dark:text-surface-200">Reading material</h4>
                    <button
                        onClick={() => openModal('content', null, { topicId: topic.id, subjectId, defaults: { content_type: 'notes' } })}
                        className="btn-primary text-xs px-3 py-1.5"
                    >
                        <Plus className="w-3.5 h-3.5" /> Add material
                    </button>
                </div>
                {reading.length === 0 ? (
                    <EmptyHint icon={FileText} text="No notes or PDFs yet." sub="Add notes or upload a PDF for students to read." />
                ) : (
                    <div className="space-y-2">
                        {reading.map((ct) => <ContentRow key={ct.id} ct={ct} />)}
                    </div>
                )}
            </div>

            {/* Videos */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-surface-700 dark:text-surface-200">Videos</h4>
                    <button
                        onClick={() => openModal('content', null, { topicId: topic.id, subjectId, defaults: { content_type: 'video' } })}
                        className="btn-secondary text-xs px-3 py-1.5"
                    >
                        <Plus className="w-3.5 h-3.5" /> Add video
                    </button>
                </div>
                {videos.length === 0 ? (
                    <EmptyHint icon={Video} text="No videos yet." sub="Add a video by pasting its URL." />
                ) : (
                    <div className="space-y-2">
                        {videos.map((ct) => <ContentRow key={ct.id} ct={ct} />)}
                    </div>
                )}
            </div>
        </div>
    )
}

/* ===========================================================================
 * Questions inside one quiz
 * ========================================================================= */
const QuestionSection = ({ quiz, topicId, subjectId, askDelete }) => {
    const queryClient = useQueryClient()
    const [qModal, setQModal] = useState(null) // { instance } | null
    const { data: questions = [], isLoading } = useQuery({
        queryKey: ['cb-questions', quiz.id],
        queryFn: () => svc.getQuestions(quiz.id),
    })

    const saveMutation = useMutation({
        mutationFn: ({ instance, payload }) =>
            instance
                ? svc.updateQuestion(instance.id, payload)
                : svc.createQuestion({ ...payload, quiz: quiz.id, topic: topicId, subject: subjectId }),
        onSuccess: (_d, vars) => {
            toast.success(`Question ${vars.instance ? 'updated' : 'added'}`)
            queryClient.invalidateQueries({ queryKey: ['cb-questions', quiz.id] })
            queryClient.invalidateQueries({ queryKey: ['cb-quizzes', topicId] })
            setQModal(null)
        },
        onError: (err) => toast.error(formatApiError(err)),
    })

    return (
        <div className="mt-3 pl-3 border-l-2 border-surface-100 dark:border-surface-800 space-y-1.5">
            <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-surface-400">
                    {questions.length} question{questions.length === 1 ? '' : 's'}
                </span>
                <button onClick={() => setQModal({ instance: null })} className="text-xs font-semibold text-primary-600 hover:text-primary-700 inline-flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" /> Add question
                </button>
            </div>

            {isLoading ? (
                <div className="py-3 flex justify-center"><Loader2 className="w-4 h-4 animate-spin text-surface-400" /></div>
            ) : questions.length === 0 ? (
                <p className="text-xs text-surface-400 italic py-1">No questions yet.</p>
            ) : (
                questions.map((q, i) => (
                    <div key={q.id} className="group flex items-start justify-between gap-2 py-1.5">
                        <div className="flex items-start gap-2 min-w-0">
                            <span className="text-[11px] font-bold text-surface-400 mt-0.5 shrink-0">{i + 1}.</span>
                            <div className="min-w-0">
                                <p className="text-sm text-surface-700 dark:text-surface-200 line-clamp-2">{q.question_text}</p>
                                <span className="text-[10px] text-surface-400">{QTYPE_LABEL[q.question_type] || q.question_type} · {q.marks} marks</span>
                            </div>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <RowActions
                                onEdit={() => setQModal({ instance: q })}
                                onDelete={() => askDelete('question', q, 'this question')}
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
 * Quizzes for the selected topic
 * ========================================================================= */
const QuizSection = ({ topic, subjectId, openModal, askDelete }) => {
    const [expanded, setExpanded] = useState({})
    const { data: quizzes = [], isLoading } = useQuery({
        queryKey: ['cb-quizzes', topic.id],
        queryFn: () => svc.getQuizzes(topic.id),
    })

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-surface-700 dark:text-surface-200">Quizzes</h4>
                <button
                    onClick={() => openModal('quiz', null, { topicId: topic.id, subjectId })}
                    className="btn-primary text-xs px-3 py-1.5"
                >
                    <Plus className="w-3.5 h-3.5" /> Add quiz
                </button>
            </div>

            {isLoading ? (
                <div className="py-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-surface-400" /></div>
            ) : quizzes.length === 0 ? (
                <EmptyHint icon={ListChecks} text="No quizzes yet." sub="Create a quiz, then add questions to it." />
            ) : (
                <div className="space-y-2">
                    {quizzes.map((qz) => {
                        const open = !!expanded[qz.id]
                        return (
                            <div key={qz.id} className="card overflow-hidden">
                                <div className="flex items-center justify-between gap-3 p-3.5">
                                    <button onClick={() => setExpanded((p) => ({ ...p, [qz.id]: !p[qz.id] }))} className="flex items-center gap-2.5 min-w-0 text-left flex-1">
                                        {open ? <ChevronDown className="w-4 h-4 text-surface-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-surface-400 shrink-0" />}
                                        <div className="w-9 h-9 rounded-xl bg-accent-50 dark:bg-accent-900/20 text-accent-600 dark:text-accent-400 flex items-center justify-center shrink-0">
                                            <ListChecks className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-surface-800 dark:text-surface-100 truncate">{qz.title}</p>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded capitalize ${statusPill(qz.status)}`}>{qz.status}</span>
                                                <span className="text-[10px] text-surface-400">{qz.duration_minutes} min</span>
                                            </div>
                                        </div>
                                    </button>
                                    <div className="opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity">
                                        <RowActions
                                            onEdit={() => openModal('quiz', qz, { topicId: topic.id, subjectId })}
                                            onDelete={() => askDelete('quiz', qz, qz.title)}
                                        />
                                    </div>
                                </div>
                                <AnimatePresence>
                                    {open && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-4 pb-4">
                                            <QuestionSection quiz={qz} topicId={topic.id} subjectId={subjectId} askDelete={askDelete} />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

/* ===========================================================================
 * Topic list inside a chapter (in the left navigator)
 * ========================================================================= */
const TopicList = ({ chapter, subjectId, sel, onSelectTopic, openModal, askDelete }) => {
    const { data: topics = [], isLoading } = useQuery({
        queryKey: ['cb-topics', chapter.id],
        queryFn: () => svc.getTopics({ chapterId: chapter.id }),
    })

    return (
        <div className="pl-4 py-1 space-y-0.5">
            {isLoading ? (
                <div className="py-2 flex justify-center"><Loader2 className="w-3.5 h-3.5 animate-spin text-surface-400" /></div>
            ) : topics.length === 0 ? (
                <p className="text-[11px] text-surface-400 italic px-2 py-1">No topics yet</p>
            ) : (
                topics.map((tp) => {
                    const active = sel.topicId === tp.id
                    return (
                        <div
                            key={tp.id}
                            className={`group flex items-center justify-between gap-1 pl-2 pr-1 py-1.5 rounded-lg cursor-pointer transition-colors ${active ? 'bg-primary-50 dark:bg-primary-900/25 text-primary-700 dark:text-primary-300' : 'hover:bg-surface-100 dark:hover:bg-surface-800'}`}
                            onClick={() => onSelectTopic(tp, subjectId, chapter.id)}
                        >
                            <span className="flex items-center gap-1.5 min-w-0 text-sm">
                                <FileText className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-primary-500' : 'text-surface-400'}`} />
                                <span className="truncate">{tp.name}</span>
                            </span>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <RowActions
                                    onEdit={() => openModal('topic', tp, { subjectId, chapterId: chapter.id })}
                                    onDelete={() => askDelete('topic', tp, tp.name)}
                                />
                            </div>
                        </div>
                    )
                })
            )}
            <button
                onClick={() => openModal('topic', null, { subjectId, chapterId: chapter.id })}
                className="ml-2 mt-0.5 text-[11px] font-semibold text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
            >
                <Plus className="w-3 h-3" /> Add topic
            </button>
        </div>
    )
}

/* ===========================================================================
 * Chapter list inside a subject (in the left navigator)
 * ========================================================================= */
const ChapterList = ({ subject, sel, onSelectTopic, openModal, askDelete }) => {
    const [open, setOpen] = useState({})
    const { data: chapters = [], isLoading } = useQuery({
        queryKey: ['cb-chapters', subject.id],
        queryFn: () => svc.getChapters(subject.id),
    })

    return (
        <div className="pl-4 py-1 space-y-0.5">
            {isLoading ? (
                <div className="py-2 flex justify-center"><Loader2 className="w-3.5 h-3.5 animate-spin text-surface-400" /></div>
            ) : chapters.length === 0 ? (
                <p className="text-[11px] text-surface-400 italic px-2 py-1">No chapters yet</p>
            ) : (
                chapters.map((ch) => (
                    <div key={ch.id}>
                        <div className="group flex items-center justify-between gap-1 pl-1 pr-1 py-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
                            <button onClick={() => setOpen((p) => ({ ...p, [ch.id]: !p[ch.id] }))} className="flex items-center gap-1.5 min-w-0 text-sm text-left flex-1">
                                {open[ch.id] ? <ChevronDown className="w-3.5 h-3.5 text-surface-400 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-surface-400 shrink-0" />}
                                <Book className="w-3.5 h-3.5 text-surface-400 shrink-0" />
                                <span className="truncate font-medium">{ch.name}</span>
                            </button>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <RowActions
                                    onEdit={() => openModal('chapter', ch, { subjectId: subject.id })}
                                    onDelete={() => askDelete('chapter', ch, ch.name)}
                                />
                            </div>
                        </div>
                        <AnimatePresence>
                            {open[ch.id] && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                    <TopicList chapter={ch} subjectId={subject.id} sel={sel} onSelectTopic={onSelectTopic} openModal={openModal} askDelete={askDelete} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))
            )}
            <button
                onClick={() => openModal('chapter', null, { subjectId: subject.id })}
                className="ml-1 mt-0.5 text-[11px] font-semibold text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
            >
                <Plus className="w-3 h-3" /> Add chapter
            </button>
        </div>
    )
}

/* ===========================================================================
 * Left navigator: Subjects → Chapters → Topics
 * ========================================================================= */
const Navigator = ({ courseId, sel, onSelectTopic, openModal, askDelete }) => {
    const [open, setOpen] = useState({})
    const { data: subjects = [], isLoading } = useQuery({
        queryKey: ['cb-subjects', courseId],
        queryFn: () => svc.getSubjects(courseId),
    })

    return (
        <div className="card p-3 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
            <div className="flex items-center justify-between px-1 mb-2">
                <h3 className="text-xs font-black uppercase tracking-widest text-surface-400">Subjects</h3>
                <button
                    onClick={() => openModal('subject', null, {})}
                    className="text-xs font-semibold text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
                >
                    <Plus className="w-3.5 h-3.5" /> Add
                </button>
            </div>

            {isLoading ? (
                <div className="py-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-surface-400" /></div>
            ) : subjects.length === 0 ? (
                <EmptyHint icon={Layers} text="No subjects yet." sub="Start by adding a subject." />
            ) : (
                <div className="space-y-0.5">
                    {subjects.map((sub) => (
                        <div key={sub.id}>
                            <div className="group flex items-center justify-between gap-1 px-1 py-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
                                <button onClick={() => setOpen((p) => ({ ...p, [sub.id]: !p[sub.id] }))} className="flex items-center gap-2 min-w-0 text-left flex-1">
                                    {open[sub.id] ? <ChevronDown className="w-4 h-4 text-surface-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-surface-400 shrink-0" />}
                                    <span className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${sub.color || '#10B981'}22` }}>
                                        <Layers className="w-3.5 h-3.5" style={{ color: sub.color || '#10B981' }} />
                                    </span>
                                    <span className="truncate font-semibold text-sm">{sub.name}</span>
                                </button>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <RowActions
                                        onEdit={() => openModal('subject', sub, {})}
                                        onDelete={() => askDelete('subject', sub, sub.name)}
                                    />
                                </div>
                            </div>
                            <AnimatePresence>
                                {open[sub.id] && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                        <ChapterList subject={sub} sel={sel} onSelectTopic={onSelectTopic} openModal={openModal} askDelete={askDelete} />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

const EmptyHint = ({ icon: Icon, text, sub }) => (
    <div className="py-8 px-4 text-center">
        <Icon className="w-8 h-8 mx-auto mb-2 text-surface-300 dark:text-surface-600" />
        <p className="text-sm font-medium text-surface-500">{text}</p>
        {sub && <p className="text-xs text-surface-400 mt-0.5">{sub}</p>}
    </div>
)

/* ===========================================================================
 * Main panel: content + quizzes for the selected topic
 * ========================================================================= */
/* ===========================================================================
 * Assignments for the selected topic + submissions review drawer
 * ========================================================================= */
const SUBMISSION_TYPE_LABEL = { text: 'Text answer', pdf: 'PDF upload', either: 'Text or PDF' }

const SubmissionsDrawer = ({ assignment, onClose }) => {
    const queryClient = useQueryClient()
    const { data, isLoading } = useQuery({
        queryKey: ['cb-submissions', assignment.id],
        queryFn: () => svc.getAssignmentSubmissions(assignment.id),
    })
    const [grading, setGrading] = useState({})   // subId -> { marks, feedback }

    const gradeMutation = useMutation({
        mutationFn: ({ id, payload }) => svc.gradeSubmission(id, payload),
        onSuccess: () => {
            toast.success('Grade saved')
            queryClient.invalidateQueries({ queryKey: ['cb-submissions', assignment.id] })
        },
        onError: (err) => toast.error(formatApiError(err)),
    })

    const counts = data?.counts || { enrolled: 0, submitted: 0, pending: 0, graded: 0 }

    return (
        <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
            {...{ initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }}
            onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
            <motion.div
                className="card w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
                initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
            >
                <div className="flex items-center justify-between p-5 border-b border-surface-200 dark:border-surface-800">
                    <div className="min-w-0">
                        <h3 className="text-lg font-bold truncate">{assignment.title}</h3>
                        <p className="text-xs text-surface-500">Submissions</p>
                    </div>
                    <button onClick={onClose} className="btn-icon"><X className="w-5 h-5" /></button>
                </div>

                {/* Counters */}
                <div className="grid grid-cols-4 gap-2 p-4 border-b border-surface-100 dark:border-surface-800 text-center">
                    {[
                        { label: 'Enrolled', value: counts.enrolled },
                        { label: 'Submitted', value: counts.submitted },
                        { label: 'Pending', value: counts.pending },
                        { label: 'Graded', value: counts.graded },
                    ].map((s) => (
                        <div key={s.label} className="rounded-xl bg-surface-50 dark:bg-surface-800 py-2">
                            <div className="text-xl font-bold text-surface-800 dark:text-surface-100">{s.value}</div>
                            <div className="text-[11px] text-surface-500">{s.label}</div>
                        </div>
                    ))}
                </div>

                <div className="p-5 overflow-y-auto space-y-5">
                    {isLoading ? (
                        <div className="py-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-surface-400" /></div>
                    ) : (
                        <>
                            {/* Submitted */}
                            <div className="space-y-2">
                                <h4 className="text-sm font-bold flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-success-500" /> Submitted ({data?.submitted?.length || 0})</h4>
                                {(data?.submitted || []).length === 0 ? (
                                    <p className="text-xs text-surface-400">No submissions yet.</p>
                                ) : data.submitted.map((s) => {
                                    const g = grading[s.id] || { marks: s.marks ?? '', feedback: s.feedback ?? '' }
                                    return (
                                        <div key={s.id} className="card p-3.5 space-y-2">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold truncate">{s.student_name || s.student_email}</p>
                                                    <p className="text-[11px] text-surface-400">{new Date(s.submitted_at).toLocaleString()}{s.status === 'graded' && <span className="ml-2 text-success-600 font-medium">• Graded</span>}</p>
                                                </div>
                                                {s.file_url && (
                                                    <a href={s.file_url} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs px-2.5 py-1 shrink-0">View PDF</a>
                                                )}
                                            </div>
                                            {s.submission_text && (
                                                <div className="text-xs text-surface-600 dark:text-surface-300 bg-surface-50 dark:bg-surface-800 rounded-lg p-2 max-h-32 overflow-y-auto whitespace-pre-wrap">{s.submission_text}</div>
                                            )}
                                            <div className="flex items-end gap-2">
                                                <div className="w-24">
                                                    <label className="block text-[10px] font-semibold text-surface-500 mb-1">Marks{assignment.max_marks ? ` / ${assignment.max_marks}` : ''}</label>
                                                    <input type="number" className="input py-1.5 text-sm" value={g.marks}
                                                        onChange={(e) => setGrading((p) => ({ ...p, [s.id]: { ...g, marks: e.target.value } }))} />
                                                </div>
                                                <div className="flex-1">
                                                    <label className="block text-[10px] font-semibold text-surface-500 mb-1">Feedback (student sees this)</label>
                                                    <input type="text" className="input py-1.5 text-sm" value={g.feedback}
                                                        onChange={(e) => setGrading((p) => ({ ...p, [s.id]: { ...g, feedback: e.target.value } }))} />
                                                </div>
                                                <button
                                                    onClick={() => gradeMutation.mutate({ id: s.id, payload: { marks: g.marks === '' ? null : Number(g.marks), feedback: g.feedback } })}
                                                    disabled={gradeMutation.isPending}
                                                    className="btn-primary text-xs px-3 py-2 shrink-0"
                                                >
                                                    <Save className="w-3.5 h-3.5" /> Save
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Pending */}
                            <div className="space-y-2">
                                <h4 className="text-sm font-bold flex items-center gap-1.5"><Users className="w-4 h-4 text-surface-400" /> Yet to submit ({data?.pending?.length || 0})</h4>
                                {(data?.pending || []).length === 0 ? (
                                    <p className="text-xs text-surface-400">Everyone enrolled has submitted. 🎉</p>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {data.pending.map((p) => (
                                            <span key={p.student} className="text-xs px-2.5 py-1 rounded-full bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300">
                                                {p.student_name || p.student_email}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </motion.div>
        </motion.div>
    )
}

const AssignmentSection = ({ topic, subjectId, openModal, askDelete }) => {
    const { data: assignments = [], isLoading } = useQuery({
        queryKey: ['cb-assignments', topic.id],
        queryFn: () => svc.getAssignments(topic.id),
    })
    const [viewing, setViewing] = useState(null)

    if (isLoading) {
        return <div className="py-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-surface-400" /></div>
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-surface-700 dark:text-surface-200">Assignments</h4>
                <button
                    onClick={() => openModal('assignment', null, { topicId: topic.id, subjectId })}
                    className="btn-primary text-xs px-3 py-1.5"
                >
                    <Plus className="w-3.5 h-3.5" /> Add assignment
                </button>
            </div>
            {assignments.length === 0 ? (
                <EmptyHint icon={ClipboardList} text="No assignments yet." sub="Create a timed or timeless assignment for students to submit." />
            ) : (
                <div className="space-y-2">
                    {assignments.map((a) => (
                        <div key={a.id} className="group card p-3.5 flex items-center justify-between gap-3 hover:border-primary-200 dark:hover:border-primary-800 transition-colors">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                                    <ClipboardList className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-surface-800 dark:text-surface-100 truncate">{a.title}</p>
                                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-100 dark:bg-surface-800 text-surface-500">{SUBMISSION_TYPE_LABEL[a.submission_type] || a.submission_type}</span>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded capitalize ${statusPill(a.status)}`}>{a.status}</span>
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-100 dark:bg-surface-800 text-surface-500 inline-flex items-center gap-1">
                                            <Clock className="w-2.5 h-2.5" />
                                            {a.is_timed && a.due_at ? `Due ${new Date(a.due_at).toLocaleDateString()}` : 'No deadline'}
                                        </span>
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary-50 dark:bg-primary-900/20 text-primary-600">{a.submissions_count || 0} submitted</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <button onClick={() => setViewing(a)} className="btn-secondary text-xs px-2.5 py-1.5">
                                    <Users className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Submissions</span>
                                </button>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <RowActions
                                        onEdit={() => openModal('assignment', a, { topicId: topic.id, subjectId })}
                                        onDelete={() => askDelete('assignment', a, a.title)}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <AnimatePresence>
                {viewing && <SubmissionsDrawer assignment={viewing} onClose={() => setViewing(null)} />}
            </AnimatePresence>
        </div>
    )
}

const TopicPanel = ({ topic, subjectId, openModal, askDelete }) => {
    const [tab, setTab] = useState('content')
    return (
        <div className="card p-4 sm:p-6">
            <div className="flex items-start justify-between gap-3 mb-1">
                <div className="min-w-0">
                    <h2 className="text-xl font-display font-bold truncate">{topic.name}</h2>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        {topic.difficulty && <span className="text-[11px] px-2 py-0.5 rounded-md bg-surface-100 dark:bg-surface-800 text-surface-500 capitalize">{topic.difficulty}</span>}
                        {topic.importance && <span className="text-[11px] px-2 py-0.5 rounded-md bg-surface-100 dark:bg-surface-800 text-surface-500 capitalize">{topic.importance} importance</span>}
                    </div>
                </div>
                <button onClick={() => openModal('topic', topic, { subjectId })} className="btn-secondary text-xs px-3 py-1.5 shrink-0">
                    <Pencil className="w-3.5 h-3.5" /> Edit topic
                </button>
            </div>

            <div className="flex gap-1 p-1 bg-surface-100 dark:bg-surface-800 rounded-xl w-fit my-4">
                {[{ id: 'content', label: 'Content', icon: FileText }, { id: 'quizzes', label: 'Quizzes', icon: ListChecks }, { id: 'assignments', label: 'Assignments', icon: ClipboardList }].map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`px-4 py-1.5 rounded-lg text-sm font-semibold inline-flex items-center gap-1.5 transition-all ${tab === t.id ? 'bg-white dark:bg-surface-700 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'}`}
                    >
                        <t.icon className="w-3.5 h-3.5" /> {t.label}
                    </button>
                ))}
            </div>

            {tab === 'content' && <ContentSection topic={topic} subjectId={subjectId} openModal={openModal} askDelete={askDelete} />}
            {tab === 'quizzes' && <QuizSection topic={topic} subjectId={subjectId} openModal={openModal} askDelete={askDelete} />}
            {tab === 'assignments' && <AssignmentSection topic={topic} subjectId={subjectId} openModal={openModal} askDelete={askDelete} />}
        </div>
    )
}

/* ===========================================================================
 * Root page
 * ========================================================================= */
const InstructorsModal = ({ course, onClose, onSaved }) => {
    const { data: instructors = [], isLoading } = useQuery({
        queryKey: ['cb-instructors'],
        queryFn: () => svc.getInstructors(),
    })
    const [selected, setSelected] = useState(() => new Set((course.instructors_detail || []).map((i) => String(i.id))))

    const saveMutation = useMutation({
        mutationFn: () => svc.updateExam(course.id, { instructors: Array.from(selected) }),
        onSuccess: () => {
            toast.success('Instructors updated')
            onSaved?.()
            onClose()
        },
        onError: (err) => toast.error(formatApiError(err)),
    })

    const toggle = (id) => setSelected((prev) => {
        const next = new Set(prev)
        next.has(id) ? next.delete(id) : next.add(id)
        return next
    })

    return (
        <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
            <motion.div
                className="card w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col"
                initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
            >
                <div className="flex items-center justify-between p-5 border-b border-surface-200 dark:border-surface-800">
                    <div className="min-w-0">
                        <h3 className="text-lg font-bold truncate">Assign instructors</h3>
                        <p className="text-xs text-surface-500">Instructors can edit this course's content but can't manage instructors.</p>
                    </div>
                    <button onClick={onClose} className="btn-icon"><X className="w-5 h-5" /></button>
                </div>

                <div className="p-5 overflow-y-auto space-y-2">
                    {isLoading ? (
                        <div className="py-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-surface-400" /></div>
                    ) : instructors.length === 0 ? (
                        <div className="text-center py-8 text-surface-500 text-sm">
                            <Users className="w-8 h-8 mx-auto mb-2 text-surface-300" />
                            <p>No instructors yet.</p>
                            <p className="text-xs mt-1">Set a user's role to "Instructor" in the admin dashboard first.</p>
                        </div>
                    ) : (
                        instructors.map((ins) => {
                            const id = String(ins.id)
                            const checked = selected.has(id)
                            return (
                                <label
                                    key={id}
                                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${checked ? 'border-primary-300 bg-primary-50/50 dark:bg-primary-900/20' : 'border-surface-200 dark:border-surface-700 hover:border-surface-300'}`}
                                >
                                    <input type="checkbox" checked={checked} onChange={() => toggle(id)} className="accent-primary-600 w-4 h-4" />
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold truncate">{ins.name}</p>
                                        <p className="text-xs text-surface-400 truncate">{ins.email}</p>
                                    </div>
                                    {checked && <CheckCircle2 className="w-4 h-4 text-primary-500 ml-auto shrink-0" />}
                                </label>
                            )
                        })
                    )}
                </div>

                <div className="flex justify-end gap-2 p-4 border-t border-surface-200 dark:border-surface-800">
                    <button onClick={onClose} className="btn-secondary text-sm px-4 py-2">Cancel</button>
                    <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="btn-primary text-sm px-4 py-2 inline-flex items-center gap-2">
                        {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                    </button>
                </div>
            </motion.div>
        </motion.div>
    )
}

const CourseManager = () => {
    const { courseId } = useParams()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const { user, profile } = useAuthStore()
    const isAdmin = (user?.role || profile?.user?.role) === 'admin'

    const [sel, setSel] = useState({ subjectId: null, chapterId: null, topicId: null, topic: null })
    const [modal, setModal] = useState(null)   // { type, instance, extra }
    const [del, setDel] = useState(null)        // { type, instance, label }
    const [instructorsOpen, setInstructorsOpen] = useState(false)

    const { data: courses = [], isLoading } = useQuery({
        queryKey: ['cb-courses'],
        queryFn: () => svc.getExams(),
    })
    const course = courses.find((c) => String(c.id) === String(courseId))

    const onSelectTopic = (topic, subjectId, chapterId) => setSel({ subjectId, chapterId, topicId: topic.id, topic })
    const openModal = (type, instance, extra = {}) => setModal({ type, instance, extra })
    const askDelete = (type, instance, label) => setDel({ type, instance, label })

    /* invalidate the right queries after a change */
    const invalidateFor = (type, extra = {}) => {
        const q = queryClient
        if (type === 'exam') q.invalidateQueries({ queryKey: ['cb-courses'] })
        if (type === 'subject') q.invalidateQueries({ queryKey: ['cb-subjects', courseId] })
        if (type === 'chapter') q.invalidateQueries({ queryKey: ['cb-chapters', extra.subjectId] })
        if (type === 'topic') q.invalidateQueries({ queryKey: ['cb-topics', extra.chapterId] })
        if (type === 'content') q.invalidateQueries({ queryKey: ['cb-contents', extra.topicId] })
        if (type === 'quiz') q.invalidateQueries({ queryKey: ['cb-quizzes', extra.topicId] })
        if (type === 'assignment') q.invalidateQueries({ queryKey: ['cb-assignments', extra.topicId] })
    }

    const saveMutation = useMutation({
        mutationFn: ({ type, instance, payload, extra }) => {
            const withParents = { ...payload }
            if (type === 'subject') withParents.course = courseId
            if (type === 'chapter') withParents.subject = extra.subjectId
            if (type === 'topic') { withParents.subject = extra.subjectId; if (extra.chapterId) withParents.chapter = extra.chapterId }
            if (type === 'content') { withParents.topic = extra.topicId; withParents.subject = extra.subjectId }
            if (type === 'quiz') withParents.topic = extra.topicId
            if (type === 'assignment') { withParents.topic = extra.topicId; withParents.subject = extra.subjectId; withParents.course = courseId }
            const map = {
                exam: [svc.updateExam, svc.createExam],
                subject: [svc.updateSubject, svc.createSubject],
                chapter: [svc.updateChapter, svc.createChapter],
                topic: [svc.updateTopic, svc.createTopic],
                content: [svc.updateContent, svc.createContent],
                quiz: [svc.updateQuiz, svc.createQuiz],
                assignment: [svc.updateAssignment, svc.createAssignment],
            }
            const [update, create] = map[type]
            return instance ? update(instance.id, withParents) : create(withParents)
        },
        onSuccess: (_d, vars) => {
            toast.success(`${vars.type === 'exam' ? 'Course' : vars.type[0].toUpperCase() + vars.type.slice(1)} ${vars.instance ? 'saved' : 'created'}`)
            invalidateFor(vars.type, vars.extra)
            setModal(null)
        },
        onError: (err) => toast.error(formatApiError(err)),
    })

    const deleteMutation = useMutation({
        mutationFn: ({ type, instance }) => {
            const map = { subject: svc.deleteSubject, chapter: svc.deleteChapter, topic: svc.deleteTopic, content: svc.deleteContent, quiz: svc.deleteQuiz, question: svc.deleteQuestion, assignment: svc.deleteAssignment }
            return map[type](instance.id)
        },
        onSuccess: (_d, vars) => {
            toast.success('Deleted')
            // broad invalidation covering the affected level
            queryClient.invalidateQueries({ queryKey: ['cb-subjects', courseId] })
            queryClient.invalidateQueries({ predicate: (query) => ['cb-chapters', 'cb-topics', 'cb-contents', 'cb-quizzes', 'cb-questions', 'cb-assignments'].includes(query.queryKey[0]) })
            if (vars.type === 'topic' && sel.topicId === vars.instance.id) setSel({ subjectId: null, chapterId: null, topicId: null, topic: null })
            setDel(null)
        },
        onError: (err) => toast.error(formatApiError(err)),
    })

    if (isLoading) return <Loading fullScreen />

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button onClick={() => navigate('/courses')} className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors" aria-label="Back to courses">
                    <ArrowLeft size={20} />
                </button>
                <span className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0" style={{ backgroundColor: course?.color || '#f97316' }}>
                    <GraduationCap size={18} />
                </span>
                <div className="min-w-0 flex-1">
                    <h1 className="text-xl sm:text-2xl font-display font-bold truncate">{course?.name || 'Course'}</h1>
                    <p className="text-xs sm:text-sm text-surface-500">Manage subjects, chapters, topics, content & quizzes</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {course && isAdmin && (
                        <button onClick={() => setInstructorsOpen(true)} className="btn-secondary text-xs px-3 py-1.5 hidden sm:inline-flex">
                            <Users className="w-3.5 h-3.5" /> Instructors
                        </button>
                    )}
                    {course && (
                        <button onClick={() => openModal('exam', course, {})} className="btn-secondary text-xs px-3 py-1.5 hidden sm:inline-flex">
                            <Pencil className="w-3.5 h-3.5" /> Edit course
                        </button>
                    )}
                    <button onClick={() => navigate(`/study/course/${courseId}`)} className="btn-secondary text-xs px-3 py-1.5">
                        <Eye className="w-3.5 h-3.5" /> <span className="hidden sm:inline">View as student</span>
                    </button>
                </div>
            </div>

            {/* Body: navigator + panel */}
            <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-5 items-start">
                <Navigator courseId={courseId} sel={sel} onSelectTopic={onSelectTopic} openModal={openModal} askDelete={askDelete} />

                {sel.topic ? (
                    <TopicPanel topic={sel.topic} subjectId={sel.subjectId} openModal={openModal} askDelete={askDelete} />
                ) : (
                    <div className="card p-10 flex flex-col items-center justify-center text-center min-h-[300px]">
                        <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mb-3">
                            <HelpCircle className="w-7 h-7 text-primary-500" />
                        </div>
                        <h3 className="font-semibold text-surface-700 dark:text-surface-200">Select a topic to start editing</h3>
                        <p className="text-sm text-surface-500 mt-1 max-w-sm">
                            Expand a subject and chapter on the left, then pick a topic to add notes, videos, PDFs and quizzes — all in one focused place.
                        </p>
                    </div>
                )}
            </div>

            {/* Modals */}
            <AnimatePresence>
                {instructorsOpen && course && (
                    <InstructorsModal course={course} onClose={() => setInstructorsOpen(false)} onSaved={() => queryClient.invalidateQueries({ queryKey: ['cb-courses'] })} />
                )}
                {modal && (
                    <EntityModal
                        type={modal.type}
                        instance={modal.instance}
                        defaults={modal.extra?.defaults}
                        saving={saveMutation.isPending}
                        onClose={() => setModal(null)}
                        onSubmit={(payload) => saveMutation.mutate({ type: modal.type, instance: modal.instance, payload, extra: modal.extra })}
                    />
                )}
                {del && (
                    <ConfirmDialog
                        label={del.label}
                        deleting={deleteMutation.isPending}
                        onCancel={() => setDel(null)}
                        onConfirm={() => deleteMutation.mutate({ type: del.type, instance: del.instance })}
                    />
                )}
            </AnimatePresence>
        </div>
    )
}

export default CourseManager
