import { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { courseService } from '../services/courseService'
import { useAuthStore } from '../context/authStore'
import Loading from '../components/common/Loading'
import CourseThumbnail from '../components/course/CourseThumbnail'
import toast from 'react-hot-toast'
import {
  ArrowLeft, ArrowRight, GraduationCap, CheckCircle2, Clock, PlusCircle,
  BookOpen, Layers, ShieldCheck, Sparkles, Users, Tag, Settings2,
} from 'lucide-react'

const CURRENCY_SYMBOLS = { INR: '₹', USD: '$', EUR: '€', GBP: '£' }
const money = (currency, amount) => {
  const sym = CURRENCY_SYMBOLS[currency] || `${currency} `
  const n = Number(amount)
  return `${sym}${Number.isFinite(n) ? n.toLocaleString('en-IN') : amount}`
}

const TabButton = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`relative px-1 pb-3 text-sm font-medium whitespace-nowrap transition-colors ${
      active
        ? 'text-primary-600 dark:text-primary-400'
        : 'text-surface-500 hover:text-surface-800 dark:hover:text-surface-200'
    }`}
  >
    {children}
    {active && (
      <motion.span
        layoutId="courseDetailTab"
        className="absolute left-0 right-0 -bottom-px h-0.5 rounded-full bg-primary-500"
      />
    )}
  </button>
)

