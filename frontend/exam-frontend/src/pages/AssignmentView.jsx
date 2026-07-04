import { useState, useEffect, lazy, Suspense } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  ArrowLeft, ClipboardList, Clock, FileText, Upload, CheckCircle2,
  Lock, Award, Loader2, Send, Trophy
} from 'lucide-react'
import { assignmentService } from '../services/assignmentService'
import Loading from '../components/common/Loading'

const PdfReader = lazy(() => import('../components/content/PdfReader'))

// Human-readable countdown / relative deadline label.
const deadlineLabel = (dueAt) => {
  if (!dueAt) return null
  const due = new Date(dueAt)
  const diff = due - new Date()
  const abs = Math.abs(diff)
  const days = Math.floor(abs / 86400000)
  const hours = Math.floor((abs % 86400000) / 3600000)
  const mins = Math.floor((abs % 3600000) / 60000)
  let rel
  if (days > 0) rel = `${days}d ${hours}h`
  else if (hours > 0) rel = `${hours}h ${mins}m`
  else rel = `${mins}m`
  return {
    overdue: diff < 0,
    text: diff < 0 ? `Closed ${rel} ago` : `${rel} left`,
    full: due.toLocaleString(),
  }
}

const SUBMISSION_TYPE_LABEL = { text: 'Text answer', pdf: 'PDF upload', either: 'Text or PDF' }

