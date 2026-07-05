import { useState, useEffect, useMemo, lazy, Suspense } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  ArrowLeft, Play, Send, Loader2, Code2, CheckCircle2, XCircle,
  Clock, AlertTriangle, Trophy, Terminal,
} from 'lucide-react'
import { codingService } from '../services/codingService'
import Loading from '../components/common/Loading'

const CodeEditor = lazy(() => import('../components/coding/CodeEditor'))

const DIFF_TINT = {
  easy: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20',
  medium: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20',
  hard: 'bg-red-50 text-red-600 dark:bg-red-900/20',
}

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

const VerdictPill = ({ verdict }) => {
  const v = VERDICT[verdict] || { label: verdict, icon: XCircle, cls: 'text-surface-500 bg-surface-100 dark:bg-surface-800' }
  const Icon = v.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ${v.cls}`}>
      <Icon className="w-3.5 h-3.5" /> {v.label}
    </span>
  )
}

const CodingProblem = () => {
  const { problemId } = useParams()
  const navigate = useNavigate()

  const { data: problem, isLoading } = useQuery({
    queryKey: ['codingProblem', problemId],
    queryFn: () => codingService.getProblem(problemId),
    enabled: !!problemId,
  })

  const languages = useMemo(() => problem?.languages || [], [problem])
  const [lang, setLang] = useState(null)
  const [code, setCode] = useState('')
  const [runResult, setRunResult] = useState(null)
  const [submitResult, setSubmitResult] = useState(null)

  // Seed language + starter code once the problem loads / language changes.
  useEffect(() => {
    if (languages.length && !lang) setLang(languages[0].key)
  }, [languages, lang])

  useEffect(() => {
    if (!problem || !lang) return
    const starter = problem.starter_code?.[lang] ?? ''
    setCode(starter)
    setRunResult(null)
    setSubmitResult(null)
  }, [lang, problem?.id])

  const runMutation = useMutation({
    mutationFn: () => codingService.run(problemId, { language: lang, source_code: code }),
    onSuccess: (data) => { setRunResult(data); setSubmitResult(null) },
    onError: (err) => toast.error(err?.response?.data?.error || 'Run failed. Try again.'),
  })

  const submitMutation = useMutation({
    mutationFn: () => codingService.submit(problemId, { language: lang, source_code: code }),
    onSuccess: (data) => {
      setSubmitResult(data)
      setRunResult(null)
      if (data.all_passed) {
        toast.success(data.xp_awarded > 0 ? `All test cases passed! +${data.xp_awarded} XP 🎉` : 'All test cases passed! 🎉')
      } else {
        toast(`${data.passed_count}/${data.total_count} test cases passed`)
      }
    },
    onError: (err) => toast.error(err?.response?.data?.error || 'Submission failed. Try again.'),
  })

  if (isLoading) return <Loading fullScreen />
  if (!problem) {
    return (
      <div className="card p-8 text-center">
        <p className="text-surface-500">Problem not found.</p>
        <button onClick={() => navigate(-1)} className="btn-outline mt-4">Go back</button>
      </div>
    )
  }

  const monacoLang = languages.find((l) => l.key === lang)?.monaco || 'python'
  const samples = problem.sample_cases || []
  const best = problem.my_best
  const busy = runMutation.isPending || submitMutation.isPending

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800" aria-label="Back">
          <ArrowLeft size={20} />
        </button>
        <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
          <Code2 className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-display font-bold truncate">{problem.title}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-surface-500">
            {problem.difficulty && <span className={`px-2 py-0.5 rounded capitalize ${DIFF_TINT[problem.difficulty] || 'bg-surface-100 dark:bg-surface-800'}`}>{problem.difficulty}</span>}
            {problem.max_marks != null && <span className="px-2 py-0.5 rounded bg-surface-100 dark:bg-surface-800">{problem.max_marks} marks</span>}
            <span className="px-2 py-0.5 rounded bg-surface-100 dark:bg-surface-800 inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {problem.time_limit_ms}ms</span>
            {best && (
              <span className="px-2 py-0.5 rounded bg-success-50 dark:bg-success-900/20 text-success-600 inline-flex items-center gap-1">
                <Trophy className="w-3 h-3" /> Best {best.passed_count}/{best.total_count}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* Left: statement + samples */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-surface-600 dark:text-surface-300 mb-2">Problem</h3>
            <div className="text-sm text-surface-700 dark:text-surface-200 whitespace-pre-wrap leading-relaxed">
              {problem.statement || 'No statement provided.'}
            </div>
          </div>

          {samples.length > 0 && (
            <div className="card p-5 space-y-3">
              <h3 className="text-sm font-semibold text-surface-600 dark:text-surface-300">Sample test cases</h3>
              {samples.map((s, i) => (
                <div key={s.id} className="rounded-lg border border-surface-200 dark:border-surface-700 p-3 space-y-2">
                  <p className="text-xs font-semibold text-surface-500">Sample {i + 1}</p>
                  <IOBlock label="Input" text={s.stdin} />
                  <IOBlock label="Expected output" text={s.expected_output} />
                  {s.explanation && <p className="text-xs text-surface-500 italic">{s.explanation}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: editor + actions + results */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-surface-500">Language</label>
              <select
                value={lang || ''}
                onChange={(e) => setLang(e.target.value)}
                className="input py-1.5 text-sm w-auto"
              >
                {languages.map((l) => (
                  <option key={l.key} value={l.key}>{l.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => runMutation.mutate()} disabled={busy} className="btn-secondary text-sm px-3 py-1.5 disabled:opacity-50">
                {runMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} Run
              </button>
              <button onClick={() => submitMutation.mutate()} disabled={busy} className="btn-primary text-sm px-3 py-1.5 disabled:opacity-50">
                {submitMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Submit
              </button>
            </div>
          </div>

          <Suspense fallback={<div className="h-[440px] rounded-xl border border-surface-200 dark:border-surface-700 flex items-center justify-center text-sm text-surface-400">Loading editor…</div>}>
            <CodeEditor value={code} onChange={setCode} language={monacoLang} height={440} />
          </Suspense>

          {/* Run results (samples, with I/O) */}
          {runResult && (
            <RunResultPanel result={runResult} />
          )}

          {/* Submit results */}
          {submitResult && (
            <SubmitResultPanel result={submitResult} maxMarks={problem.max_marks} />
          )}
        </div>
      </div>
    </div>
  )
}

const RunResultPanel = ({ result }) => {
  if (result.mode === 'custom') {
    const r = result.run || {}
    return (
      <div className="card p-4 space-y-2">
        <h3 className="text-sm font-semibold flex items-center gap-1.5"><Terminal className="w-4 h-4" /> Output</h3>
        <IOBlock label="Stdout" text={r.stdout} />
        {r.stderr ? <IOBlock label="Stderr" text={r.stderr} /> : null}
      </div>
    )
  }
  const results = result.results || []
  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-1.5"><Terminal className="w-4 h-4" /> Sample run</h3>
        <span className="text-xs font-semibold text-surface-500">{result.passed_count}/{result.total_count} passed</span>
      </div>
      {result.compile_output ? <IOBlock label="Compiler output" text={result.compile_output} /> : null}
      {results.map((r) => (
        <div key={r.index} className="rounded-lg border border-surface-200 dark:border-surface-700 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-surface-500">Sample {r.index + 1}</span>
            <VerdictPill verdict={r.verdict} />
          </div>
          {r.stdin != null && <IOBlock label="Input" text={r.stdin} />}
          {r.expected_output != null && <IOBlock label="Expected" text={r.expected_output} />}
          {r.stdout != null && <IOBlock label="Your output" text={r.stdout} />}
          {r.stderr ? <IOBlock label="Stderr" text={r.stderr} /> : null}
        </div>
      ))}
    </div>
  )
}

const SubmitResultPanel = ({ result, maxMarks }) => {
  const results = result.results || []
  const allPassed = result.all_passed
  return (
    <div className="card p-4 space-y-3">
      <div className={`rounded-xl p-4 flex items-center gap-3 ${allPassed ? 'bg-success-50 dark:bg-success-900/20' : 'bg-amber-50 dark:bg-amber-900/20'}`}>
        {allPassed
          ? <CheckCircle2 className="w-8 h-8 text-success-500 shrink-0" />
          : <AlertTriangle className="w-8 h-8 text-amber-500 shrink-0" />}
        <div>
          <p className="font-bold">{allPassed ? 'Accepted' : 'Partial'} — {result.passed_count}/{result.total_count} test cases passed</p>
          {maxMarks != null && result.marks != null && (
            <p className="text-sm text-surface-600 dark:text-surface-300">Score: {result.marks} / {maxMarks} marks</p>
          )}
          {result.xp_awarded > 0 && (
            <p className="text-sm font-semibold text-success-600 dark:text-success-400">+{result.xp_awarded} XP earned</p>
          )}
        </div>
      </div>
      {result.compile_output ? <IOBlock label="Compiler output" text={result.compile_output} /> : null}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {results.map((r) => {
          const v = VERDICT[r.verdict] || {}
          const Icon = v.icon || XCircle
          return (
            <div key={r.index} className={`rounded-lg p-2.5 flex items-center gap-2 text-xs font-medium ${v.cls || 'bg-surface-100 dark:bg-surface-800'}`}>
              <Icon className="w-4 h-4 shrink-0" />
              <span>{r.is_sample ? `Sample ${r.index + 1}` : `Test ${r.index + 1}`}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default CodingProblem
