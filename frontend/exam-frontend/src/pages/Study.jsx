import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { examService } from '../services/examService'
import { useAuthStore } from '../context/authStore'
import Loading from '../components/common/Loading'
import {
  BookOpen, Atom, FlaskConical, Calculator, Leaf, Bug,
  ChevronRight, GraduationCap, ChevronDown, Clock, UserCog
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
  const { profile } = useAuthStore()
  const primaryExamId = profile?.primary_exam ?? null

  const [selectedExamId, setSelectedExamId] = useState(primaryExamId || '')

  const { data: studyData = { exams: [], pending: [] }, isLoading: examsLoading } = useQuery({
    queryKey: ['studyExams'],
    queryFn: () => examService.getStudyExams(),
  })
  const exams = studyData.exams || []
  const pending = studyData.pending || []

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

  if (examsLoading && !exams?.length) return <Loading fullScreen />

  const PendingBanner = () => (
    pending.length > 0 ? (
      <div className="card p-5 border-amber-200 dark:border-amber-800/60 bg-amber-50/60 dark:bg-amber-900/10">
        <div className="flex items-center gap-2 mb-3">
          <Clock size={18} className="text-amber-500" />
          <h3 className="font-semibold text-amber-700 dark:text-amber-400">Pending admin approval</h3>
        </div>
        <ul className="flex flex-wrap gap-2">
          {pending.map((p) => (
            <li key={p.id} className="px-3 py-1.5 rounded-full text-sm bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              {p.name} · awaiting approval
            </li>
          ))}
        </ul>
        <p className="text-xs text-surface-500 mt-3">
          These exams unlock once your institution admin approves them.
        </p>
      </div>
    ) : null
  )

  if (!examsLoading && exams.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Study</h1>
          <p className="text-surface-500 mt-1">Study content for your approved exams</p>
        </div>
        <PendingBanner />
        <div className="card p-8 text-center text-surface-600 dark:text-surface-400">
          <GraduationCap size={48} className="mx-auto mb-3 text-surface-400" />
          <p className="font-medium">No active exams yet</p>
          <p className="mt-1 text-sm mb-6">
            Request enrollment from your profile. Once an admin approves, the exam appears here.
          </p>
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="btn primary inline-flex items-center gap-2"
          >
            <UserCog size={20} />
            Manage exams in profile
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Study</h1>
        <p className="text-surface-500 mt-1">Choose exam and subject to start learning</p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-wrap">
        <span className="text-sm font-medium text-surface-600 dark:text-surface-400">Exam</span>
        <select
          value={selectedExamId || ''}
          onChange={(e) => setSelectedExamId(e.target.value || '')}
          className="input py-2.5 pl-3 pr-10 text-sm min-w-[200px] max-w-xs"
        >
          <option value="">Select exam</option>
          {exams.map((exam) => (
            <option key={exam.id} value={exam.id}>{exam.name}</option>
          ))}
        </select>
        <ChevronDown size={18} className="text-surface-400 -ml-8 pointer-events-none hidden sm:block" />
        <button
          type="button"
          onClick={() => navigate('/profile')}
          className="btn secondary inline-flex items-center gap-2 text-sm"
        >
          <UserCog size={18} />
          Manage exams
        </button>
      </div>

      <PendingBanner />

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
    </div>
  )
}

export default Study