const AssignmentView = () => {
  const { assignmentId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: assignment, isLoading } = useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: () => assignmentService.get(assignmentId),
    enabled: !!assignmentId,
  })

  const [text, setText] = useState('')
  const [file, setFile] = useState(null)

  // Seed the text box from an existing submission once loaded.
  useEffect(() => {
    if (assignment?.my_submission?.submission_text) {
      setText(assignment.my_submission.submission_text)
    }
  }, [assignment?.id])

  const submitMutation = useMutation({
    mutationFn: () => assignmentService.submit(assignmentId, {
      submission_text: text,
      submission_file: file,
    }),
    onSuccess: (data) => {
      toast.success('Submitted successfully')
      setFile(null)
      queryClient.setQueryData(['assignment', assignmentId], data)
      queryClient.invalidateQueries({ queryKey: ['topicAssignments'] })
    },
    onError: (err) => {
      toast.error(err?.response?.data?.error || 'Could not submit. Please try again.')
    },
  })

  if (isLoading) return <Loading fullScreen />
  if (!assignment) {
    return (
      <div className="card p-8 text-center">
        <p className="text-surface-500">Assignment not found.</p>
        <button onClick={() => navigate(-1)} className="btn-outline mt-4">Go back</button>
      </div>
    )
  }

  const sub = assignment.my_submission
  const graded = sub?.status === 'graded'
  const isOpen = assignment.is_open
  const stype = assignment.submission_type
  const dl = assignment.is_timed ? deadlineLabel(assignment.due_at) : null

  const canSubmitText = stype === 'text' || stype === 'either'
  const canSubmitFile = stype === 'pdf' || stype === 'either'

  const handleSubmit = (e) => {
    e.preventDefault()
    if (canSubmitText && !canSubmitFile && !text.trim()) return toast.error('Please write your answer.')
    if (canSubmitFile && !canSubmitText && !file) return toast.error('Please attach a PDF.')
    if (stype === 'either' && !text.trim() && !file) return toast.error('Add a text answer or attach a PDF.')
    submitMutation.mutate()
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
      >
        <ArrowLeft size={16} /> Back
      </button>

      {/* Header */}
      <div className="card p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 shrink-0 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 flex items-center justify-center">
            <ClipboardList size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold leading-snug">{assignment.title}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-surface-100 dark:bg-surface-700 text-surface-500 font-medium">
                {SUBMISSION_TYPE_LABEL[stype] || stype}
              </span>
              {assignment.max_marks ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-warning-50 text-warning-700 dark:bg-warning-900/30 dark:text-warning-300 font-medium">
                  <Award size={12} /> {assignment.max_marks} marks
                </span>
              ) : null}
              {dl ? (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full font-medium ${
                    dl.overdue
                      ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/30'
                      : 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                  }`}
                  title={dl.full}
                >
                  <Clock size={12} /> {dl.text}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-surface-100 dark:bg-surface-700 text-surface-500 font-medium">
                  No deadline
                </span>
              )}
            </div>
          </div>
        </div>

        {assignment.instructions && (
          <div className="mt-5 prose prose-sm dark:prose-invert max-w-none prose-headings:font-display prose-p:leading-relaxed border-t border-surface-100 dark:border-surface-700 pt-4"
            dangerouslySetInnerHTML={{ __html: assignment.instructions }}
          />
        )}
      </div>

      {/* Question paper */}
      {assignment.has_attachment && (
        <div>
          <h2 className="text-sm font-semibold text-surface-600 dark:text-surface-300 mb-2 flex items-center gap-1.5">
            <FileText size={15} /> Question paper
          </h2>
          <Suspense fallback={<div className="card p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-surface-400" /></div>}>
            <PdfReader url={assignmentService.paperUrl(assignment.id)} />
          </Suspense>
        </div>
      )}

      {/* Grade result */}
      {graded && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-5 border-success-200 dark:border-success-800 bg-success-50/40 dark:bg-success-900/10"
        >
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-warning-500" />
            <div>
              <p className="text-sm text-surface-500">Your grade</p>
              <p className="text-2xl font-bold">
                {sub.marks != null ? sub.marks : '—'}
                {assignment.max_marks ? <span className="text-base font-medium text-surface-400"> / {assignment.max_marks}</span> : null}
              </p>
            </div>
          </div>
          {sub.feedback && (
            <div className="mt-4 pt-4 border-t border-success-200/60 dark:border-success-800/60">
              <p className="text-xs font-semibold text-surface-500 mb-1">Feedback</p>
              <p className="text-sm whitespace-pre-wrap text-surface-700 dark:text-surface-200">{sub.feedback}</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Submission status banner */}
      {sub && (
        <div className="flex items-center gap-2 text-sm text-success-700 dark:text-success-300">
          <CheckCircle2 size={16} />
          <span>
            Submitted on {new Date(sub.submitted_at).toLocaleString()}
            {sub.has_file && ' · PDF attached'}
            {graded ? ' · Graded' : ' · Awaiting grading'}
          </span>
        </div>
      )}

      {/* Submission form / locked state */}
      {isOpen ? (
        <form onSubmit={handleSubmit} className="card p-5 sm:p-6 space-y-4">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Send size={16} /> {sub ? 'Update your submission' : 'Submit your work'}
          </h2>
          {sub && (
            <p className="text-xs text-surface-400 -mt-2">
              Re-submitting will replace your previous submission{graded ? ' and reset your grade.' : '.'}
            </p>
          )}

          {canSubmitText && (
            <div>
              <label className="block text-sm font-medium text-surface-600 dark:text-surface-300 mb-1.5">
                Your answer
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={8}
                placeholder="Type your answer here…"
                className="input w-full resize-y font-normal"
              />
            </div>
          )}

          {canSubmitFile && (
            <div>
              <label className="block text-sm font-medium text-surface-600 dark:text-surface-300 mb-1.5">
                {canSubmitText ? 'Or upload a PDF' : 'Upload your PDF'}
              </label>
              <label className="flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed border-surface-200 dark:border-surface-700 cursor-pointer hover:border-primary-300 transition-colors">
                <Upload size={18} className="text-surface-400 shrink-0" />
                <span className="text-sm text-surface-500 truncate">
                  {file ? file.name : sub?.has_file ? 'A PDF is already attached — choose a new file to replace it' : 'Click to select a PDF file'}
                </span>
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={submitMutation.isPending}
            className="btn-primary w-full sm:w-auto inline-flex items-center justify-center gap-2"
          >
            {submitMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {sub ? 'Update submission' : 'Submit'}
          </button>
        </form>
      ) : (
        <div className="card p-6 flex items-center gap-3 text-surface-500">
          <Lock size={20} className="shrink-0" />
          <div>
            <p className="font-medium text-surface-700 dark:text-surface-200">This assignment is closed</p>
            <p className="text-sm">
              {sub ? 'The deadline has passed. Your submission was recorded.' : 'The deadline has passed and new submissions are no longer accepted.'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default AssignmentView