const CourseDetail = () => {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, profile } = useAuthStore()
  const role = user?.role || profile?.user?.role
  const isAdmin = role === 'admin'

  const [tab, setTab] = useState('overview')
  const [requesting, setRequesting] = useState(false)

  const { data: course, isLoading, isError } = useQuery({
    queryKey: ['courseDetail', courseId],
    queryFn: () => courseService.getCourseDetails(courseId),
    enabled: !!courseId,
  })

  const { data: studyData = { courses: [], pending: [] } } = useQuery({
    queryKey: ['studyCourses'],
    queryFn: () => courseService.getStudyCourses(),
  })

  const status = useMemo(() => {
    if ((studyData.courses || []).some((c) => String(c.id) === String(courseId))) return 'approved'
    if ((studyData.pending || []).some((c) => String(c.id) === String(courseId))) return 'pending'
    return null
  }, [studyData, courseId])

  const requestEnroll = async () => {
    setRequesting(true)
    try {
      await courseService.requestEnrollment(courseId)
      toast.success('Enrollment request sent for admin approval')
      queryClient.invalidateQueries({ queryKey: ['studyCourses'] })
      queryClient.invalidateQueries({ queryKey: ['enrollments'] })
    } catch (err) {
      toast.error(
        err?.response?.data?.course?.[0] ||
        err?.response?.data?.detail ||
        'Request failed'
      )
    } finally {
      setRequesting(false)
    }
  }

  if (isLoading) return <Loading fullScreen />
  if (isError || !course) {
    return (
      <div className="card p-10 text-center text-surface-500">
        <GraduationCap size={48} className="mx-auto mb-3 text-surface-300" />
        <p className="font-medium">Course not found</p>
        <button onClick={() => navigate('/courses')} className="btn-secondary mt-4">
          <ArrowLeft size={16} /> Back to courses
        </button>
      </div>
    )
  }

  const isFree = course.is_free || course.pricing_type === 'free' || !Number(course.price)
  const hasDiscount = Number(course.discount_percent) > 0 && course.original_price
  const highlights = Array.isArray(course.highlights) ? course.highlights : []
  const subjects = Array.isArray(course.subjects) ? course.subjects : []
  const instructors = Array.isArray(course.instructors) ? course.instructors : []

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'curriculum', label: 'Curriculum' },
    ...(instructors.length ? [{ key: 'instructors', label: 'Instructors' }] : []),
  ]

  const EnrollAction = () => {
    if (status === 'approved') {
      return (
        <button onClick={() => navigate(`/study/course/${course.id}`)} className="btn-primary w-full group/btn">
          Enter course
          <ArrowRight size={16} className="transition-transform group-hover/btn:translate-x-0.5" />
        </button>
      )
    }
    if (status === 'pending') {
      return (
        <span className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
          <Clock size={16} /> Awaiting admin approval
        </span>
      )
    }
    return (
      <button onClick={requestEnroll} disabled={requesting} className="btn-primary w-full disabled:opacity-70">
        <PlusCircle size={18} />
        {requesting ? 'Sending…' : isFree ? 'Request enrollment · Free' : 'Request enrollment'}
      </button>
    )
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/courses')}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-surface-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
      >
        <ArrowLeft size={16} /> Back to courses
      </button>

      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 text-white">
        <div className="absolute -top-10 -right-10 w-56 h-56 rounded-full bg-white/10" />
        <div className="absolute -bottom-16 -left-10 w-64 h-64 rounded-full bg-black/10" />
        <div className="relative p-6 sm:p-10">
          {course.course_type && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wide bg-white/15 backdrop-blur-sm">
              {course.course_type}
            </span>
          )}
          <h1 className="mt-3 text-2xl sm:text-4xl font-display font-bold leading-tight max-w-3xl">
            {course.name}
          </h1>
          {course.subtitle && (
            <p className="mt-2 text-white/85 max-w-2xl">{course.subtitle}</p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/85">
            <span className="inline-flex items-center gap-1.5"><Layers size={15} /> {course.subjects_count || subjects.length || 0} subjects</span>
            <span className="inline-flex items-center gap-1.5"><BookOpen size={15} /> {course.mock_tests_count || 0} tests</span>
            {instructors.length > 0 && (
              <span className="inline-flex items-center gap-1.5"><Users size={15} /> {instructors.map((i) => i.name).join(', ')}</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="border-b border-surface-200 dark:border-surface-800">
            <div className="flex items-center gap-6 overflow-x-auto">
              {tabs.map((t) => (
                <TabButton key={t.key} active={tab === t.key} onClick={() => setTab(t.key)}>
                  {t.label}
                </TabButton>
              ))}
            </div>
          </div>

          {tab === 'overview' && (
            <div className="space-y-8">
              <section>
                <h2 className="text-lg font-display font-bold mb-2">Description</h2>
                <p className="text-surface-600 dark:text-surface-300 leading-relaxed whitespace-pre-line">
                  {course.description || 'No description provided yet.'}
                </p>
              </section>

              {highlights.length > 0 && (
                <section>
                  <h2 className="text-lg font-display font-bold mb-3 flex items-center gap-2">
                    <Sparkles size={18} className="text-primary-500" /> What you will get
                  </h2>
                  <ul className="space-y-2.5">
                    {highlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-surface-700 dark:text-surface-300">
                        <CheckCircle2 size={18} className="text-success-500 mt-0.5 shrink-0" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {course.refund_policy && (
                <section className="rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-900 p-4">
                  <h3 className="font-semibold flex items-center gap-2 mb-1.5">
                    <ShieldCheck size={17} className="text-primary-500" /> Refund Policy
                  </h3>
                  <p className="text-sm text-surface-600 dark:text-surface-400 leading-relaxed whitespace-pre-line">
                    {course.refund_policy}
                  </p>
                </section>
              )}
            </div>
          )}

          {tab === 'curriculum' && (
            <div className="space-y-3">
              {subjects.length === 0 ? (
                <div className="card p-8 text-center text-surface-500">
                  <Layers size={40} className="mx-auto mb-3 text-surface-300" />
                  <p>Curriculum will be shared soon.</p>
                </div>
              ) : (
                subjects.map((s, i) => (
                  <div key={s.id} className="card p-4 flex items-center gap-3">
                    <span className="w-9 h-9 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center font-semibold shrink-0">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-semibold truncate">{s.name}</h3>
                      <p className="text-xs text-surface-400">
                        {(s.topics_count || s.total_topics || 0)} topics
                        {s.quizzes_count ? ` · ${s.quizzes_count} quizzes` : ''}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'instructors' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {instructors.map((ins) => (
                <div key={ins.id} className="card p-4 flex items-center gap-3">
                  <span className="w-11 h-11 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-white flex items-center justify-center font-semibold shrink-0">
                    {ins.name?.charAt(0).toUpperCase() || 'I'}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-semibold truncate">{ins.name}</h3>
                    <p className="text-xs text-surface-400">Instructor</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pricing / enroll card */}
        <div className="lg:sticky lg:top-6">
          <div className="card overflow-hidden">
            <CourseThumbnail course={course} />
            <div className="p-5 space-y-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-surface-400">Price</p>
                {isFree ? (
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-2xl font-display font-bold text-success-600 dark:text-success-400">Free</span>
                  </div>
                ) : (
                  <div className="mt-1 flex flex-wrap items-baseline gap-2">
                    <span className="text-3xl font-display font-bold text-primary-600 dark:text-primary-400">
                      {money(course.currency, course.price)}
                    </span>
                    {hasDiscount && (
                      <>
                        <span className="text-surface-400 line-through text-sm">
                          {money(course.currency, course.original_price)}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-success-50 dark:bg-success-900/30 text-success-700 dark:text-success-400">
                          <Tag size={11} /> {course.discount_percent}% off
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>

              <EnrollAction />

              {status !== 'approved' && (
                <p className="text-xs text-center text-surface-400">
                  {isFree
                    ? 'Enrollment is confirmed once an admin approves your request.'
                    : 'Your request goes to the admin for approval. Payment is handled separately.'}
                </p>
              )}

              {isAdmin && (
                <button
                  onClick={() => navigate(`/courses/${course.id}/manage`)}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-surface-600 dark:text-surface-300 bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
                >
                  <Settings2 size={15} /> Manage course
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CourseDetail
