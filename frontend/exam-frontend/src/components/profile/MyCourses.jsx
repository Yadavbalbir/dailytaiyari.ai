import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { courseService } from '../../services/courseService'
import toast from 'react-hot-toast'
import { GraduationCap, PlusCircle, Clock, CheckCircle2, XCircle, RotateCcw } from 'lucide-react'

const statusMeta = {
  approved: { label: 'Active', cls: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300', icon: CheckCircle2 },
  pending: { label: 'Pending approval', cls: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300', icon: Clock },
  rejected: { label: 'Rejected', cls: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300', icon: XCircle },
}

const MyCourses = () => {
  const queryClient = useQueryClient()
  const [selectedCourse, setSelectedCourse] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { data: enrollments = [], isLoading } = useQuery({
    queryKey: ['enrollments'],
    queryFn: async () => {
      const d = await courseService.getEnrollments()
      return Array.isArray(d) ? d : (d?.results || [])
    },
  })

  const { data: availableRaw = [] } = useQuery({
    queryKey: ['availableCourses'],
    queryFn: async () => {
      const d = await courseService.getAvailableCoursesForEnrollment()
      return Array.isArray(d) ? d : (d?.results || [])
    },
  })
  const available = Array.isArray(availableRaw) ? availableRaw : []

  const enrolledIds = new Set(enrollments.map((e) => e.course))
  const requestable = available.filter((c) => !enrolledIds.has(c.id))

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['enrollments'] })
    queryClient.invalidateQueries({ queryKey: ['studyCourses'] })
  }

  const requestEnroll = async (courseId) => {
    if (!courseId) return
    setSubmitting(true)
    try {
      await courseService.requestEnrollment(courseId)
      toast.success('Request sent for admin approval')
      setSelectedCourse('')
      refresh()
    } catch (err) {
      toast.error(err?.response?.data?.course?.[0] || err?.response?.data?.detail || 'Request failed')
    } finally {
      setSubmitting(false)
    }
  }

  const dropCourse = async (id) => {
    setSubmitting(true)
    try {
      await courseService.unenroll(id)
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
        <h2 className="text-lg font-semibold">My Courses</h2>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="input flex-1"
          disabled={!requestable.length}
        >
          <option value="">{requestable.length ? 'Select a course to enroll…' : 'No more courses to enroll'}</option>
          {requestable.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => requestEnroll(selectedCourse)}
          disabled={!selectedCourse || submitting}
          className="btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <PlusCircle size={18} />
          Request enrollment
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-surface-500">Loading…</p>
      ) : enrollments.length === 0 ? (
        <p className="text-sm text-surface-500">No courses yet. Request one above — your admin will review it.</p>
      ) : (
        <ul className="space-y-2">
          {enrollments.map((e) => {
            const meta = statusMeta[e.status] || statusMeta.pending
            const Icon = meta.icon
            return (
              <li key={e.id} className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg border border-surface-200 dark:border-surface-700">
                <div className="min-w-0">
                  <p className="font-medium truncate">{e.course_name || e.course}</p>
                  {e.status === 'rejected' && e.rejection_reason && (
                    <p className="text-xs text-red-500 mt-0.5">Reason: {e.rejection_reason}</p>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${meta.cls}`}>
                    <Icon size={13} /> {meta.label}
                  </span>
                  {e.status === 'rejected' ? (
                    <button onClick={() => requestEnroll(e.course)} disabled={submitting}
                      className="text-sm text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center gap-1">
                      <RotateCcw size={14} /> Re-request
                    </button>
                  ) : (
                    <button onClick={() => dropCourse(e.id)} disabled={submitting}
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

export default MyCourses
