import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  ArrowLeft, Loader2, FileText, Code2, CheckCircle2, XCircle,
  Award, Hash, ListChecks, User, Clock, ChevronDown, ChevronUp,
} from 'lucide-react'
import { mockTestBuilderService as svc } from '../services/mockTestBuilderService'

const TYPE_META = {
  mcq: { label: 'Multiple Choice', icon: ListChecks },
  mcq_multi: { label: 'Multiple Choice (Multi)', icon: ListChecks },
  numerical: { label: 'Numerical', icon: Hash },
  subjective: { label: 'Subjective', icon: FileText },
  coding: { label: 'Coding', icon: Code2 },
}

/**
 * Admin per-attempt review + grading page for a mock test submission.
 * Renders every answer (all five question types) with the student's response,
 * the correct reference, and auto-grade status; subjective answers get an
 * inline grading control, and the attempt can be finalized to release results.
 */
export default function MockTestSubmissionReview() {
  const { testId, attemptId } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['mockAttemptGrading', attemptId],
    queryFn: () => svc.attemptDetail(attemptId),
    enabled: !!attemptId,
  })

  const gradeMut = useMutation({
    mutationFn: (payload) => svc.gradeAnswer(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mockAttemptGrading', attemptId] })
      qc.invalidateQueries({ queryKey: ['mock-submissions', testId] })
      qc.invalidateQueries({ queryKey: ['mockPendingGrading'] })
      toast.success('Saved')
    },
    onError: (e) => toast.error(e?.response?.data?.marks || e?.response?.data?.error || 'Failed to save'),
  })

  const finalizeMut = useMutation({
    mutationFn: () => svc.finalizeAttempt(attemptId),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['mockAttemptGrading', attemptId] })
      qc.invalidateQueries({ queryKey: ['mock-submissions', testId] })
      qc.invalidateQueries({ queryKey: ['mockPendingGrading'] })
      toast.success(r.xp_awarded ? `Finalized · ${r.xp_awarded} XP awarded` : 'Finalized & released')
    },
    onError: (e) => toast.error(e?.response?.data?.error || 'Cannot finalize yet'),
  })

  if (isLoading || !data) {
    return <div className="flex justify-center py-24"><Loader2 className="w-7 h-7 animate-spin text-primary-500" /></div>
  }

  const canFinalize = data.pending_count === 0
  const finalized = data.grading_status === 'graded'

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm flex-wrap">
        <button
          onClick={() => navigate(`/admin/mock-tests/${testId}/submissions`)}
          className="text-surface-500 hover:text-primary-600 flex items-center gap-1"
        >
          <ArrowLeft size={16} /> Submissions
        </button>
      </div>

      {/* Header */}
      <div className="card p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
              <User className="w-5 h-5 text-surface-400" /> {data.student_name || data.student_email}
            </h1>
            <p className="text-surface-500 text-sm mt-0.5">{data.mock_test_title}</p>
            {data.completed_at && (
              <p className="text-xs text-surface-400 flex items-center gap-1 mt-1">
                <Clock className="w-3 h-3" /> {new Date(data.completed_at).toLocaleString()}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-primary-600">
              {data.marks_obtained}<span className="text-base text-surface-400"> / {data.total_marks}</span>
            </p>
            <p className="text-xs text-surface-400 mt-1">
              {Math.round(data.percentage)}% ·{' '}
              {data.pending_count > 0
                ? `${data.pending_count} pending`
                : (finalized ? 'graded' : 'auto-graded')}
            </p>
          </div>
        </div>
      </div>

      {/* Answers */}
      <div className="space-y-4">
        {data.answers.map((a, i) => (
          <ReviewCard
            key={a.answer_id}
            answer={a}
            index={i}
            saving={gradeMut.isPending}
            onSave={(marks, feedback) => gradeMut.mutate({ answer_id: a.answer_id, marks, feedback })}
          />
        ))}
      </div>

      {/* Finalize */}
      <div className="card p-5 flex items-center justify-between gap-4 flex-wrap sticky bottom-4">
        <p className="text-sm text-surface-500">
          {finalized
            ? 'This attempt is finalized. Results are released to the student.'
            : canFinalize
              ? 'All answers graded. Finalize to release results and award XP.'
              : 'Grade every pending answer before finalizing.'}
        </p>
        <button
          onClick={() => finalizeMut.mutate()}
          disabled={!canFinalize || finalizeMut.isPending}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium disabled:opacity-50"
        >
          {finalizeMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
          {finalized ? 'Re-finalize' : 'Finalize & release'}
        </button>
      </div>
    </div>
  )
}

function ReviewCard({ answer, index, onSave, saving }) {
  const meta = TYPE_META[answer.item_type] || TYPE_META.mcq
  const Icon = meta.icon
  const isManual = answer.item_type === 'subjective' || answer.needs_manual_grading
  const scoredCls = answer.needs_manual_grading
    ? 'border-amber-200 dark:border-amber-900/40'
    : answer.marks_obtained > 0
      ? 'border-emerald-200 dark:border-emerald-900/40'
      : 'border-surface-200 dark:border-surface-700'

  return (
    <div className={`card p-5 border ${scoredCls}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-primary-500" />
        <span className="text-xs font-semibold uppercase text-surface-400">Q{index + 1} · {meta.label}</span>
        <span className="text-xs text-surface-400">· max {answer.max_marks}</span>
        <span className="ml-auto text-sm font-semibold">
          {answer.needs_manual_grading
            ? <span className="text-amber-600">Needs grading</span>
            : <span className={answer.marks_obtained > 0 ? 'text-emerald-600' : 'text-surface-500'}>{answer.marks_obtained}/{answer.max_marks}</span>}
        </span>
      </div>

      {answer.question_html
        ? <div className="prose dark:prose-invert max-w-none text-sm mb-3" dangerouslySetInnerHTML={{ __html: answer.question_html }} />
        : <p className="text-surface-800 dark:text-surface-100 text-sm mb-3 whitespace-pre-wrap">{answer.question_text}</p>}

      {(answer.item_type === 'mcq' || answer.item_type === 'mcq_multi') && (
        <McqReview answer={answer} />
      )}
      {answer.item_type === 'numerical' && <NumericalReview answer={answer} />}
      {answer.item_type === 'subjective' && <SubjectiveReview answer={answer} />}
      {answer.item_type === 'coding' && <CodingReview answer={answer} />}

      {answer.explanation && (
        <div className="mt-3 text-xs text-surface-500 bg-surface-50 dark:bg-surface-800/50 rounded-lg p-3">
          <span className="font-semibold">Explanation: </span>{answer.explanation}
        </div>
      )}

      {isManual && <GradeControl answer={answer} onSave={onSave} saving={saving} />}

      {!isManual && answer.feedback && (
        <p className="mt-3 text-xs text-surface-500"><span className="font-semibold">Feedback:</span> {answer.feedback}</p>
      )}
    </div>
  )
}

function McqReview({ answer }) {
  const selected = new Set((answer.selected_options || []).map(Number))
  const correct = new Set((answer.correct_option_indices || []).map(Number))
  return (
    <div className="space-y-2">
      {(answer.options || []).map((opt, idx) => {
        const isCorrect = correct.has(idx)
        const isSelected = selected.has(idx)
        return (
          <div
            key={idx}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border ${
              isCorrect
                ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20'
                : isSelected
                  ? 'border-rose-300 bg-rose-50 dark:bg-rose-900/20'
                  : 'border-surface-200 dark:border-surface-700'
            }`}
          >
            {isCorrect ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              : isSelected ? <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
              : <span className="w-4 h-4 shrink-0" />}
            <span className="flex-1">{opt.text}</span>
            {isSelected && <span className="text-xs font-medium text-surface-500">student</span>}
          </div>
        )
      })}
      {selected.size === 0 && <p className="text-xs text-surface-400 italic">No option selected.</p>}
    </div>
  )
}

