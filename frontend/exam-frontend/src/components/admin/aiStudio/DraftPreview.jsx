import { useMemo, useState } from 'react'
import {
    AlertTriangle, BookOpen, ChevronDown, ChevronRight, ClipboardList, Code2, FileText,
    HelpCircle, Layers, ListChecks, Sparkles,
} from 'lucide-react'
import { CheckRow, Pill, inputClass } from './studioParts'

/* ===========================================================================
 * DraftPreview — the review surface.
 *
 * Everything here is read-and-edit only: nothing on this screen touches the
 * database. The admin ticks what they want, optionally edits the wording, and
 * only the explicit "Save to course" action in the parent writes anything.
 * ========================================================================= */

const Section = ({ children, className = '' }) => (
    <div className={`rounded-xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-800/60 ${className}`}>
        {children}
    </div>
)

/* ------------------------------------------------------------------ outline */

const OutlinePreview = ({ draft, selection, onToggle, onEdit, editable }) => {
    const [open, setOpen] = useState(() => new Set((draft.subjects || []).map((s) => s.code)))

    const toggleOpen = (code) => setOpen((prev) => {
        const next = new Set(prev)
        if (next.has(code)) next.delete(code)
        else next.add(code)
        return next
    })

    const course = draft.course || {}

    return (
        <div className="space-y-4">
            <Section className="p-4">
                <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300">
                        <BookOpen className="h-4.5 w-4.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                        {editable ? (
                            <input
                                className={`${inputClass} font-semibold`}
                                value={course.name || ''}
                                onChange={(e) => onEdit(['course', 'name'], e.target.value)}
                            />
                        ) : (
                            <h3 className="font-semibold text-surface-900 dark:text-surface-100">{course.name}</h3>
                        )}
                        <p className="mt-1 text-xs text-surface-500">
                            Code <code className="rounded bg-surface-100 px-1 dark:bg-surface-700">{course.code}</code>
                            {course.level ? ` · ${course.level}` : ''}
                            {course.estimated_hours ? ` · ~${course.estimated_hours}h` : ''}
                        </p>
                        {course.description && (
                            <p className="mt-2 text-sm text-surface-600 dark:text-surface-300">{course.description}</p>
                        )}
                    </div>
                </div>
            </Section>

            {(draft.subjects || []).map((subject) => {
                const isOpen = open.has(subject.code)
                return (
                    <Section key={subject.code}>
                        <div className="flex items-center gap-2 border-b border-surface-100 px-4 py-3 dark:border-surface-700">
                            <CheckRow
                                checked={selection.subjects.has(subject.code)}
                                onChange={(checked) => onToggle('subjects', subject, checked)}
                            >
                                <span className="flex items-center gap-2">
                                    <Layers className="h-4 w-4 text-primary-500" />
                                    <span className="font-medium text-surface-900 dark:text-surface-100">{subject.name}</span>
                                    <Pill>{(subject.chapters || []).length} chapters</Pill>
                                </span>
                            </CheckRow>
                            <button
                                type="button"
                                onClick={() => toggleOpen(subject.code)}
                                className="ml-auto rounded p-1 text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700"
                            >
                                {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </button>
                        </div>

                        {isOpen && (
                            <div className="divide-y divide-surface-100 dark:divide-surface-700">
                                {(subject.chapters || []).map((chapter) => (
                                    <div key={chapter.code} className="px-4 py-3">
                                        <CheckRow
                                            checked={selection.chapters.has(chapter.code)}
                                            onChange={(checked) => onToggle('chapters', chapter, checked)}
                                        >
                                            <span className="text-sm font-medium text-surface-800 dark:text-surface-200">
                                                {chapter.name}
                                            </span>
                                            {chapter.description && (
                                                <span className="mt-0.5 block text-xs text-surface-500">{chapter.description}</span>
                                            )}
                                        </CheckRow>

                                        <ul className="ml-6 mt-2 space-y-1.5">
                                            {(chapter.topics || []).map((topic) => (
                                                <li key={topic.code}>
                                                    <CheckRow
                                                        checked={selection.topics.has(topic.code)}
                                                        onChange={(checked) => onToggle('topics', topic, checked)}
                                                    >
                                                        <span className="flex flex-wrap items-center gap-2">
                                                            <span className="text-sm text-surface-700 dark:text-surface-300">{topic.name}</span>
                                                            <Pill tone={topic.difficulty === 'hard' ? 'amber' : 'surface'}>
                                                                {topic.difficulty}
                                                            </Pill>
                                                        </span>
                                                        {topic.summary && (
                                                            <span className="mt-0.5 block text-xs text-surface-500">{topic.summary}</span>
                                                        )}
                                                    </CheckRow>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Section>
                )
            })}
        </div>
    )
}

/* ------------------------------------------------------------------ content */

const QuestionCard = ({ question, index }) => (
    <li className="rounded-lg border border-surface-200 p-3 dark:border-surface-700">
        <p className="text-sm font-medium text-surface-900 dark:text-surface-100">
            {index + 1}. {question.question_text}
        </p>
        <ul className="mt-2 space-y-1">
            {(question.options || []).map((option, i) => (
                <li
                    key={i}
                    className={`flex items-start gap-2 rounded px-2 py-1 text-sm ${
                        i === question.correct_option
                            ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300'
                            : 'text-surface-600 dark:text-surface-300'
                    }`}
                >
                    <span className="font-mono text-xs opacity-60">{String.fromCharCode(65 + i)}</span>
                    <span>{option}</span>
                </li>
            ))}
        </ul>
        {question.explanation && (
            <p className="mt-2 border-l-2 border-primary-300 pl-2 text-xs text-surface-500 dark:text-surface-400">
                {question.explanation}
            </p>
        )}
    </li>
)

const SUBMISSION_LABELS = {
    text: 'Text answer',
    pdf: 'File upload',
    either: 'Text or file',
}

const AssignmentCard = ({ assignment }) => (
    <div className="rounded-lg border border-surface-200 p-3 dark:border-surface-700">
        <div className="flex flex-wrap items-center gap-2">
            <h5 className="text-sm font-semibold text-surface-900 dark:text-surface-100">{assignment.title}</h5>
            <Pill tone="surface">{SUBMISSION_LABELS[assignment.submission_type] || assignment.submission_type}</Pill>
            {assignment.max_marks ? <Pill tone="surface">{assignment.max_marks} marks</Pill> : null}
        </div>
        <div
            className="prose prose-sm mt-2 max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: assignment.html || '' }}
        />
    </div>
)

const CodingCard = ({ problem }) => {
    const cases = problem.test_cases || []
    const samples = cases.filter((c) => c.is_sample)
    return (
        <div className="rounded-lg border border-surface-200 p-3 dark:border-surface-700">
            <div className="flex flex-wrap items-center gap-2">
                <h5 className="text-sm font-semibold text-surface-900 dark:text-surface-100">{problem.title}</h5>
                <Pill tone={problem.difficulty === 'hard' ? 'amber' : 'surface'}>{problem.difficulty}</Pill>
                <Pill tone="surface">{(problem.allowed_languages || []).join(', ')}</Pill>
                <Pill tone="emerald">{cases.length} test cases ({samples.length} sample)</Pill>
            </div>
            <div
                className="prose prose-sm mt-2 max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: problem.html || '' }}
            />
            {cases.length > 0 && (
                <div className="mt-3 space-y-1.5">
                    {cases.map((testCase, index) => (
                        <div key={index} className="rounded-md bg-surface-50 p-2 text-xs dark:bg-surface-900/40">
                            <div className="mb-1 flex items-center gap-2">
                                <span className="font-medium text-surface-600 dark:text-surface-300">
                                    Case {index + 1}
                                </span>
                                <Pill tone={testCase.is_sample ? 'primary' : 'surface'}>
                                    {testCase.is_sample ? 'sample' : 'hidden'}
                                </Pill>
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2">
                                <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-[11px] text-surface-600 dark:text-surface-300">
                                    in: {testCase.stdin || '(none)'}
                                </pre>
                                <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-[11px] text-surface-600 dark:text-surface-300">
                                    out: {testCase.expected_output}
                                </pre>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

const ContentTopicCard = ({ entry, checked, onToggle }) => {
    const note = entry.note || {}
    const quiz = entry.quiz || {}
    const questions = quiz.questions || []
    const assignments = entry.assignments || []
    const codingProblems = entry.coding_problems || []

    // Only offer tabs for material this draft actually contains — a focused
    // "just a quiz" run should not show three empty tabs.
    const tabs = useMemo(() => [
        note.include && { id: 'note', label: 'Reading notes' },
        quiz.include && { id: 'quiz', label: `Quiz (${questions.length})` },
        assignments.length && { id: 'assignments', label: `Assignments (${assignments.length})` },
        codingProblems.length && { id: 'coding', label: `Coding (${codingProblems.length})` },
    ].filter(Boolean), [note.include, quiz.include, questions.length, assignments.length, codingProblems.length])

    const [tab, setTab] = useState(() => tabs[0]?.id || 'note')
    const activeTab = tabs.some((t) => t.id === tab) ? tab : tabs[0]?.id

    return (
        <Section>
            <div className="flex flex-wrap items-center gap-2 border-b border-surface-100 px-4 py-3 dark:border-surface-700">
                <CheckRow checked={checked} onChange={onToggle}>
                    <span className="font-medium text-surface-900 dark:text-surface-100">{entry.topic_name}</span>
                </CheckRow>
                <div className="ml-auto flex flex-wrap items-center gap-1.5">
                    {note.include && <Pill tone="primary"><FileText className="h-3 w-3" />{note.estimated_time_minutes || 0} min read</Pill>}
                    {quiz.include && <Pill tone="emerald"><ListChecks className="h-3 w-3" />{questions.length} questions</Pill>}
                    {assignments.length > 0 && <Pill tone="surface"><ClipboardList className="h-3 w-3" />{assignments.length} assignment{assignments.length > 1 ? 's' : ''}</Pill>}
                    {codingProblems.length > 0 && <Pill tone="surface"><Code2 className="h-3 w-3" />{codingProblems.length} problem{codingProblems.length > 1 ? 's' : ''}</Pill>}
                </div>
            </div>

            <div className="flex flex-wrap gap-1 border-b border-surface-100 px-4 pt-2 dark:border-surface-700">
                {tabs.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        onClick={() => setTab(item.id)}
                        className={`rounded-t-md px-3 py-1.5 text-xs font-medium transition ${
                            activeTab === item.id
                                ? 'bg-surface-100 text-surface-900 dark:bg-surface-700 dark:text-surface-100'
                                : 'text-surface-500 hover:text-surface-700'
                        }`}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            <div className="max-h-[28rem] overflow-y-auto p-4">
                {activeTab === 'note' && note.include && (
                    <>
                        <h4 className="mb-3 text-sm font-semibold text-surface-900 dark:text-surface-100">{note.title}</h4>
                        {/* Rendered server-side from typed blocks — model text is escaped there,
                            so what you see is byte-for-byte what will be stored. */}
                        <div
                            className="prose prose-sm max-w-none dark:prose-invert"
                            dangerouslySetInnerHTML={{ __html: note.html || '' }}
                        />
                    </>
                )}
                {activeTab === 'quiz' && quiz.include && (
                    <>
                        <h4 className="mb-3 text-sm font-semibold text-surface-900 dark:text-surface-100">
                            {quiz.title}
                            <span className="ml-2 font-normal text-surface-400">{quiz.duration_minutes} min</span>
                        </h4>
                        <ul className="space-y-2">
                            {questions.map((question, index) => (
                                <QuestionCard key={index} question={question} index={index} />
                            ))}
                        </ul>
                    </>
                )}
                {activeTab === 'assignments' && (
                    <div className="space-y-3">
                        {assignments.map((assignment, index) => (
                            <AssignmentCard key={index} assignment={assignment} />
                        ))}
                    </div>
                )}
                {activeTab === 'coding' && (
                    <div className="space-y-3">
                        {codingProblems.map((problem, index) => (
                            <CodingCard key={index} problem={problem} />
                        ))}
                    </div>
                )}
            </div>
        </Section>
    )
}

const ContentPreview = ({ draft, selection, onToggle }) => (
    <div className="space-y-4">
        {(draft.topics || []).map((entry) => (
            <ContentTopicCard
                key={entry.topic_id || entry.topic_code}
                entry={entry}
                checked={selection.topics.has(String(entry.topic_id))}
                onToggle={(checked) => onToggle('topics', { code: String(entry.topic_id) }, checked)}
            />
        ))}
    </div>
)

/* --------------------------------------------------------------------- meta */

const META_FIELDS = [
    { key: 'subtitle', label: 'Subtitle' },
    { key: 'description', label: 'Description' },
    { key: 'highlights', label: 'Highlights' },
    { key: 'refund_policy', label: 'Refund policy' },
]

const MetaPreview = ({ draft, selection, onToggle, onEdit, editable }) => {
    const course = draft.course || {}
    return (
        <div className="space-y-3">
            {META_FIELDS.filter((field) => {
                const value = course[field.key]
                return Array.isArray(value) ? value.length : !!value
            }).map((field) => (
                <Section key={field.key} className="p-4">
                    <CheckRow
                        checked={selection.fields.has(field.key)}
                        onChange={(checked) => onToggle('fields', { code: field.key }, checked)}
                    >
                        <span className="text-sm font-semibold text-surface-900 dark:text-surface-100">{field.label}</span>
                    </CheckRow>
                    <div className="ml-6 mt-2">
                        {field.key === 'highlights' ? (
                            <ul className="list-disc space-y-1 pl-4 text-sm text-surface-600 dark:text-surface-300">
                                {(course.highlights || []).map((item, i) => <li key={i}>{item}</li>)}
                            </ul>
                        ) : editable ? (
                            <textarea
                                className={inputClass}
                                rows={field.key === 'description' ? 6 : 2}
                                value={course[field.key] || ''}
                                onChange={(e) => onEdit(['course', field.key], e.target.value)}
                            />
                        ) : (
                            <p className="whitespace-pre-wrap text-sm text-surface-600 dark:text-surface-300">
                                {course[field.key]}
                            </p>
                        )}
                    </div>
                </Section>
            ))}
        </div>
    )
}

/* ------------------------------------------------------------------- export */

/** Every selectable key in a draft, used for "select all" and the initial state. */
export const collectSelectable = (kind, draft) => {
    const empty = { subjects: [], chapters: [], topics: [], fields: [] }
    if (!draft) return empty
    if (kind === 'outline') {
        const subjects = draft.subjects || []
        return {
            ...empty,
            subjects: subjects.map((s) => s.code),
            chapters: subjects.flatMap((s) => (s.chapters || []).map((c) => c.code)),
            topics: subjects.flatMap((s) => (s.chapters || []).flatMap((c) => (c.topics || []).map((t) => t.code))),
        }
    }
    if (kind === 'content') {
        return { ...empty, topics: (draft.topics || []).map((t) => String(t.topic_id)) }
    }
    if (kind === 'meta') {
        const course = draft.course || {}
        return {
            ...empty,
            fields: META_FIELDS.map((f) => f.key).filter((key) => {
                const value = course[key]
                return Array.isArray(value) ? value.length : !!value
            }),
        }
    }
    return empty
}

const DraftPreview = ({ job, selection, onToggle, onEdit, editable }) => {
    const draft = job?.draft || {}
    const failures = draft.partial_failures || []

    const isEmpty = useMemo(() => {
        if (job?.kind === 'outline') return !(draft.subjects || []).length
        if (job?.kind === 'content') return !(draft.topics || []).length
        if (job?.kind === 'meta') return !Object.values(draft.course || {}).some((v) => (Array.isArray(v) ? v.length : v))
        return true
    }, [job?.kind, draft])

    if (isEmpty) {
        return (
            <div className="rounded-xl border border-dashed border-surface-300 p-10 text-center text-sm text-surface-500 dark:border-surface-600">
                <Sparkles className="mx-auto mb-2 h-5 w-5 opacity-40" />
                The model returned nothing usable. Try refining your request with more detail.
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {failures.length > 0 && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-200">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                        <p className="font-medium">Some topics could not be generated.</p>
                        <p className="mt-0.5 text-xs opacity-80">
                            {failures.join(' · ')} — everything below is still safe to save; run the missing ones again afterwards.
                        </p>
                    </div>
                </div>
            )}

            {job.kind === 'outline' && (
                <OutlinePreview draft={draft} selection={selection} onToggle={onToggle} onEdit={onEdit} editable={editable} />
            )}
            {job.kind === 'content' && (
                <ContentPreview draft={draft} selection={selection} onToggle={onToggle} />
            )}
            {job.kind === 'meta' && (
                <MetaPreview draft={draft} selection={selection} onToggle={onToggle} onEdit={onEdit} editable={editable} />
            )}

            <p className="flex items-center gap-1.5 pt-1 text-xs text-surface-400">
                <HelpCircle className="h-3.5 w-3.5" />
                Nothing above has been saved yet. Untick anything you do not want.
            </p>
        </div>
    )
}

export default DraftPreview
