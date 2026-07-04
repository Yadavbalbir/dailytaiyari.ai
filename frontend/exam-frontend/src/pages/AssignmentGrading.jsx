import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Users, CheckCircle2, Clock, Trophy, FileText,
  ChevronRight, Loader2, ClipboardList,
} from 'lucide-react'
import { contentBuilderService as svc } from '../services/contentBuilderService'
import Loading from '../components/common/Loading'

/**
 * Dedicated assignment grading page (replaces the old submissions pop-up).
 * Shows counts, the list of submissions (click to open a focused per-student
 * review page), and the students still to submit.
 */
const AssignmentGrading = () => {
  const { courseId, assignmentId } = useParams()
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['cb-submissions', assignmentId],
    queryFn: () => svc.getAssignmentSubmissions(assignmentId),
    enabled: !!assignmentId,
  })

  if (isLoading) return <Loading fullScreen />

  const assignment = data?.assignment || {}
  const counts = data?.counts || { enrolled: 0, submitted: 0, pending: 0, graded: 0 }
  const submitted = data?.submitted || []
  const pending = data?.pending || []

  const stats = [
    { label: 'Enrolled', value: counts.enrolled, icon: Users, tint: 'text-surface-500 bg-surface-100 dark:bg-surface-800' },
    { label: 'Submitted', value: counts.submitted, icon: CheckCircle2, tint: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Pending', value: counts.pending, icon: Clock, tint: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' },
    { label: 'Graded', value: counts.graded, icon: Trophy, tint: 'text-success-600 bg-success-50 dark:bg-success-900/20' },
  ]

  return (
    <div className="space-y-6">
      {/* Breadcrumb / back */}
      <div className="flex items-center gap-2 text-sm flex-wrap">
        <button
          onClick={() => navigate(`/courses/${courseId}/manage`)}
          className="text-surface-500 hover:text-primary-600 flex items-center gap-1"
        >
          <ArrowLeft size={16} /> Course Manager
        </button>
        {assignment.subject_name && (
          <>
            <span className="text-surface-400">/</span>
            <span className="text-surface-500">{assignment.subject_name}</span>
          </>
        )}
        {assignment.topic_name && (
          <>
            <span className="text-surface-400">/</span>
            <span className="text-surface-500">{assignment.topic_name}</span>
          </>
        )}
      </div>

      {/* Header */}
      <div className="card p-6">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-display font-bold">{assignment.title || 'Assignment'}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-surface-500">
              <span className="px-2 py-0.5 rounded bg-surface-100 dark:bg-surface-800 capitalize">{assignment.status}</span>
              <span className="px-2 py-0.5 rounded bg-surface-100 dark:bg-surface-800">
                {assignment.submission_type === 'pdf' ? 'PDF upload' : assignment.submission_type === 'text' ? 'Text answer' : 'Text or PDF'}
              </span>
              {assignment.max_marks != null && (
                <span className="px-2 py-0.5 rounded bg-surface-100 dark:bg-surface-800">Max {assignment.max_marks} marks</span>
              )}
              <span className="px-2 py-0.5 rounded bg-surface-100 dark:bg-surface-800 inline-flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {assignment.is_timed && assignment.due_at ? `Due ${new Date(assignment.due_at).toLocaleDateString()}` : 'No deadline'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="card p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.tint}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold leading-none">{s.value}</div>
              <div className="text-xs text-surface-500 mt-1">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Submissions list */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-success-500" /> Submissions ({submitted.length})
        </h2>
        {submitted.length === 0 ? (
          <div className="card p-8 text-center text-surface-500">
            <FileText className="w-10 h-10 mx-auto mb-2 text-surface-300" />
            <p>No submissions yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {submitted.map((s, i) => (
              <motion.button
                key={s.id}
                type="button"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => navigate(`/courses/${courseId}/manage/assignments/${assignmentId}/submissions/${s.id}`)}
                className="w-full text-left card p-4 flex items-center gap-4 hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-md transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 flex items-center justify-center font-semibold text-sm shrink-0">
                  {(s.student_name || s.student_email || '?').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{s.student_name || s.student_email}</p>
                  <p className="text-xs text-surface-400 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                    <span>{new Date(s.submitted_at).toLocaleString()}</span>
                    {s.file_stream_url && <span className="inline-flex items-center gap-1 text-surface-500"><FileText className="w-3 h-3" /> PDF</span>}
                    {s.submission_text && <span className="text-surface-500">Text answer</span>}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {s.status === 'graded' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-400">
                      <Trophy className="w-3.5 h-3.5" />
                      {s.marks != null ? `${s.marks}${assignment.max_marks ? `/${assignment.max_marks}` : ''}` : 'Graded'}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">
                      Needs grading
                    </span>
                  )}
                  <ChevronRight className="w-5 h-5 text-surface-300 group-hover:text-primary-500 transition-colors" />
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* Pending */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Users className="w-5 h-5 text-surface-400" /> Yet to submit ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="text-sm text-surface-400">Everyone enrolled has submitted. 🎉</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {pending.map((p) => (
              <span key={p.student} className="text-xs px-3 py-1.5 rounded-full bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300">
                {p.student_name || p.student_email}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AssignmentGrading
