import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { courseService } from '../services/courseService'
import Loading from '../components/common/Loading'
import toast from 'react-hot-toast'
import { GraduationCap, CheckCircle2, Clock, PlusCircle, ArrowRight, Star } from 'lucide-react'

const Courses = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: availableRaw, isLoading: availLoading } = useQuery({
    queryKey: ['availableCourses'],
    queryFn: () => courseService.getAvailableCoursesForEnrollment(),
  })
  const available = Array.isArray(availableRaw) ? availableRaw : (availableRaw?.results || [])

  const { data: studyData = { courses: [], pending: [] } } = useQuery({
    queryKey: ['studyCourses'],
    queryFn: () => courseService.getStudyCourses(),
  })

  const statusById = useMemo(() => {
    const map = {}
    ;(studyData.courses || []).forEach((c) => { map[c.id] = 'approved' })
    ;(studyData.pending || []).forEach((c) => { map[c.id] = 'pending' })
    return map
  }, [studyData])

  const requestEnroll = async (courseId) => {
    try {
      await courseService.requestEnrollment(courseId)
      toast.success('Request sent for admin approval')
      queryClient.invalidateQueries({ queryKey: ['studyCourses'] })
      queryClient.invalidateQueries({ queryKey: ['enrollments'] })
    } catch (err) {
      toast.error(
        err?.response?.data?.course?.[0] ||
        err?.response?.data?.detail ||
        'Request failed'
      )
    }
  }

  if (availLoading) return <Loading fullScreen />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Courses</h1>
        <p className="text-surface-500 mt-1">Explore all available courses and request enrollment</p>
      </div>

      {available.length === 0 ? (
        <div className="card p-8 text-center text-surface-500">
          <GraduationCap size={48} className="mx-auto mb-3 text-surface-300" />
          <p>No courses available yet. Check back soon.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {available.map((course, index) => {
            const status = statusById[course.id]
            return (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06 }}
                className="card p-6 flex flex-col"
              >
                <div className="flex items-start gap-3 mb-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shrink-0"
                    style={{ backgroundColor: course.color || '#3B82F6' }}
                  >
                    {course.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-lg font-semibold truncate">{course.name}</h3>
                      {course.is_featured && <Star size={15} className="text-amber-400 fill-amber-400 shrink-0" />}
                    </div>
                    {course.code && <p className="text-xs text-surface-500 mt-0.5">{course.code}</p>}
                  </div>
                </div>

                <div className="mt-auto">
                  {status === 'approved' ? (
                    <button
                      type="button"
                      onClick={() => navigate(`/study/course/${course.id}`)}
                      className="btn primary w-full inline-flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 size={18} />
                      Enrolled · Enter course
                      <ArrowRight size={16} />
                    </button>
                  ) : status === 'pending' ? (
                    <span className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      <Clock size={16} />
                      Awaiting approval
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => requestEnroll(course.id)}
                      className="btn secondary w-full inline-flex items-center justify-center gap-2"
                    >
                      <PlusCircle size={18} />
                      Request enrollment
                    </button>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Courses
