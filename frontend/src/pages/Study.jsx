import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { examService } from '../services/examService'
import { useAuthStore } from '../context/authStore'
import Loading from '../components/common/Loading'
import toast from 'react-hot-toast'
import {
  BookOpen, Atom, FlaskConical, Calculator, Leaf, Bug,
  ChevronRight, GraduationCap, ChevronDown, PlusCircle, Settings2, XCircle
} from 'lucide-react'

const iconMap = {
  'atom': Atom,
  'flask-conical': FlaskConical,
  'calculator': Calculator,
  'leaf': Leaf,
  'bug': Bug,
}

const Study = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { profile } = useAuthStore()
  const primaryExamId = profile?.primary_exam ?? null

  const [selectedExamId, setSelectedExamId] = useState(primaryExamId || '')
  const [showEnroll, setShowEnroll] = useState(false)
  const [showManageEnroll, setShowManageEnroll] = useState(false)
  const [enrollingId, setEnrollingId] = useState(null)
  const [unenrollingId, setUnenrollingId] = useState(null)
  const [selectedExamsToEnroll, setSelectedExamsToEnroll] = useState([]) // multi-select for enroll

  const { data: exams = [], isLoading: examsLoading } = useQuery({
    queryKey: ['studyExams'],
    queryFn: () => examService.getStudyExams(),
  })

  const { data: enrollmentsList = [], isLoading: enrollmentsLoading } = useQuery({
    queryKey: ['enrollments'],
    queryFn: async () => {
      const data = await examService.getEnrollments()
      return Array.isArray(data) ? data : (data?.results || [])
    },
    enabled: showEnroll || showManageEnroll,
  })

  const { data: allExamsRaw = [], isLoading: availableLoading } = useQuery({
    queryKey: ['availableExamsForEnroll'],
    queryFn: async () => {
      const data = await examService.getAvailableExamsForEnrollment()
      return Array.isArray(data) ? data : (data?.results || [])
    },
    enabled: showEnroll || showManageEnroll,
  })
  const availableExams = Array.isArray(allExamsRaw) ? allExamsRaw : []
  const enrolledExamIds = new Set((enrollmentsList || []).map((e) => e.exam || e.exam_id))
  const examsToEnroll = availableExams.filter((ex) => !enrolledExamIds.has(ex.id))

  const { data: subjects, isLoading: subjectsLoading } = useQuery({
    queryKey: ['studySubjects', selectedExamId],
    queryFn: () => examService.getStudySubjects(selectedExamId),
    enabled: !!selectedExamId,
  })

  useEffect(() => {
    if (primaryExamId && !selectedExamId) setSelectedExamId(primaryExamId)
  }, [primaryExamId, selectedExamId])

  useEffect(() => {
    if (exams?.length === 1 && !selectedExamId) setSelectedExamId(exams[0].id)
  }, [exams, selectedExamId])

  useEffect(() => {
    if (exams?.length && selectedExamId && !exams.some((e) => e.id === selectedExamId)) {
      setSelectedExamId(exams[0]?.id || '')
    }
  }, [exams, selectedExamId])

  const selectedExam = exams?.find((e) => e.id === selectedExamId)
  const isLoading = examsLoading || (!!selectedExamId && subjectsLoading)

  if (examsLoading && !exams?.length) return <Loading fullScreen />

  const handleEnroll = async (examId) => {
    setEnrollingId(examId)
    try {
      await examService.enrollInExam(examId)
      toast.success('Enrolled successfully')
      setShowEnroll(false)
      setShowManageEnroll(false)
      setSelectedExamsToEnroll([])
      queryClient.invalidateQueries({ queryKey: ['studyExams'] })
      queryClient.invalidateQueries({ queryKey: ['enrollments'] })
    } catch (err) {
      toast.error(err?.response?.data?.exam?.[0] || err?.response?.data?.detail || 'Enrollment failed')
    } finally {
      setEnrollingId(null)
    }
  }

  const handleEnrollMultiple = async (examIds) => {
    if (!examIds?.length) return
    setEnrollingId('multiple')
    try {
      for (const examId of examIds) {
        await examService.enrollInExam(examId)
      }
      toast.success(`Enrolled in ${examIds.length} exam${examIds.length > 1 ? 's' : ''}`)
      setShowEnroll(false)
      setShowManageEnroll(false)
      setSelectedExamsToEnroll([])
      queryClient.invalidateQueries({ queryKey: ['studyExams'] })
      queryClient.invalidateQueries({ queryKey: ['enrollments'] })
    } catch (err) {
      toast.error(err?.response?.data?.exam?.[0] || err?.response?.data?.detail || 'Enrollment failed')
    } finally {
      setEnrollingId(null)
    }
  }

  const toggleExamSelection = (examId) => {
    setSelectedExamsToEnroll((prev) =>
      prev.includes(examId) ? prev.filter((id) => id !== examId) : [...prev, examId]
    )
  }

  const handleUnenroll = async (enrollmentId) => {
    setUnenrollingId(enrollmentId)
    try {
      await examService.unenroll(enrollmentId)
      toast.success('Unenrolled')
      setShowManageEnroll(false)
      queryClient.invalidateQueries({ queryKey: ['studyExams'] })
      queryClient.invalidateQueries({ queryKey: ['enrollments'] })
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Unenroll failed')
    } finally {
      setUnenrollingId(null)
    }
  }

  if (!examsLoading && (!exams || exams.length === 0)) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Study</h1>
          <p className="text-surface-500 mt-1">Study content for your enrolled exams</p>
        </div>
        <div className="card p-8 text-center text-surface-600 dark:text-surface-400">
          <GraduationCap size={48} className="mx-auto mb-3 text-surface-400" />
          <p className="font-medium">You are not enrolled in any exam</p>
          <p className="mt-1 text-sm mb-6">Enroll in one or more exams to see subjects and study content here.</p>
          <button
            type="button"
            onClick={() => setShowEnroll(true)}
            className="btn primary inline-flex items-center gap-2"
          >
            <PlusCircle size={20} />
            Enroll in exam(s)
          </button>
        </div>

        {showEnroll && (
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-2">Choose one or more exams to enroll</h3>
            <p className="text-sm text-surface-500 mb-4">Use the dropdown or checkboxes below. You can select multiple exams.</p>
            {availableLoading ? (
              <Loading />
            ) : availableExams.length === 0 ? (
              <p className="text-surface-500">No exams available to enroll.</p>
            ) : (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-surface-600 dark:text-surface-400 mb-2">Select exam (dropdown)</label>
                  <select
                    value={selectedExamsToEnroll[0] || ''}
                    onChange={(e) => {
                      const id = e.target.value || null
                      if (id) setSelectedExamsToEnroll((prev) => (prev.includes(id) ? prev : [id, ...prev]))
                    }}
                    className="input py-2.5 pl-3 pr-10 w-full max-w-md"
                  >
                    <option value="">Choose an exam…</option>
                    {availableExams.map((exam) => (
                      <option key={exam.id} value={exam.id}>{exam.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => selectedExamsToEnroll[0] && handleEnroll(selectedExamsToEnroll[0])}
                    disabled={!selectedExamsToEnroll.length || enrollingId !== null}
                    className="btn primary mt-2 text-sm disabled:opacity-50"
                  >
                    {enrollingId === selectedExamsToEnroll[0] ? 'Enrolling…' : 'Enroll in selected exam'}
                  </button>
                </div>
                <ul className="space-y-2">
                  {availableExams.map((exam) => (
                    <li key={exam.id}>
                      <label className="flex items-center gap-3 px-4 py-3 rounded-lg border border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedExamsToEnroll.includes(exam.id)}
                          onChange={() => toggleExamSelection(exam.id)}
                          disabled={enrollingId !== null}
                          className="rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="flex-1">{exam.name}</span>
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); handleEnroll(exam.id) }}
                          disabled={enrollingId !== null}
                          className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                        >
                          Enroll only this
                        </button>
                      </label>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap items-center gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => handleEnrollMultiple(selectedExamsToEnroll)}
                    disabled={!selectedExamsToEnroll.length || enrollingId !== null}
                    className="btn primary inline-flex items-center gap-2 disabled:opacity-50"
                  >
                    {enrollingId === 'multiple' ? (
                      'Enrolling…'
                    ) : (
                      <>
                        <PlusCircle size={18} />
                        Enroll in selected ({selectedExamsToEnroll.length})
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowEnroll(false); setSelectedExamsToEnroll([]) }}
                    className="text-sm text-surface-500 hover:text-surface-700"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Study</h1>
        <p className="text-surface-500 mt-1">Choose exam and subject to start learning</p>
      </div>

      {/* Exam selector (dropdown) + Manage enrollments */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-wrap">
        <span className="text-sm font-medium text-surface-600 dark:text-surface-400">Exam</span>
        <select
          value={selectedExamId || ''}
          onChange={(e) => setSelectedExamId(e.target.value || '')}
          className="input py-2.5 pl-3 pr-10 text-sm min-w-[200px] max-w-xs"
        >
          <option value="">Select exam</option>
          {exams.map((exam) => (
            <option key={exam.id} value={exam.id}>
              {exam.name}
            </option>
          ))}
        </select>
        <ChevronDown size={18} className="text-surface-400 -ml-8 pointer-events-none hidden sm:block" />
        <button
          type="button"
          onClick={() => {
            setShowManageEnroll((v) => !v)
            if (showManageEnroll) setSelectedExamsToEnroll([])
          }}
          className="btn secondary inline-flex items-center gap-2 text-sm"
        >
          <Settings2 size={18} />
          {showManageEnroll ? 'Close' : 'Enroll / Unenroll'}
        </button>
      </div>

      {/* Manage enrollments panel: current enrollments (unenroll) + enroll in another */}
      {showManageEnroll && (
        <div className="card p-6 space-y-6">
          <h3 className="text-lg font-semibold">Manage enrollments</h3>

          <div>
            <h4 className="text-sm font-medium text-surface-600 dark:text-surface-400 mb-2">Your enrollments</h4>
            {enrollmentsLoading ? (
              <Loading />
            ) : !enrollmentsList?.length ? (
              <p className="text-surface-500 text-sm">No enrollments.</p>
            ) : (
              <ul className="space-y-2">
                {enrollmentsList.map((e) => (
                  <li key={e.id}>
                    <div className="flex items-center justify-between gap-4 px-4 py-3 rounded-lg border border-surface-200 dark:border-surface-700">
                      <span>{e.exam_name || e.exam}</span>
                      <button
                        type="button"
                        onClick={() => handleUnenroll(e.id)}
                        disabled={unenrollingId !== null}
                        className="text-sm text-red-600 dark:text-red-400 hover:underline inline-flex items-center gap-1 disabled:opacity-50"
                      >
                        <XCircle size={16} />
                        {unenrollingId === e.id ? 'Unenrolling…' : 'Unenroll'}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h4 className="text-sm font-medium text-surface-600 dark:text-surface-400 mb-2">Enroll in more exams</h4>
            <p className="text-xs text-surface-500 mb-2">Use the dropdown or checkboxes to select one or more exams.</p>
            {availableLoading ? (
              <Loading />
            ) : examsToEnroll.length === 0 ? (
              <p className="text-surface-500 text-sm">You are enrolled in all available exams.</p>
            ) : (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-surface-600 dark:text-surface-400 mb-1">Select exam (dropdown)</label>
                  <select
                    value={selectedExamsToEnroll[0] || ''}
                    onChange={(e) => {
                      const id = e.target.value || null
                      if (id) setSelectedExamsToEnroll((prev) => (prev.includes(id) ? prev : [id, ...prev]))
                    }}
                    className="input py-2 pl-3 pr-10 w-full max-w-md text-sm"
                  >
                    <option value="">Choose an exam…</option>
                    {examsToEnroll.map((exam) => (
                      <option key={exam.id} value={exam.id}>{exam.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => selectedExamsToEnroll[0] && handleEnroll(selectedExamsToEnroll[0])}
                    disabled={!selectedExamsToEnroll.length || enrollingId !== null}
                    className="btn primary mt-2 text-sm disabled:opacity-50"
                  >
                    {enrollingId === selectedExamsToEnroll[0] ? 'Enrolling…' : 'Enroll in selected exam'}
                  </button>
                </div>
                <ul className="space-y-2">
                  {examsToEnroll.map((exam) => (
                    <li key={exam.id}>
                      <label className="flex items-center gap-3 px-4 py-3 rounded-lg border border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedExamsToEnroll.includes(exam.id)}
                          onChange={() => toggleExamSelection(exam.id)}
                          disabled={enrollingId !== null}
                          className="rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="flex-1">{exam.name}</span>
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); handleEnroll(exam.id) }}
                          disabled={enrollingId !== null}
                          className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
                        >
                          Enroll only this
                        </button>
                      </label>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap items-center gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => handleEnrollMultiple(selectedExamsToEnroll)}
                    disabled={!selectedExamsToEnroll.length || enrollingId !== null}
                    className="btn primary text-sm inline-flex items-center gap-2 disabled:opacity-50"
                  >
                    {enrollingId === 'multiple' ? (
                      'Enrolling…'
                    ) : (
                      <>
                        <PlusCircle size={16} />
                        Enroll in selected ({selectedExamsToEnroll.length})
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Selected exam name (not clickable) — then subjects list below */}
      {selectedExam && (
        <>
          <div
            className="text-lg font-semibold text-surface-800 dark:text-surface-200 py-1 border-b border-surface-200 dark:border-surface-700"
            style={{ color: selectedExam.color || undefined }}
          >
            {selectedExam.name}
          </div>

          {subjectsLoading ? (
            <Loading />
          ) : (!subjects || subjects.length === 0) ? (
            <div className="card p-8 text-center text-surface-500">
              <GraduationCap size={48} className="mx-auto mb-3 text-surface-300" />
              <p>No subjects configured for this exam yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {subjects.map((subject, index) => {
                const IconComp = iconMap[subject.icon] || BookOpen
                return (
                  <motion.div
                    key={subject.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.07 }}
                    onClick={() => navigate(`/study/${subject.id}`)}
                    className="card p-5 cursor-pointer hover:border-primary-300 hover:shadow-lg transition-all group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center"
                        style={{ backgroundColor: `${subject.color}18` }}
                      >
                        <IconComp size={28} style={{ color: subject.color }} />
                      </div>
                      <ChevronRight
                        size={20}
                        className="text-surface-300 group-hover:text-primary-500 transition-colors mt-1"
                      />
                    </div>

                    <h3 className="text-lg font-semibold">{subject.name}</h3>
                    <p className="text-sm text-surface-500 mt-1">
                      {subject.total_chapters} chapters · {subject.total_topics} topics
                    </p>

                    <div className="mt-4">
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-surface-500">Progress</span>
                        <span className="font-semibold" style={{ color: subject.color }}>
                          {subject.progress}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${subject.progress}%` }}
                          transition={{ duration: 0.8, delay: index * 0.1 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: subject.color }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mt-3 text-xs text-surface-400">
                      <span>{subject.completed_content}/{subject.total_content} completed</span>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </>
      )}

      {!selectedExamId && exams?.length > 0 && (
        <div className="card p-8 text-center text-surface-500">
          <p>Select an exam above to see subjects.</p>
        </div>
      )}

      {!selectedExamId && (!exams || exams.length === 0) && (
        <div className="card p-8 text-center text-surface-500">
          <GraduationCap size={48} className="mx-auto mb-3 text-surface-300" />
          <p>No exams available. Enroll in an exam from your profile.</p>
        </div>
      )}
    </div>
  )
}

export default Study
