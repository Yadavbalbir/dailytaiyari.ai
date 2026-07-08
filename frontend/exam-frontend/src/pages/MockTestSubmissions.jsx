import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Users, CheckCircle2, Clock, Trophy, FileText,
  ChevronRight, ClipboardList, AlertCircle, BarChart3,
} from 'lucide-react'
import { mockTestBuilderService as svc } from '../services/mockTestBuilderService'
import Loading from '../components/common/Loading'

/**
 * Admin submissions view for a single mock test — mirrors the assignment /
 * coding grading pages. Shows counts, average score, and the list of student
 * attempts; click one to open the focused per-attempt review + grading page.
 */
export default function MockTestSubmissions() {
  const { testId } = useParams()
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['mock-submissions', testId],
    queryFn: () => svc.submissions(testId),
    enabled: !!testId,
  })

  if (isLoading) return <Loading fullScreen />

  const test = data?.mock_test || {}
  const counts = data?.counts || { eligible: 0, submitted: 0, pending: 0, graded: 0 }
  const attempts = data?.attempts || []
  const avg = data?.average_score ?? 0

  const stats = [
    { label: 'Eligible', value: counts.eligible, icon: Users, tint: 'text-surface-500 bg-surface-100 dark:bg-surface-800' },
    { label: 'Submitted', value: counts.submitted, icon: CheckCircle2, tint: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Pending grading', value: counts.pending, icon: Clock, tint: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' },
    { label: 'Avg score', value: `${avg}%`, icon: BarChart3, tint: 'text-success-600 bg-success-50 dark:bg-success-900/20' },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm flex-wrap">
        <button
          onClick={() => navigate('/admin/mock-tests')}
          className="text-surface-500 hover:text-primary-600 flex items-center gap-1"
        >
          <ArrowLeft size={16} /> Mock Tests
        </button>
        <span className="text-surface-400">/</span>
        <button
          onClick={() => navigate(`/admin/mock-tests/${testId}`)}
          className="text-surface-500 hover:text-primary-600"
        >
          Edit
        </button>
        <span className="text-surface-400">/</span>
        <span className="text-surface-500">Submissions</span>
      </div>

      {/* Header */}
      <div className="card p-6">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-display font-bold">{test.title || 'Mock Test'}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-surface-500">
              <span className="px-2 py-0.5 rounded bg-surface-100 dark:bg-surface-800 capitalize">{test.status}</span>
              <span className="px-2 py-0.5 rounded bg-surface-100 dark:bg-surface-800">Total {test.total_marks} marks</span>
              <span className="px-2 py-0.5 rounded bg-surface-100 dark:bg-surface-800 inline-flex items-center gap-1">
                <Clock className="w-3 h-3" /> {test.duration_minutes} min
              </span>
              <span className="px-2 py-0.5 rounded bg-surface-100 dark:bg-surface-800">
                {test.result_visibility === 'immediate' ? 'Results: immediate' : (test.results_released ? 'Results: released' : 'Results: held')}
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

      {/* Attempts list */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-success-500" /> Submissions ({attempts.length})
        </h2>
        {attempts.length === 0 ? (
          <div className="card p-8 text-center text-surface-500">
            <FileText className="w-10 h-10 mx-auto mb-2 text-surface-300" />
            <p>No submissions yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {attempts.map((a, i) => (
              <motion.button
                key={a.attempt_id}
                type="button"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => navigate(`/admin/mock-tests/${testId}/submissions/${a.attempt_id}`)}
                className="w-full text-left card p-4 flex items-center gap-4 hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-md transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 flex items-center justify-center font-semibold text-sm shrink-0">
                  {(a.student_name || a.student_email || '?').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{a.student_name || a.student_email}</p>
                  <p className="text-xs text-surface-400 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                    {a.completed_at && <span>{new Date(a.completed_at).toLocaleString()}</span>}
                    {a.time_taken_seconds > 0 && (
                      <span className="text-surface-500">· {Math.round(a.time_taken_seconds / 60)} min taken</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-semibold text-surface-700 dark:text-surface-200">
                    {a.marks_obtained}/{a.total_marks}
                    <span className="text-surface-400 font-normal"> ({Math.round(a.percentage)}%)</span>
                  </span>
                  {a.pending_count > 0 ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">
                      <AlertCircle className="w-3.5 h-3.5" /> {a.pending_count} to grade
                    </span>
                  ) : a.grading_status === 'graded' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-400">
                      <Trophy className="w-3.5 h-3.5" /> Graded
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Auto-graded
                    </span>
                  )}
                  <ChevronRight className="w-5 h-5 text-surface-300 group-hover:text-primary-500 transition-colors" />
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
