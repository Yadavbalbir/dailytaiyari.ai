import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Users, CheckCircle2, Clock, Trophy, Code2,
  ChevronRight, FileText,
} from 'lucide-react'
import { contentBuilderService as svc } from '../services/contentBuilderService'
import Loading from '../components/common/Loading'

/**
 * Coding problem submissions overview (mirrors AssignmentGrading).
 * Shows counts, best submission per student (click → focused review), and the
 * students still to submit. Grading is automatic (test cases), so there is no
 * "needs grading" state — we surface solved / partial instead.
 */
const CodingGrading = () => {
  const { courseId, problemId } = useParams()
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['cb-coding-submissions', problemId],
    queryFn: () => svc.getCodingSubmissions(problemId),
    enabled: !!problemId,
  })

  if (isLoading) return <Loading fullScreen />

  const problem = data?.problem || {}
  const counts = data?.counts || { total_students: 0, submitted: 0, pending: 0, solved: 0 }
  const submissions = data?.submissions || []
  const pending = data?.pending_students || []

  const stats = [
    { label: 'Students', value: counts.total_students, icon: Users, tint: 'text-surface-500 bg-surface-100 dark:bg-surface-800' },
    { label: 'Submitted', value: counts.submitted, icon: CheckCircle2, tint: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Solved', value: counts.solved, icon: Trophy, tint: 'text-success-600 bg-success-50 dark:bg-success-900/20' },
    { label: 'Pending', value: counts.pending, icon: Clock, tint: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm flex-wrap">
        <button onClick={() => navigate(`/courses/${courseId}/manage`)} className="text-surface-500 hover:text-primary-600 flex items-center gap-1">
          <ArrowLeft size={16} /> Course Manager
        </button>
        {problem.topic_name && (
          <>
            <span className="text-surface-400">/</span>
            <span className="text-surface-500">{problem.topic_name}</span>
          </>
        )}
      </div>

      <div className="card p-6">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
            <Code2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-display font-bold">{problem.title || 'Coding problem'}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-surface-500">
              <span className="px-2 py-0.5 rounded bg-surface-100 dark:bg-surface-800 capitalize">{problem.status}</span>
              {problem.difficulty && <span className="px-2 py-0.5 rounded bg-surface-100 dark:bg-surface-800 capitalize">{problem.difficulty}</span>}
              {problem.max_marks != null && <span className="px-2 py-0.5 rounded bg-surface-100 dark:bg-surface-800">Max {problem.max_marks} marks</span>}
            </div>
          </div>
        </div>
      </div>

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

      <div className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-success-500" /> Submissions ({submissions.length})
        </h2>
        {submissions.length === 0 ? (
          <div className="card p-8 text-center text-surface-500">
            <FileText className="w-10 h-10 mx-auto mb-2 text-surface-300" />
            <p>No submissions yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {submissions.map((s, i) => (
              <motion.button
                key={s.id}
                type="button"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => navigate(`/courses/${courseId}/manage/coding/${problemId}/submissions/${s.id}`)}
                className="w-full text-left card p-4 flex items-center gap-4 hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-md transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 flex items-center justify-center font-semibold text-sm shrink-0">
                  {(s.student_name || s.student_email || '?').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{s.student_name || s.student_email}</p>
                  <p className="text-xs text-surface-400 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                    <span>{new Date(s.submitted_at).toLocaleString()}</span>
                    <span className="uppercase text-surface-500">{s.language}</span>
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {s.all_passed ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-400">
                      <Trophy className="w-3.5 h-3.5" /> {s.passed_count}/{s.total_count}
                      {problem.max_marks != null && s.marks != null ? ` · ${s.marks}/${problem.max_marks}` : ''}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">
                      {s.passed_count}/{s.total_count} passed
                    </span>
                  )}
                  <ChevronRight className="w-5 h-5 text-surface-300 group-hover:text-primary-500 transition-colors" />
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

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

export default CodingGrading
