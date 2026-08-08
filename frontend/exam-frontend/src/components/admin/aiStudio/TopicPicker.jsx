import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, ChevronRight, FileText, ListChecks, Loader2, Search } from 'lucide-react'
import courseAiService from '../../../services/courseAiService'
import { CheckRow, Pill } from './studioParts'

/* ===========================================================================
 * TopicPicker — choose which topics the AI should write material for.
 *
 * Topics that already have notes or a quiz are flagged, because regenerating
 * them will replace the existing reading (and, for an unattempted quiz, its
 * questions). Nothing is written here; this only builds the request.
 * ========================================================================= */

const TopicPicker = ({ courseId, selected, onChange, max }) => {
    const [search, setSearch] = useState('')
    const [collapsed, setCollapsed] = useState(() => new Set())

    const { data, isLoading } = useQuery({
        queryKey: ['coursegen-tree', courseId],
        queryFn: () => courseAiService.getCourseTree(courseId),
        enabled: !!courseId,
    })

    const subjects = useMemo(() => {
        const query = search.trim().toLowerCase()
        const all = data?.subjects || []
        if (!query) return all
        return all
            .map((subject) => ({
                ...subject,
                chapters: (subject.chapters || [])
                    .map((chapter) => ({
                        ...chapter,
                        topics: (chapter.topics || []).filter((topic) =>
                            topic.name.toLowerCase().includes(query)),
                    }))
                    .filter((chapter) => chapter.topics.length),
            }))
            .filter((subject) => subject.chapters.length)
    }, [data, search])

    const atLimit = selected.length >= max

    const toggleTopic = (topicId, checked) => {
        if (checked) {
            if (selected.includes(topicId) || atLimit) return
            onChange([...selected, topicId])
        } else {
            onChange(selected.filter((id) => id !== topicId))
        }
    }

    const toggleChapter = (chapter, checked) => {
        const ids = (chapter.topics || []).map((t) => t.id)
        if (checked) {
            const next = [...selected]
            ids.forEach((id) => {
                if (!next.includes(id) && next.length < max) next.push(id)
            })
            onChange(next)
        } else {
            onChange(selected.filter((id) => !ids.includes(id)))
        }
    }

    const toggleCollapsed = (id) => setCollapsed((prev) => {
        const next = new Set(prev)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        return next
    })

    if (!courseId) {
        return <p className="text-sm text-surface-500">Pick a course first.</p>
    }
    if (isLoading) {
        return (
            <div className="flex items-center gap-2 py-6 text-sm text-surface-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading topics…
            </div>
        )
    }
    if (!(data?.subjects || []).length) {
        return (
            <p className="rounded-lg border border-dashed border-surface-300 p-4 text-sm text-surface-500 dark:border-surface-600">
                This course has no topics yet. Generate a course outline first.
            </p>
        )
    }

    return (
        <div>
            <div className="mb-3 flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Find a topic…"
                        className="w-full rounded-lg border border-surface-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-primary-500 dark:border-surface-700 dark:bg-surface-800"
                    />
                </div>
                <Pill tone={atLimit ? 'amber' : 'primary'}>
                    {selected.length} / {max} selected
                </Pill>
            </div>

            <div className="max-h-80 space-y-2 overflow-y-auto rounded-lg border border-surface-200 p-2 dark:border-surface-700">
                {subjects.map((subject) => {
                    const isCollapsed = collapsed.has(subject.id)
                    return (
                        <div key={subject.id}>
                            <button
                                type="button"
                                onClick={() => toggleCollapsed(subject.id)}
                                className="flex w-full items-center gap-1.5 rounded px-1 py-1 text-left text-xs font-semibold uppercase tracking-wide text-surface-500 hover:bg-surface-50 dark:hover:bg-surface-700/40"
                            >
                                {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                {subject.name}
                            </button>

                            {!isCollapsed && (subject.chapters || []).map((chapter) => {
                                const ids = (chapter.topics || []).map((t) => t.id)
                                const allPicked = ids.length > 0 && ids.every((id) => selected.includes(id))
                                return (
                                    <div key={chapter.id} className="ml-4 mt-1">
                                        <CheckRow checked={allPicked} onChange={(c) => toggleChapter(chapter, c)}>
                                            <span className="text-xs font-medium text-surface-600 dark:text-surface-300">
                                                {chapter.name}
                                            </span>
                                        </CheckRow>
                                        <ul className="ml-5 mt-1 space-y-1">
                                            {(chapter.topics || []).map((topic) => {
                                                const checked = selected.includes(topic.id)
                                                return (
                                                    <li key={topic.id}>
                                                        <CheckRow
                                                            checked={checked}
                                                            disabled={!checked && atLimit}
                                                            onChange={(c) => toggleTopic(topic.id, c)}
                                                        >
                                                            <span className="flex flex-wrap items-center gap-1.5">
                                                                <span className="text-sm text-surface-700 dark:text-surface-300">{topic.name}</span>
                                                                {topic.has_notes && <Pill><FileText className="h-3 w-3" />notes</Pill>}
                                                                {topic.has_quiz && <Pill><ListChecks className="h-3 w-3" />quiz</Pill>}
                                                            </span>
                                                        </CheckRow>
                                                    </li>
                                                )
                                            })}
                                        </ul>
                                    </div>
                                )
                            })}
                        </div>
                    )
                })}
            </div>

            {selected.some((id) => {
                const topics = (data?.subjects || []).flatMap((s) => (s.chapters || []).flatMap((c) => c.topics || []))
                const topic = topics.find((t) => t.id === id)
                return topic?.has_notes || topic?.has_quiz
            }) && (
                <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                    Some selected topics already have material. Regenerating replaces the existing
                    reading notes — quizzes that learners have already attempted are kept untouched.
                </p>
            )}
        </div>
    )
}

export default TopicPicker
