import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Briefcase, MapPin, Building2, ExternalLink, Clock, Users,
  ArrowRight, ClipboardList, Search,
} from 'lucide-react'
import { jobService } from '../services/jobService'
import { stageMeta, formatSalary, formatExperience } from '../components/jobs/jobShared'
import Loading from '../components/common/Loading'

const TABS = [
  { id: 'open', label: 'Open Positions' },
  { id: 'mine', label: 'My Applications' },
]

const JobCard = ({ job, onOpen }) => {
  const salary = formatSalary(job)
  const exp = formatExperience(job)
  const app = job.my_application
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onOpen(job)}
      className="w-full text-left card p-5 hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-md transition-all group"
    >
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
          <Briefcase className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-lg truncate">{job.title}</h3>
            {job.is_external ? (
              <span className="badge bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300 shrink-0">
                <ExternalLink className="w-3 h-3" /> External
              </span>
            ) : (
              <span className="badge badge-primary shrink-0">Internal</span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-surface-500">
            {job.department && <span className="inline-flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{job.department}</span>}
            {job.location && <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{job.location}</span>}
            {job.employment_type_display && <span className="px-2 py-0.5 rounded bg-surface-100 dark:bg-surface-800">{job.employment_type_display}</span>}
            {job.work_mode_display && <span className="px-2 py-0.5 rounded bg-surface-100 dark:bg-surface-800">{job.work_mode_display}</span>}
            {exp && <span className="px-2 py-0.5 rounded bg-surface-100 dark:bg-surface-800">{exp}</span>}
          </div>
          <div className="flex items-center justify-between gap-2 mt-3">
            <div className="text-sm font-medium text-surface-700 dark:text-surface-300">
              {salary || <span className="text-surface-400 font-normal">Salary not disclosed</span>}
            </div>
            {app ? (
              <span className={`badge ${stageMeta(app.stage).tint}`}>{stageMeta(app.stage).label}</span>
            ) : (
              <span className="text-primary-600 dark:text-primary-400 text-sm font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                View <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.button>
  )
}

const Jobs = () => {
  const navigate = useNavigate()
  const [tab, setTab] = useState('open')
  const [q, setQ] = useState('')

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['jobs', 'open'],
    queryFn: () => jobService.getJobs(),
  })
  const { data: mine = [], isLoading: mineLoading } = useQuery({
    queryKey: ['jobs', 'mine'],
    queryFn: () => jobService.myApplications(),
    enabled: tab === 'mine',
  })

  const filtered = jobs.filter((j) =>
    !q || j.title?.toLowerCase().includes(q.toLowerCase()) ||
    j.department?.toLowerCase().includes(q.toLowerCase()) ||
    j.location?.toLowerCase().includes(q.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-gradient p-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
            <Briefcase className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-white">Careers</h1>
            <p className="text-white/80 text-sm">Explore openings and track your applications</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-surface-200 dark:border-surface-800">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-surface-500 hover:text-surface-800 dark:hover:text-surface-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'open' ? (
        <>
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search jobs by title, team or location"
              className="input pl-9 py-2.5"
            />
          </div>
          {isLoading ? (
            <Loading />
          ) : filtered.length === 0 ? (
            <div className="card p-10 text-center text-surface-500">
              <Briefcase className="w-10 h-10 mx-auto mb-2 text-surface-300" />
              <p>No open positions right now. Check back soon!</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filtered.map((job) => (
                <JobCard key={job.id} job={job} onOpen={(j) => navigate(`/jobs/${j.id}`)} />
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {mineLoading ? (
            <Loading />
          ) : mine.length === 0 ? (
            <div className="card p-10 text-center text-surface-500">
              <ClipboardList className="w-10 h-10 mx-auto mb-2 text-surface-300" />
              <p>You haven't applied to any jobs yet.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {mine.map((app) => (
                <motion.button
                  key={app.id}
                  type="button"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => app.job?.id && navigate(`/jobs/${app.job.id}`)}
                  className="w-full text-left card p-5 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold truncate">{app.job?.title || 'Job'}</h3>
                      <p className="text-xs text-surface-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                        {app.job?.department && <span className="inline-flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{app.job.department}</span>}
                        {app.job?.location && <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{app.job.location}</span>}
                        <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" />Applied {new Date(app.applied_at).toLocaleDateString()}</span>
                      </p>
                    </div>
                    <span className={`badge shrink-0 ${stageMeta(app.stage).tint}`}>{stageMeta(app.stage).label}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Jobs
