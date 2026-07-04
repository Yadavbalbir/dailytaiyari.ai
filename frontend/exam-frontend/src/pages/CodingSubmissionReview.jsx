import { useMemo, lazy, Suspense } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft, ChevronLeft, ChevronRight, Clock, Trophy, CheckCircle2,
  XCircle, AlertTriangle, Code2,
} from 'lucide-react'
import { contentBuilderService as svc } from '../services/contentBuilderService'
import Loading from '../components/common/Loading'

const CodeEditor = lazy(() => import('../components/coding/CodeEditor'))

const LANG_MONACO = { python: 'python', cpp: 'cpp', java: 'java' }

const VERDICT = {
  passed: { label: 'Passed', icon: CheckCircle2, cls: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' },
  wrong_answer: { label: 'Wrong answer', icon: XCircle, cls: 'text-red-600 bg-red-50 dark:bg-red-900/20' },
  compile_error: { label: 'Compile error', icon: AlertTriangle, cls: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20' },
  runtime_error: { label: 'Runtime error', icon: AlertTriangle, cls: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20' },
  time_limit: { label: 'Time limit', icon: Clock, cls: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' },
}

const IOBlock = ({ label, text }) => (
  <div>
    <p className="text-[10px] font-semibold uppercase tracking-wide text-surface-400 mb-1">{label}</p>
    <pre className="text-xs bg-surface-900 text-surface-100 rounded-lg p-2.5 overflow-x-auto whitespace-pre-wrap max-h-40">
      {text === '' || text == null ? <span className="text-surface-500">(empty)</span> : text}
    </pre>
  </div>
)

const CodingSubmissionReview = () => {
  const { courseId, problemId, submissionId } = useParams()
  const navigate = useNavigate()

  const { data: submission, isLoading } = useQuery({
    queryKey: ['cb-coding-submission', submissionId],
    queryFn: () => svc.getCodingSubmission(submissionId),
    enabled: !!submissionId,
  })

  const { data: listData } = useQuery({
    queryKey: ['cb-coding-submissions', problemId],
    queryFn: () => svc.getCodingSubmissions(problemId),
    enabled: !!problemId,
  })

  const submitted = useMemo(() => listData?.submissions || [], [listData])
  const idx = submitted.findIndex((s) => String(s.id) === String(submissionId))
  const prev = idx > 0 ? submitted[idx - 1] : null
  const next = idx >= 0 && idx < submitted.length - 1 ? submitted[idx + 1] : null

  if (isLoading) return <Loading fullScreen />
  if (!submission) return null

  const goTo = (s) => navigate(`/courses/${courseId}/manage/coding/${problemId}/submissions/${s.id}`)
  const results = submission.results || []
  const maxMarks = submission.problem_max_marks

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button
          onClick={() => navigate(`/courses/${courseId}/manage/coding/${problemId}`)}
          className="text-sm text-surface-500 hover:text-primary-600 flex items-center gap-1"
        >
          <ArrowLeft size={16} /> Back to all submissions
        </button>
        <div className="flex items-center gap-2">
          <button onClick={() => prev && goTo(prev)} disabled={!prev} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">
            <ChevronLeft size={15} /> Prev
          </button>
          {idx >= 0 && <span className="text-xs text-surface-500 tabular-nums">{idx + 1} / {submitted.length}</span>}
          <button onClick={() => next && goTo(next)} disabled={!next} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">
            Next <ChevronRight size={15} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-5 items-start">
        <div className="space-y-4 order-2 lg:order-1">
          <div className="card p-5">
            <h1 className="text-lg font-display font-bold truncate flex items-center gap-2">
              <Code2 className="w-4 h-4 text-primary-500" /> {submission.problem_title}
            </h1>
            <p className="text-xs text-surface-500 mt-0.5 uppercase">{submission.language}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2 text-surface-600 dark:text-surface-300">Submitted code</h3>
            <Suspense fallback={<div className="h-[420px] rounded-xl border border-surface-200 dark:border-surface-700 flex items-center justify-center text-sm text-surface-400">Loading…</div>}>
              <CodeEditor value={submission.source_code || ''} language={LANG_MONACO[submission.language] || 'python'} readOnly height={420} />
            </Suspense>
          </div>

          {submission.compile_output ? (
            <div className="card p-4">
              <IOBlock label="Compiler output" text={submission.compile_output} />
            </div>
          ) : null}

          <div className="card p-5 space-y-3">
            <h3 className="text-sm font-semibold text-surface-600 dark:text-surface-300">Test results</h3>
            {results.map((r) => {
              const v = VERDICT[r.verdict] || { label: r.verdict, icon: XCircle, cls: 'bg-surface-100 dark:bg-surface-800' }
              const Icon = v.icon
              return (
                <div key={r.index} className="rounded-lg border border-surface-200 dark:border-surface-700 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-surface-500">
                      {r.is_sample ? `Sample ${r.index + 1}` : `Test ${r.index + 1}`}
                      {r.max_points != null ? ` · ${r.points}/${r.max_points} pts` : ''}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${v.cls}`}>
                      <Icon className="w-3.5 h-3.5" /> {v.label}
                    </span>
                  </div>
                  {r.stdin != null && <IOBlock label="Input" text={r.stdin} />}
                  {r.expected_output != null && <IOBlock label="Expected" text={r.expected_output} />}
                  {r.stdout != null && <IOBlock label="Output" text={r.stdout} />}
                  {r.stderr ? <IOBlock label="Stderr" text={r.stderr} /> : null}
                </div>
              )
            })}
          </div>
        </div>

        <aside className="order-1 lg:order-2 space-y-4 lg:sticky lg:top-6">
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 flex items-center justify-center font-semibold shrink-0">
                {(submission.student_name || submission.student_email || '?').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-semibold truncate">{submission.student_name || 'Student'}</p>
                <p className="text-xs text-surface-400 truncate">{submission.student_email}</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-surface-100 dark:border-surface-800 text-xs text-surface-500 space-y-1.5">
              <p className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {new Date(submission.submitted_at).toLocaleString()}</p>
            </div>
          </div>

          <div className="card p-5 space-y-3">
            <h3 className="font-semibold flex items-center gap-1.5"><Trophy className="w-4 h-4 text-warning-500" /> Result</h3>
            <div className={`rounded-xl p-4 text-center ${submission.all_passed ? 'bg-success-50 dark:bg-success-900/20' : 'bg-amber-50 dark:bg-amber-900/20'}`}>
              <p className="text-2xl font-bold">{submission.passed_count}/{submission.total_count}</p>
              <p className="text-xs text-surface-500 mt-1">test cases passed</p>
            </div>
            {maxMarks != null && submission.marks != null && (
              <div className="rounded-xl p-4 text-center bg-surface-100 dark:bg-surface-800">
                <p className="text-2xl font-bold">{submission.marks} <span className="text-base text-surface-400">/ {maxMarks}</span></p>
                <p className="text-xs text-surface-500 mt-1">marks (auto-graded)</p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}

export default CodingSubmissionReview
