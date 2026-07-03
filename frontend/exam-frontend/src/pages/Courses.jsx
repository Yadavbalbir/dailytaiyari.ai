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
            const color = course.color || '#f97316'
            return (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06 }}
                className="group card-hover overflow-hidden flex flex-col"
              >
                <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${color}, ${color}55)` }} />

                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-start gap-3.5 mb-5">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shrink-0 transition-transform duration-200 group-hover:scale-105"
                      style={{ backgroundColor: color, boxShadow: `0 10px 22px -8px ${color}` }}
                    >
                      {course.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-lg font-semibold truncate">{course.name}</h3>
                        {course.is_featured && <Star size={15} className="text-amber-400 fill-amber-400 shrink-0" />}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        {course.code && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium tracking-wide uppercase bg-surface-100 dark:bg-surface-800 text-surface-500">
                            {course.code}
                          </span>
                        )}
                        {status === 'approved' && (
                          <span className="badge-success">
                            <CheckCircle2 size={12} /> Enrolled
                          </span>
                        )}
                        {status === 'pending' && (
                          <span className="badge-warning">
                            <Clock size={12} /> Pending
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto pt-1">
                    {status === 'approved' ? (
                      <button
                        type="button"
                        onClick={() => navigate(`/study/course/${course.id}`)}
                        className="btn-primary w-full group/btn"
                        style={{ backgroundImage: `linear-gradient(to right, ${color}, ${color})`, boxShadow: `0 8px 18px -8px ${color}` }}
                      >
                        Enter course
                        <ArrowRight size={16} className="transition-transform group-hover/btn:translate-x-0.5" />
                      </button>
                    ) : status === 'pending' ? (
                      <span className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
                        <Clock size={16} />
                        Awaiting admin approval
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => requestEnroll(course.id)}
                        className="btn-secondary w-full border border-surface-200 dark:border-surface-700 hover:border-primary-300 dark:hover:border-primary-700 hover:text-primary-600 dark:hover:text-primary-400"
                      >
                        <PlusCircle size={18} />
                        Request enrollment
                      </button>
                    )}
                  </div>
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
