import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Users, ExternalLink, FileText, ChevronRight, Briefcase, Mail,
} from 'lucide-react'
import { jobAdminService } from '../services/jobService'
import { PIPELINE_STAGES, stageMeta } from '../components/jobs/jobShared'
import Loading from '../components/common/Loading'

const COLUMN_STAGES = [...PIPELINE_STAGES, 'rejected']

const ApplicantCard = ({ app, onOpen }) => (
  <motion.button
    layout
    type="button"
    onClick={() => onOpen(app)}
    className="w-full text-left rounded-xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 p-3 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-sm transition-all group"
  >
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 flex items-center justify-center text-xs font-semibold shrink-0">
        {(app.student_name || app.student_email || '?').charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{app.student_name || app.student_email}</p>
        <p className="text-[11px] text-surface-400 truncate">{new Date(app.applied_at).toLocaleDateString()}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-surface-300 group-hover:text-primary-500 shrink-0" />
    </div>
    {app.resume_stream_url && (
      <span className="mt-2 inline-flex items-center gap-1 text-[11px] text-surface-500">
        <FileText className="w-3 h-3" /> Resume
      </span>
    )}
  </motion.button>
)

const JobApplicants = () => {
  const { jobId } = useParams()
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-job-applications', jobId],
    queryFn: () => jobAdminService.getApplications(jobId),
    enabled: !!jobId,
  })

  if (isLoading) return <Loading fullScreen />

  const job = data?.job || {}
  const apps = data?.applications || []
  const counts = data?.stage_counts || {}
  const total = data?.total ?? apps.length

  const byStage = (stage) => apps.filter((a) => a.stage === stage)
  const externalApps = apps.filter((a) => a.is_external)

  const openApp = (app) => navigate(`/admin/jobs/${jobId}/applications/${app.id}`)

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/admin/jobs')} className="text-surface-500 hover:text-primary-600 flex items-center gap-1 text-sm">
        <ArrowLeft size={16} /> Jobs
      </button>

      <div className="card p-6">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
            <Briefcase className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-display font-bold">{job.title}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-surface-500">
              <span className="px-2 py-0.5 rounded bg-surface-100 dark:bg-surface-800 capitalize">{job.status}</span>
              <span className="px-2 py-0.5 rounded bg-surface-100 dark:bg-surface-800 inline-flex items-center gap-1"><Users className="w-3 h-3" />{total} total</span>
              {job.openings != null && <span className="px-2 py-0.5 rounded bg-surface-100 dark:bg-surface-800">{job.openings} opening{job.openings === 1 ? '' : 's'}</span>}
            </div>
          </div>
        </div>
      </div>

      {job.is_external ? (
        <div className="space-y-3">
          <h2 className="font-semibold flex items-center gap-2"><ExternalLink className="w-4 h-4 text-indigo-500" /> External applicants ({externalApps.length})</h2>
          {externalApps.length === 0 ? (
            <p className="text-sm text-surface-400">No one has clicked through yet.</p>
          ) : (
            <div className="grid gap-2">
              {externalApps.map((a) => (
                <div key={a.id} className="card p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-sm font-semibold">
                    {(a.student_name || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{a.student_name}</p>
                    <p className="text-xs text-surface-500 inline-flex items-center gap-1"><Mail className="w-3 h-3" />{a.student_email}</p>
                  </div>
                  <span className="text-xs text-surface-400">{new Date(a.applied_at).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {COLUMN_STAGES.map((stage) => {
              const items = byStage(stage)
              const meta = stageMeta(stage)
              return (
                <div key={stage} className="w-64 shrink-0">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <span className={`badge ${meta.tint}`}>{meta.label}</span>
                    <span className="text-xs text-surface-400">{counts[stage] || 0}</span>
                  </div>
                  <div className="space-y-2 min-h-[80px] rounded-xl bg-surface-50 dark:bg-surface-800/40 p-2">
                    {items.length === 0 ? (
                      <p className="text-[11px] text-surface-400 text-center py-4">Empty</p>
                    ) : (
                      items.map((a) => <ApplicantCard key={a.id} app={a} onOpen={openApp} />)
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default JobApplicants
