import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  ArrowLeft, ChevronLeft, ChevronRight, Save, Trophy, Clock,
  FileText, Loader2, User, CheckCircle2,
} from 'lucide-react'
import { contentBuilderService as svc } from '../services/contentBuilderService'
import { formatApiError } from '../components/admin/builderShared'
import PdfReader from '../components/content/PdfReader'
import Loading from '../components/common/Loading'

/**
 * Focused per-student submission review + grading page.
 * The submitted PDF is rendered inline (view-only) alongside the text answer,
 * with a sticky grading panel and prev/next navigation across submissions.
 */
const SubmissionReview = () => {
  const { courseId, assignmentId, submissionId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: submission, isLoading } = useQuery({
    queryKey: ['cb-submission', submissionId],
    queryFn: () => svc.getSubmission(submissionId),
    enabled: !!submissionId,
  })

  // Sibling submissions for prev/next navigation.
  const { data: listData } = useQuery({
    queryKey: ['cb-submissions', assignmentId],
    queryFn: () => svc.getAssignmentSubmissions(assignmentId),
    enabled: !!assignmentId,
  })

  const submitted = useMemo(() => listData?.submitted || [], [listData])
  const idx = submitted.findIndex((s) => String(s.id) === String(submissionId))
  const prev = idx > 0 ? submitted[idx - 1] : null
  const next = idx >= 0 && idx < submitted.length - 1 ? submitted[idx + 1] : null

  const [marks, setMarks] = useState('')
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    if (submission) {
      setMarks(submission.marks ?? '')
      setFeedback(submission.feedback ?? '')
    }
  }, [submission])

  const gradeMutation = useMutation({
    mutationFn: (payload) => svc.gradeSubmission(submissionId, payload),
    onSuccess: () => {
      toast.success('Grade saved')
      queryClient.invalidateQueries({ queryKey: ['cb-submission', submissionId] })
      queryClient.invalidateQueries({ queryKey: ['cb-submissions', assignmentId] })
    },
    onError: (err) => toast.error(formatApiError(err)),
  })

  if (isLoading) return <Loading fullScreen />
  if (!submission) return null

  const maxMarks = submission.assignment_max_marks
  const goTo = (s) => navigate(`/courses/${courseId}/manage/assignments/${assignmentId}/submissions/${s.id}`)

  return (
    <div className="space-y-5">
      {/* Breadcrumb / back */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button
          onClick={() => navigate(`/courses/${courseId}/manage/assignments/${assignmentId}`)}
          className="text-sm text-surface-500 hover:text-primary-600 flex items-center gap-1"
        >
          <ArrowLeft size={16} /> Back to all submissions
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => prev && goTo(prev)}
            disabled={!prev}
            className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40"
          >
            <ChevronLeft size={15} /> Prev
          </button>
          {idx >= 0 && (
            <span className="text-xs text-surface-500 tabular-nums">{idx + 1} / {submitted.length}</span>
          )}
          <button
            onClick={() => next && goTo(next)}
            disabled={!next}
            className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40"
          >
            Next <ChevronRight size={15} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-5 items-start">
        {/* Main: submission content */}
        <div className="space-y-4 order-2 lg:order-1">
          <div className="card p-5">
            <h1 className="text-lg font-display font-bold truncate">{submission.assignment_title}</h1>
            <p className="text-xs text-surface-500 mt-0.5">{submission.topic_name}</p>
          </div>

          {submission.submission_text && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5 text-surface-600 dark:text-surface-300">
                <FileText className="w-4 h-4" /> Text answer
              </h3>
              <div className="text-sm text-surface-700 dark:text-surface-200 whitespace-pre-wrap leading-relaxed">
                {submission.submission_text}
              </div>
            </div>
          )}

          {submission.file_stream_url ? (
            <div>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5 text-surface-600 dark:text-surface-300">
                <FileText className="w-4 h-4" /> Submitted PDF
              </h3>
              <PdfReader url={submission.file_stream_url} />
            </div>
          ) : !submission.submission_text ? (
            <div className="card p-8 text-center text-surface-500">
              <FileText className="w-10 h-10 mx-auto mb-2 text-surface-300" />
              <p>No content submitted.</p>
            </div>
          ) : null}
        </div>

        {/* Sidebar: student + grading */}
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
              <p className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Submitted {new Date(submission.submitted_at).toLocaleString()}</p>
              {submission.status === 'graded' ? (
                <p className="flex items-center gap-1.5 text-success-600 dark:text-success-400 font-medium"><CheckCircle2 className="w-3.5 h-3.5" /> Graded</p>
              ) : (
                <p className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium"><Clock className="w-3.5 h-3.5" /> Awaiting grade</p>
              )}
            </div>
          </div>

          <div className="card p-5 space-y-4">
            <h3 className="font-semibold flex items-center gap-1.5"><Trophy className="w-4 h-4 text-warning-500" /> Grade</h3>
            <div>
              <label className="block text-xs font-semibold text-surface-500 mb-1">
                Marks{maxMarks != null ? ` (out of ${maxMarks})` : ''}
              </label>
              <input
                type="number"
                min="0"
                max={maxMarks ?? undefined}
                className="input"
                value={marks}
                onChange={(e) => setMarks(e.target.value)}
                placeholder="e.g. 18"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-surface-500 mb-1">Feedback (student sees this)</label>
              <textarea
                rows={5}
                className="input resize-none"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Share what was good and what to improve…"
              />
            </div>
            <button
              onClick={() => gradeMutation.mutate({ marks: marks === '' ? null : Number(marks), feedback })}
              disabled={gradeMutation.isPending}
              className="btn-primary w-full"
            >
              {gradeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save grade
            </button>
            {next && (
              <button
                onClick={() => {
                  gradeMutation.mutate(
                    { marks: marks === '' ? null : Number(marks), feedback },
                    { onSuccess: () => goTo(next) }
                  )
                }}
                disabled={gradeMutation.isPending}
                className="btn-secondary w-full text-sm"
              >
                Save & next <ChevronRight size={15} />
              </button>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}

export default SubmissionReview
