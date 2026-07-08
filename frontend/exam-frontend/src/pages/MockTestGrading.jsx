import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  ChevronLeft, Loader2, ClipboardCheck, User, Clock, FileText, Code2,
  CheckCircle2, AlertCircle, Award,
} from 'lucide-react'
import { mockTestBuilderService } from '../services/mockTestBuilderService'

export default function MockTestGrading() {
  const navigate = useNavigate()
  const [activeAttempt, setActiveAttempt] = useState(null)

  const { data: pending, isLoading } = useQuery({
    queryKey: ['mockPendingGrading'],
    queryFn: () => mockTestBuilderService.pendingGrading(),
  })

  if (activeAttempt) {
    return <AttemptGrader attemptId={activeAttempt} onBack={() => setActiveAttempt(null)} />
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <button onClick={() => navigate('/admin/mock-tests')} className="inline-flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700">
        <ChevronLeft className="w-4 h-4" /> Mock Tests
      </button>

      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-amber-100 text-amber-600"><ClipboardCheck className="w-6 h-6" /></div>
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">Manual Grading</h1>
          <p className="text-surface-500 text-sm">Attempts with subjective answers awaiting your review.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-primary-500" /></div>
      ) : !pending?.length ? (
        <div className="card p-12 text-center text-surface-500">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-400" />
          <p className="font-medium">Nothing to grade</p>
          <p className="text-sm">All submitted attempts are fully graded.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map((a) => (
            <button key={a.attempt_id} onClick={() => setActiveAttempt(a.attempt_id)}
              className="w-full card p-4 flex items-center justify-between hover:border-primary-300 transition text-left">
              <div className="min-w-0">
                <p className="font-semibold text-surface-900 dark:text-white truncate flex items-center gap-2">
                  <User className="w-4 h-4 text-surface-400" /> {a.student_name || a.student_email}
                </p>
                <p className="text-sm text-surface-500 truncate">{a.mock_test_title}</p>
                {a.completed_at && (
                  <p className="text-xs text-surface-400 flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3" /> {new Date(a.completed_at).toLocaleString()}
                  </p>
                )}
              </div>
              <span className="shrink-0 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-sm font-medium">
                <AlertCircle className="w-4 h-4" /> {a.pending_count} to grade
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function AttemptGrader({ attemptId, onBack }) {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['mockAttemptGrading', attemptId],
    queryFn: () => mockTestBuilderService.attemptDetail(attemptId),
  })

  const gradeMut = useMutation({
    mutationFn: (payload) => mockTestBuilderService.gradeAnswer(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mockAttemptGrading', attemptId] })
      qc.invalidateQueries({ queryKey: ['mockPendingGrading'] })
      toast.success('Saved')
    },
    onError: (e) => toast.error(e?.response?.data?.marks || e?.response?.data?.error || 'Failed to save'),
  })

  const finalizeMut = useMutation({
    mutationFn: () => mockTestBuilderService.finalizeAttempt(attemptId),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['mockPendingGrading'] })
      toast.success(r.xp_awarded ? `Finalized · ${r.xp_awarded} XP awarded` : 'Finalized')
      onBack()
    },
    onError: (e) => toast.error(e?.response?.data?.error || 'Cannot finalize yet'),
  })

  if (isLoading || !data) {
    return <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-primary-500" /></div>
  }

  const manualAnswers = data.answers.filter((a) => a.item_type === 'subjective' || a.needs_manual_grading)
  const canFinalize = data.pending_count === 0

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button onClick={onBack} className="inline-flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700">
        <ChevronLeft className="w-4 h-4" /> Back to queue
      </button>

      <div className="card p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-surface-900 dark:text-white">{data.student_name || data.student_email}</h1>
            <p className="text-surface-500 text-sm">{data.mock_test_title}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary-600">{data.marks_obtained}<span className="text-base text-surface-400"> / {data.total_marks}</span></p>
            <p className="text-xs text-surface-400">{data.pending_count} pending · {data.grading_status.replace('_', ' ')}</p>
          </div>
        </div>
      </div>

      {manualAnswers.map((a, i) => (
        <GradeCard key={a.answer_id} answer={a} index={i} onSave={(marks, feedback) =>
          gradeMut.mutate({ answer_id: a.answer_id, marks, feedback })} saving={gradeMut.isPending} />
      ))}

      <div className="card p-5 flex items-center justify-between gap-4 flex-wrap">
        <p className="text-sm text-surface-500">
          {canFinalize ? 'All answers graded. Finalize to release results and award XP.' : 'Grade every pending answer before finalizing.'}
        </p>
        <button onClick={() => finalizeMut.mutate()} disabled={!canFinalize || finalizeMut.isPending}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium disabled:opacity-50">
          {finalizeMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />} Finalize & release
        </button>
      </div>
    </div>
  )
}

function GradeCard({ answer, index, onSave, saving }) {
  const [marks, setMarks] = useState(answer.needs_manual_grading ? '' : String(answer.marks_obtained))
  const [feedback, setFeedback] = useState(answer.feedback || '')
  const graded = !answer.needs_manual_grading

  return (
    <div className={`card p-5 ${graded ? 'border-emerald-200 dark:border-emerald-900/40' : ''}`}>
      <div className="flex items-center gap-2 mb-3">
        {answer.item_type === 'coding'
          ? <Code2 className="w-4 h-4 text-primary-500" />
          : <FileText className="w-4 h-4 text-primary-500" />}
        <span className="text-xs font-semibold uppercase text-surface-400">{answer.item_type.replace('_', ' ')}</span>
        <span className="text-xs text-surface-400">· max {answer.max_marks}</span>
        {graded && <span className="ml-auto inline-flex items-center gap-1 text-xs text-emerald-600"><CheckCircle2 className="w-3.5 h-3.5" /> graded</span>}
      </div>

      {answer.question_html
        ? <div className="prose dark:prose-invert max-w-none text-sm mb-3" dangerouslySetInnerHTML={{ __html: answer.question_html }} />
        : <p className="text-surface-800 dark:text-surface-100 text-sm mb-3 whitespace-pre-wrap">{answer.question_text}</p>}

      <div className="rounded-xl bg-surface-50 dark:bg-surface-800/50 border border-surface-200 dark:border-surface-700 p-4 mb-4">
        {answer.item_type === 'coding' ? (
          <>
            <p className="text-xs text-surface-400 mb-1">Submission ({answer.language || 'n/a'}) · auto {answer.passed_count}/{answer.total_count} cases</p>
            <pre className="text-xs overflow-x-auto whitespace-pre-wrap font-mono">{answer.code || '(no code submitted)'}</pre>
          </>
        ) : (
          <p className="text-surface-800 dark:text-surface-100 text-sm whitespace-pre-wrap">{answer.answer_text || <span className="text-surface-400 italic">(no answer)</span>}</p>
        )}
      </div>

      <div className="flex items-end gap-3 flex-wrap">
        <div>
          <label className="block text-xs font-medium text-surface-500 mb-1">Marks (0–{answer.max_marks})</label>
          <input type="number" step="0.5" min={0} max={answer.max_marks} value={marks}
            onChange={(e) => setMarks(e.target.value)}
            className="w-28 px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800" />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-surface-500 mb-1">Feedback (optional)</label>
          <input value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Note for the student…"
            className="w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800" />
        </div>
        <button onClick={() => onSave(Number(marks), feedback)} disabled={saving || marks === ''}
          className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium disabled:opacity-50">
          {graded ? 'Update' : 'Save'}
        </button>
      </div>
    </div>
  )
}
