import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { courseService } from '../services/courseService'
import Loading from '../components/common/Loading'
import { GraduationCap, Clock, Compass, ArrowRight } from 'lucide-react'

const Study = () => {
  const navigate = useNavigate()

  const { data: studyData = { courses: [], pending: [] }, isLoading } = useQuery({
    queryKey: ['studyCourses'],
    queryFn: () => courseService.getStudyCourses(),
  })
  const courses = studyData.courses || []
  const pending = studyData.pending || []

  if (isLoading && !courses.length) return <Loading fullScreen />

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
              {p.name} &middot; awaiting approval
            </li>
          ))}
        </ul>
        <p className="text-xs text-surface-500 mt-3">
          These courses unlock once your institution admin approves them.
        </p>
      </div>
    ) : null
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold">Study</h1>
          <p className="text-surface-500 mt-1">Your enrolled courses</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/courses')}
          className="btn secondary inline-flex items-center gap-2 text-sm"
        >
          <Compass size={18} />
          Browse all courses
        </button>
      </div>

      <PendingBanner />

      {courses.length === 0 ? (
        <div className="card p-8 text-center text-surface-600 dark:text-surface-400">
          <GraduationCap size={48} className="mx-auto mb-3 text-surface-400" />
          <p className="font-medium">No enrolled courses yet</p>
          <p className="mt-1 text-sm mb-6">
            Browse the course catalog and request enrollment. Once an admin approves, the course appears here.
          </p>
          <button
            type="button"
            onClick={() => navigate('/courses')}
            className="btn primary inline-flex items-center gap-2"
          >
            <Compass size={20} />
            Explore courses
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.07 }}
              className="card p-6 flex flex-col hover:shadow-lg transition-all"
            >
              <div className="flex items-start gap-3 mb-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shrink-0"
                  style={{ backgroundColor: course.color || '#3B82F6' }}
                >
                  {course.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold truncate">{course.name}</h3>
                  {course.code && <p className="text-xs text-surface-500 mt-0.5">{course.code}</p>}
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate(`/study/course/${course.id}`)}
                className="btn primary mt-auto w-full inline-flex items-center justify-center gap-2"
                style={course.color ? { backgroundColor: course.color, borderColor: course.color } : undefined}
              >
                Enter course
                <ArrowRight size={18} />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Study
