import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { examService } from '../services/examService'
import { useAuthStore } from '../context/authStore'
import Loading from '../components/common/Loading'
import {
  BookOpen, Atom, FlaskConical, Calculator, Leaf, Bug,
  ChevronRight, GraduationCap, ChevronDown
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

  useEffect(() => {
    if (primaryExamId && !selectedExamId) setSelectedExamId(primaryExamId)
  }, [primaryExamId])

  const { data: exams, isLoading: examsLoading } = useQuery({
    queryKey: ['examsList'],
    queryFn: () => examService.getExams(),
  })

  const { data: subjects, isLoading: subjectsLoading } = useQuery({
    queryKey: ['studySubjects', selectedExamId || primaryExamId],
    queryFn: () => examService.getStudySubjects(selectedExamId || primaryExamId || undefined),
    enabled: !!(selectedExamId || primaryExamId),
  })

  const effectiveExamId = selectedExamId || primaryExamId
  const isLoading = examsLoading || subjectsLoading

  if (isLoading && !subjects?.length) return <Loading fullScreen />

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Study</h1>
          <p className="text-surface-500 mt-1">Select a subject to start learning</p>
        </div>
        {exams?.length >= 1 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-surface-500 whitespace-nowrap">Exam:</span>
            <select
              value={effectiveExamId || ''}
              onChange={(e) => setSelectedExamId(e.target.value || null)}
              className="input py-2 pl-3 pr-8 text-sm min-w-[180px]"
            >
              {!effectiveExamId && <option value="">Select exam</option>}
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.name}
                </option>
              ))}
            </select>
            <ChevronDown size={18} className="text-surface-400 -ml-6 pointer-events-none" />
          </div>
        )}
      </div>

      {(!subjects || subjects.length === 0) ? (
        <div className="text-center py-16 text-surface-500">
          <GraduationCap size={64} className="mx-auto mb-4 text-surface-300" />
          <p className="text-lg font-medium">No subjects available yet</p>
          <p className="text-sm mt-1">
            {effectiveExamId
              ? 'This exam has no subjects configured, or try another exam from the dropdown above.'
              : 'Select an exam above or set your primary exam in your profile.'}
          </p>
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

                {/* Progress bar */}
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
    </div>
  )
}

export default Study
