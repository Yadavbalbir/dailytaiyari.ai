import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  ArrowLeft, Mail, Phone, Linkedin, Globe, FileText, Loader2, Send,
  MessageSquarePlus, ArrowRightCircle, User, Clock,
} from 'lucide-react'
import { jobAdminService } from '../services/jobService'
import { PIPELINE_STAGES, stageMeta } from '../components/jobs/jobShared'
import PdfReader from '../components/content/PdfReader'
import MathRenderer from '../components/chat/MathRenderer'
import Loading from '../components/common/Loading'

const MOVE_STAGES = [...PIPELINE_STAGES, 'rejected']

const JobApplicationReview = () => {
  const { jobId, applicationId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [note, setNote] = useState('')
  const [stageNote, setStageNote] = useState('')
  const [targetStage, setTargetStage] = useState('')

  const { data: app, isLoading } = useQuery({
    queryKey: ['admin-application', applicationId],
    queryFn: () => jobAdminService.getApplication(applicationId),
    enabled: !!applicationId,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-application', applicationId] })
    queryClient.invalidateQueries({ queryKey: ['admin-job-applications', jobId] })
  }

  const move = useMutation({
    mutationFn: () => jobAdminService.moveStage(applicationId, targetStage, stageNote),
    onSuccess: () => { toast.success('Stage updated.'); setStageNote(''); setTargetStage(''); invalidate() },
    onError: (e) => toast.error(e?.response?.data?.error || 'Could not update stage.'),
  })

  const addNote = useMutation({
    mutationFn: () => jobAdminService.addNote(applicationId, note),
    onSuccess: () => { toast.success('Note added.'); setNote(''); invalidate() },
    onError: (e) => toast.error(e?.response?.data?.error || 'Could not add note.'),
  })

  if (isLoading) return <Loading fullScreen />
  if (!app) return null

  const meta = stageMeta(app.stage)
  const events = app.events || []

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(`/admin/jobs/${jobId}`)}
        className="text-surface-500 hover:text-primary-600 flex items-center gap-1 text-sm"
      >
        <ArrowLeft size={16} /> Pipeline
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: candidate + resume */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 flex items-center justify-center text-lg font-semibold shrink-0">
                {(app.student_name || app.full_name || '?').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-display font-bold">{app.student_name || app.full_name}</h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-surface-600 dark:text-surface-300">
                  {app.student_email && <span className="inline-flex items-center gap-1.5"><Mail className="w-4 h-4 text-surface-400" />{app.student_email}</span>}
                  {app.phone && <span className="inline-flex items-center gap-1.5"><Phone className="w-4 h-4 text-surface-400" />{app.phone}</span>}
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
                  {app.linkedin_url && <a href={app.linkedin_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary-600 hover:underline"><Linkedin className="w-4 h-4" />LinkedIn</a>}
                  {app.portfolio_url && <a href={app.portfolio_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary-600 hover:underline"><Globe className="w-4 h-4" />Portfolio</a>}
                </div>
                <div className="mt-3">
                  <span className={`badge ${meta.tint}`}>{meta.label}</span>
                </div>
              </div>
            </div>

            {app.cover_letter && (
              <div className="mt-5 pt-5 border-t border-surface-100 dark:border-surface-800">
                <h3 className="font-semibold mb-2 text-sm">Cover letter</h3>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <MathRenderer content={app.cover_letter} />
                </div>
              </div>
            )}
          </div>

          {/* Resume */}
          <div className="card p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><FileText className="w-4 h-4 text-surface-400" /> Resume</h3>
            {app.resume_stream_url ? (
              <PdfReader url={app.resume_stream_url} />
            ) : (
              <p className="text-sm text-surface-400">No resume was uploaded.</p>
            )}
          </div>
        </div>

        {/* Right: actions + timeline */}
        <div className="space-y-6">
          {/* Move stage */}
          <div className="card p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><ArrowRightCircle className="w-4 h-4 text-primary-500" /> Move stage</h3>
            <div className="space-y-3">
              <select
                value={targetStage}
                onChange={(e) => setTargetStage(e.target.value)}
                className="input py-2.5"
              >
                <option value="">Select stage…</option>
                {MOVE_STAGES.map((s) => (
                  <option key={s} value={s} disabled={s === app.stage}>
                    {stageMeta(s).label}{s === app.stage ? ' (current)' : ''}
                  </option>
                ))}
              </select>
              <textarea
                rows={2}
                value={stageNote}
                onChange={(e) => setStageNote(e.target.value)}
                placeholder="Optional note for the timeline"
                className="input"
              />
              <button
                onClick={() => { if (!targetStage) { toast.error('Pick a stage.'); return } move.mutate() }}
                disabled={move.isPending}
                className="btn-primary w-full inline-flex items-center justify-center gap-2"
              >
                {move.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Update stage
              </button>
            </div>
          </div>

          {/* Add note */}
          <div className="card p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><MessageSquarePlus className="w-4 h-4 text-primary-500" /> Add note</h3>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Internal note about this candidate…"
              className="input mb-3"
            />
            <button
              onClick={() => { if (!note.trim()) { toast.error('Write a note first.'); return } addNote.mutate() }}
              disabled={addNote.isPending}
              className="btn-secondary w-full inline-flex items-center justify-center gap-2"
            >
              {addNote.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquarePlus className="w-4 h-4" />}
              Save note
            </button>
          </div>

          {/* Timeline */}
          <div className="card p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><Clock className="w-4 h-4 text-surface-400" /> Timeline</h3>
            {events.length === 0 ? (
              <p className="text-sm text-surface-400">No activity yet.</p>
            ) : (
              <ol className="space-y-4">
                {events.map((ev) => (
                  <li key={ev.id} className="relative pl-6">
                    <span className="absolute left-0 top-1 w-2.5 h-2.5 rounded-full bg-primary-400" />
                    <div className="text-sm">
                      {ev.event_type === 'stage_change' ? (
                        <p>
                          Moved{ev.from_stage_display ? ` from ${ev.from_stage_display}` : ''} to{' '}
                          <span className="font-medium">{ev.to_stage_display}</span>
                        </p>
                      ) : ev.event_type === 'applied' ? (
                        <p className="font-medium">{ev.note || 'Applied'}</p>
                      ) : (
                        <p>{ev.note}</p>
                      )}
                      {ev.event_type === 'stage_change' && ev.note && (
                        <p className="text-surface-500 mt-0.5">{ev.note}</p>
                      )}
                      <p className="text-[11px] text-surface-400 mt-1 flex items-center gap-1">
                        <User className="w-3 h-3" />{ev.created_by_name} · {new Date(ev.created_at).toLocaleString()}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default JobApplicationReview