function NumericalReview({ answer }) {
  const correct = answer.marks_obtained > 0
  return (
    <div className="flex flex-wrap gap-3 text-sm">
      <div className={`px-3 py-2 rounded-lg border ${correct ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/20' : 'border-rose-300 bg-rose-50 dark:bg-rose-900/20'}`}>
        <span className="text-xs text-surface-400 block">Student answer</span>
        <span className="font-mono font-semibold">{answer.numerical_answer ?? '(blank)'}</span>
      </div>
      <div className="px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700">
        <span className="text-xs text-surface-400 block">Correct answer</span>
        <span className="font-mono font-semibold">
          {answer.numerical_correct}
          {answer.numerical_tolerance ? ` ± ${answer.numerical_tolerance}` : ''}
        </span>
      </div>
    </div>
  )
}

function SubjectiveReview({ answer }) {
  const [showRef, setShowRef] = useState(false)
  return (
    <div>
      <div className="rounded-xl bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700 p-4">
        <p className="text-surface-800 dark:text-surface-100 text-sm whitespace-pre-wrap">
          {answer.answer_text || <span className="text-surface-400 italic">(no answer)</span>}
        </p>
      </div>
      {(answer.rubric || answer.model_answer) && (
        <button
          onClick={() => setShowRef((v) => !v)}
          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:underline"
        >
          {showRef ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          Grading reference (admin only)
        </button>
      )}
      {showRef && (
        <div className="mt-2 space-y-2 text-xs">
          {answer.rubric && (
            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-3">
              <span className="font-semibold text-indigo-700 dark:text-indigo-300">Rubric: </span>
              <span className="whitespace-pre-wrap">{answer.rubric}</span>
            </div>
          )}
          {answer.model_answer && (
            <div className="bg-surface-100 dark:bg-surface-800 rounded-lg p-3">
              <span className="font-semibold">Model answer: </span>
              <span className="whitespace-pre-wrap">{answer.model_answer}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function CodingReview({ answer }) {
  const results = answer.coding_results || []
  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-surface-900 text-surface-100 p-4 overflow-x-auto">
        <p className="text-xs text-surface-400 mb-1">Submission ({answer.language || 'n/a'}) · {answer.passed_count}/{answer.total_count} cases passed</p>
        <pre className="text-xs whitespace-pre-wrap font-mono">{answer.code || '(no code submitted)'}</pre>
      </div>
      {results.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {results.map((r, i) => (
            <span
              key={i}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                r.verdict === 'passed' || r.passed
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                  : 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400'
              }`}
            >
              {(r.verdict === 'passed' || r.passed) ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
              Case {i + 1}{r.verdict ? ` · ${r.verdict}` : ''}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function GradeControl({ answer, onSave, saving }) {
  const [marks, setMarks] = useState(answer.needs_manual_grading ? '' : String(answer.marks_obtained))
  const [feedback, setFeedback] = useState(answer.feedback || '')
  const graded = !answer.needs_manual_grading

  return (
    <div className="mt-4 pt-4 border-t border-surface-200 dark:border-surface-700 flex items-end gap-3 flex-wrap">
      <div>
        <label className="block text-xs font-medium text-surface-500 mb-1">Marks (0–{answer.max_marks})</label>
        <input
          type="number" step="0.5" min={0} max={answer.max_marks} value={marks}
          onChange={(e) => setMarks(e.target.value)}
          className="w-28 px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800"
        />
      </div>
      <div className="flex-1 min-w-[200px]">
        <label className="block text-xs font-medium text-surface-500 mb-1">Feedback (optional)</label>
        <input
          value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Note for the student…"
          className="w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800"
        />
      </div>
      <button
        onClick={() => onSave(Number(marks), feedback)}
        disabled={saving || marks === ''}
        className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium disabled:opacity-50"
      >
        {graded ? 'Update' : 'Save'}
      </button>
    </div>
  )
}
