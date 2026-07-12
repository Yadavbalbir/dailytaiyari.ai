import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  ArrowLeft, Briefcase, MapPin, Building2, ExternalLink, Clock, Upload,
  Loader2, CheckCircle2, FileText, Send, XCircle, Flag, AlertTriangle,
} from 'lucide-react'
import { jobService } from '../services/jobService'
import { useAuthStore } from '../context/authStore'
import { stageMeta, formatSalary, formatExperience, categoryMeta } from '../components/jobs/jobShared'
import JobContent from '../components/jobs/JobContent'
import Loading from '../components/common/Loading'

const Meta = ({ icon: Icon, children }) => children ? (
  <span className="inline-flex items-center gap-1.5 text-sm text-surface-600 dark:text-surface-300">
    <Icon className="w-4 h-4 text-surface-400" /> {children}
  </span>
) : null

const JobDetail = () => {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const [showApply, setShowApply] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [reportForm, setReportForm] = useState({ reason: 'closed', note: '' })
  const [form, setForm] = useState({ cover_letter: '', phone: '', portfolio_url: '', linkedin_url: '' })
  const [resume, setResume] = useState(null)

  // Any action that writes (apply, withdraw, report) needs a logged-in user.
  const requireAuth = (fn) => () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/jobs/${jobId}` } })
      return
    }
    fn()
  }

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => jobService.get(jobId),
    enabled: !!jobId,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['job', jobId] })
    queryClient.invalidateQueries({ queryKey: ['jobs'] })
  }

  const applyMutation = useMutation({
    mutationFn: () => jobService.apply(jobId, { ...form, resume }),
    onSuccess: () => {
      toast.success('Application submitted! You can track its progress under My Applications.')
      setShowApply(false)
      invalidate()
    },
    onError: (e) => toast.error(e?.response?.data?.error || 'Could not submit application.'),
  })

  const externalMutation = useMutation({
    mutationFn: () => jobService.applyExternal(jobId),
    onSuccess: (data) => {
      toast.success(data?.message || "You'll complete your application on the external site.")
      if (data?.external_url) window.open(data.external_url, '_blank', 'noopener')
      invalidate()
    },
    onError: (e) => toast.error(e?.response?.data?.error || 'Something went wrong.'),
  })

  const withdrawMutation = useMutation({
    mutationFn: () => jobService.withdraw(jobId),
    onSuccess: () => { toast.success('Application withdrawn.'); invalidate() },
    onError: (e) => toast.error(e?.response?.data?.error || 'Could not withdraw.'),
  })

  const reportMutation = useMutation({
    mutationFn: () => jobService.report(jobId, reportForm),
    onSuccess: (data) => {
      toast.success(data?.message || 'Thanks — your report has been recorded.')
      setShowReport(false)
      if (data?.archived) { navigate('/jobs'); return }
      invalidate()
    },
    onError: (e) => toast.error(e?.response?.data?.error || 'Could not submit report.'),
  })

  if (isLoading) return <Loading fullScreen />
  if (!job) return null

  const app = job.my_application
  const salary = formatSalary(job)
  const exp = formatExperience(job)
  const closed = !job.is_open
  const hasActiveApp = app && app.is_active

  const onFile = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.type !== 'application/pdf') {
      toast.error('Please upload a PDF resume.')
      return
    }
    setResume(f)
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <button
        onClick={() => navigate('/jobs')}
        className="text-surface-500 hover:text-primary-600 flex items-center gap-1 text-sm"
      >
        <ArrowLeft size={16} /> Back to Careers
      </button>

      {/* Header card */}
      <div className="card p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
            <Briefcase className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <h1 className="text-2xl font-display font-bold">{job.title}</h1>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`badge ${categoryMeta(job.category).tint}`}>{categoryMeta(job.category).label}</span>
                {job.is_external ? (
                  <span className="badge bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300"><ExternalLink className="w-3 h-3" /> External</span>
                ) : (
                  <span className="badge badge-primary">Internal</span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3">
              <Meta icon={Building2}>{job.department}</Meta>
              <Meta icon={MapPin}>{job.location}</Meta>
              <Meta icon={Briefcase}>{job.employment_type_display}</Meta>
              <Meta icon={Clock}>{job.work_mode_display}</Meta>
              {exp && <Meta icon={Clock}>{exp}</Meta>}
            </div>
            {salary && <p className="mt-3 font-semibold text-surface-800 dark:text-surface-200">{salary}</p>}
            {job.deadline && (
              <p className="mt-2 text-xs text-surface-500">
                Apply by {new Date(job.deadline).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {/* Application status / CTA */}
        <div className="mt-5 pt-5 border-t border-surface-100 dark:border-surface-800">
          {app ? (
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-success-500" />
                <span className="text-sm">
                  {app.is_external
                    ? 'You have applied externally for this role.'
                    : 'Your application status:'}
                </span>
                <span className={`badge ${stageMeta(app.stage).tint}`}>{stageMeta(app.stage).label}</span>
              </div>
              <div className="flex items-center gap-2">
                {job.is_external && job.external_url && (
                  <a
                    href={job.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary text-sm inline-flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-4 h-4" /> Go to job page
                  </a>
                )}
                {!job.is_external && hasActiveApp && (
                  <button
                    onClick={() => withdrawMutation.mutate()}
                    disabled={withdrawMutation.isPending}
                    className="btn-secondary text-sm inline-flex items-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" /> Withdraw
                  </button>
                )}
              </div>
            </div>
          ) : closed ? (
            <p className="text-sm text-surface-500">This position is no longer accepting applications.</p>
          ) : job.is_external ? (
            <button
              onClick={requireAuth(() => externalMutation.mutate())}
              disabled={externalMutation.isPending}
              className="btn-primary inline-flex items-center gap-2"
            >
              {externalMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
              {isAuthenticated ? 'Apply on external site' : 'Log in to apply'}
            </button>
          ) : (
            <button onClick={requireAuth(() => setShowApply(true))} className="btn-primary inline-flex items-center gap-2">
              <Send className="w-4 h-4" /> {isAuthenticated ? 'Apply now' : 'Log in to apply'}
            </button>
          )}
        </div>
      </div>

      {/* Description */}
      {job.description && (
        <div className="card p-6">
          <h2 className="font-semibold text-lg mb-3">About the role</h2>
          <JobContent content={job.description} />
        </div>
      )}

      {/* Requirements */}
      {job.requirements && (
        <div className="card p-6">
          <h2 className="font-semibold text-lg mb-3">Requirements</h2>
          <JobContent content={job.requirements} />
        </div>
      )}

      {/* Report as closed */}
      {job.my_report ? (
        <div className="card p-4 border-amber-200 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-900/10">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-sm text-surface-700 dark:text-surface-300">
              <p className="font-medium text-amber-700 dark:text-amber-300">Thanks — we're reviewing your report.</p>
              <p className="mt-0.5">
                Once <strong>{job.report_threshold ?? 3}</strong> or more students report this opening as closed,
                we'll archive it automatically so it drops off the board.
                {typeof job.reports_count === 'number' && (
                  <> Currently <strong>{job.reports_count}</strong> of {job.report_threshold ?? 3} reports.</>
                )}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 flex-wrap px-1">
          <p className="text-xs text-surface-500">Is this opening no longer active?</p>
          <button
            onClick={requireAuth(() => setShowReport(true))}
            className="text-sm inline-flex items-center gap-1.5 text-surface-500 hover:text-error-600 dark:hover:text-error-400 transition-colors"
          >
            <Flag className="w-4 h-4" /> Report as closed
          </button>
        </div>
      )}

      {/* Report modal */}
      {showReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowReport(false)}>
          <div className="card p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-1">
              <Flag className="w-5 h-5 text-error-500" />
              <h2 className="text-xl font-display font-bold">Report this opening</h2>
            </div>
            <p className="text-sm text-surface-500 mb-5">
              Let us know if this position is closed or the link no longer works. Once{' '}
              {job.report_threshold ?? 3} or more students report it, we'll archive it automatically.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Reason</label>
                <select
                  value={reportForm.reason}
                  onChange={(e) => setReportForm((s) => ({ ...s, reason: e.target.value }))}
                  className="input py-2.5"
                >
                  <option value="closed">Position closed / filled</option>
                  <option value="expired">Link expired or unavailable</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Note (optional)</label>
                <textarea
                  rows={3}
                  value={reportForm.note}
                  onChange={(e) => setReportForm((s) => ({ ...s, note: e.target.value }))}
                  placeholder="Anything else we should know?"
                  className="input"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-6">
              <button onClick={() => setShowReport(false)} className="btn-secondary">Cancel</button>
              <button
                onClick={() => reportMutation.mutate()}
                disabled={reportMutation.isPending}
                className="btn-primary inline-flex items-center gap-2"
              >
                {reportMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flag className="w-4 h-4" />}
                Submit report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Apply modal (internal) */}
      {showApply && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowApply(false)}>
          <div className="card p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-display font-bold mb-1">Apply — {job.title}</h2>
            <p className="text-sm text-surface-500 mb-5">Submit your resume and a short cover letter.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Resume (PDF) <span className="text-error-500">*</span></label>
                <label className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-surface-300 dark:border-surface-700 cursor-pointer hover:border-primary-400 transition-colors">
                  <Upload className="w-5 h-5 text-surface-400" />
                  <span className="text-sm text-surface-600 dark:text-surface-300 truncate">
                    {resume ? resume.name : 'Click to upload your resume'}
                  </span>
                  <input type="file" accept="application/pdf" onChange={onFile} className="hidden" />
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Cover letter</label>
                <textarea
                  rows={5}
                  value={form.cover_letter}
                  onChange={(e) => setForm((s) => ({ ...s, cover_letter: e.target.value }))}
                  placeholder="Tell us why you're a great fit…"
                  className="input"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Phone</label>
                  <input value={form.phone} onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))} className="input py-2.5" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">LinkedIn</label>
                  <input value={form.linkedin_url} onChange={(e) => setForm((s) => ({ ...s, linkedin_url: e.target.value }))} placeholder="https://" className="input py-2.5" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Portfolio / Website</label>
                <input value={form.portfolio_url} onChange={(e) => setForm((s) => ({ ...s, portfolio_url: e.target.value }))} placeholder="https://" className="input py-2.5" />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-6">
              <button onClick={() => setShowApply(false)} className="btn-secondary">Cancel</button>
              <button
                onClick={() => {
                  if (!resume) { toast.error('Please upload a PDF resume.'); return }
                  applyMutation.mutate()
                }}
                disabled={applyMutation.isPending}
                className="btn-primary inline-flex items-center gap-2"
              >
                {applyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                Submit application
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default JobDetail
