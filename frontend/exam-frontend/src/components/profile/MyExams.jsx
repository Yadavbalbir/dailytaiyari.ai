import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { examService } from '../../services/examService'
import toast from 'react-hot-toast'
import { GraduationCap, PlusCircle, Clock, CheckCircle2, XCircle, RotateCcw } from 'lucide-react'

const statusMeta = {
  approved: { label: 'Active', cls: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300', icon: CheckCircle2 },
  pending: { label: 'Pending approval', cls: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300', icon: Clock },
  rejected: { label: 'Rejected', cls: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300', icon: XCircle },
}

const MyExams = () => {
  const queryClient = useQueryClient()
  const [selectedExam, setSelectedExam] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { data: enrollments = [], isLoading } = useQuery({
    queryKey: ['enrollments'],
    queryFn: async () => {
      const d = await examService.getEnrollments()
      return Array.isArray(d) ? d : (d?.results || [])
    },
  })

  const { data: availableRaw = [] } = useQuery({
    queryKey: ['availableExamsForEnroll'],
    queryFn: async () => {
      const d = await examService.getAvailableExamsForEnrollment()
      return Array.isArray(d) ? d : (d?.results || [])
    },
  })
  const available = Array.isArray(availableRaw) ? availableRaw : []

  const enrolledIds = new Set(enrollments.map((e) => e.exam))
  const requestable = available.filter((ex) => !enrolledIds.has(ex.id))

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['enrollments'] })
    queryClient.invalidateQueries({ queryKey: ['studyExams'] })
  }

  const requestEnroll = async (examId) => {
    if (!examId) return
    setSubmitting(true)
    try {
      await examService.enrollInExam(examId)
      toast.success('Request sent for admin approval')
      setSelectedExam('')
      refresh()
    } catch (err) {
      toast.error(err?.response?.data?.exam?.[0] || err?.response?.data?.detail || 'Request failed')
    } finally {
      setSubmitting(false)
    }
  }

  const dropExam = async (id) => {
    setSubmitting(true)
    try {
      await examService.unenroll(id)
      toast.success('Removed')
      refresh()
    } catch {
      toast.error('Could not remove')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="card p-6">
      <div className="flex items-center gap-2 mb-5">
        <GraduationCap size={20} className="text-primary-500" />
        <h2 className="text-lg font-semibold">My Exams</h2>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <select
          value={selectedExam}
          onChange={(e) => setSelectedExam(e.target.value)}
          className="input flex-1"
          disabled={!requestable.length}
        >
          <option value="">{requestable.length ? 'Select an exam to enroll…' : 'No more exams to enroll'}</option>
          {requestable.map((ex) => (
            <option key={ex.id} value={ex.id}>{ex.name}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => requestEnroll(selectedExam)}
          disabled={!selectedExam || submitting}
          className="btn primary inline-flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <PlusCircle size={18} />
          Request enrollment
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-surface-500">Loading…</p>
      ) : enrollments.length === 0 ? (
        <p className="text-sm text-surface-500">No exams yet. Request one above — your admin will review it.</p>
      ) : (
        <ul className="space-y-2">
          {enrollments.map((e) => {
            const meta = statusMeta[e.status] || statusMeta.pending
            const Icon = meta.icon
            return (
              <li key={e.id} className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg border border-surface-200 dark:border-surface-700">
                <div className="min-w-0">
                  <p className="font-medium truncate">{e.exam_name || e.exam}</p>
                  {e.status === 'rejected' && e.rejection_reason && (
                    <p className="text-xs text-red-500 mt-0.5">Reason: {e.rejection_reason}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${meta.cls}`}>
                    <Icon size={13} /> {meta.label}
                  </span>
                  {e.status === 'rejected' ? (
                    <button onClick={() => requestEnroll(e.exam)} disabled={submitting}
                      className="text-sm text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center gap-1">
                      <RotateCcw size={14} /> Re-request
                    </button>
                  ) : (
                    <button onClick={() => dropExam(e.id)} disabled={submitting}
                      className="text-sm text-red-600 dark:text-red-400 hover:underline inline-flex items-center gap-1">
                      <XCircle size={14} /> Drop
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default MyExams
