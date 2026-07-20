import { useQuery } from '@tanstack/react-query'
import { ArrowRight } from 'lucide-react'
import { courseService } from '../../../services/courseService'
import { SectionHeading, HScroll } from '../shared'
import CourseThumbnail from '../../course/CourseThumbnail'
import { stripHtml } from '../../../utils/html'

const CURRENCY_SYMBOLS = { INR: '₹', USD: '$', EUR: '€', GBP: '£' }

const Price = ({ course, t }) => {
  const isFree = course.is_free || course.pricing_type === 'free' || !Number(course.price)
  if (isFree) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-success-50 text-success-700">
        Free
      </span>
    )
  }
  const sym = CURRENCY_SYMBOLS[course.currency] || `${course.currency} `
  const hasDiscount = Number(course.discount_percent) > 0 && course.original_price
  return (
    <div className="flex items-baseline gap-2">
      <span className={`text-lg font-display font-bold ${t.accent}`}>
        {sym}{Number(course.price).toLocaleString('en-IN')}
      </span>
      {hasDiscount && (
        <span className="text-xs text-surface-400 line-through">
          {sym}{Number(course.original_price).toLocaleString('en-IN')}
        </span>
      )}
    </div>
  )
}

// Live courses pulled from the tenant catalog, rendered as a horizontal,
// scrollable, snap carousel with arrow controls.
const CoursesSection = ({ data = {}, t, go }) => {
  const limit = Number(data.limit) || 12
  const { data: raw, isLoading } = useQuery({
    queryKey: ['landing-courses'],
    queryFn: courseService.getCourses,
    staleTime: 5 * 60 * 1000,
  })

  const courses = (Array.isArray(raw) ? raw : raw?.results || []).slice(0, limit)

  return (
    <section className={`${t.section} ${t.sectionAlt}`}>
      <div className={t.container}>
        <div className="flex items-end justify-between gap-6 mb-8">
          <SectionHeading t={t} eyebrow="Courses" title={data.title} subtitle={data.subtitle} center={false} gradient />
          {data.cta_label ? (
            <button
              onClick={() => go(data.cta_link)}
              className={`hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold ${t.accent} hover:gap-2.5 transition-all shrink-0 pb-1`}
            >
              {data.cta_label} <ArrowRight size={16} />
            </button>
          ) : null}
        </div>

        {isLoading ? (
          <div className="flex gap-5 overflow-hidden">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-72 shrink-0 animate-pulse">
                <div className="aspect-[16/9] rounded-2xl bg-surface-200" />
                <div className="h-4 w-3/4 mt-3 rounded bg-surface-200" />
                <div className="h-3 w-1/2 mt-2 rounded bg-surface-200" />
              </div>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <p className={`${t.muted} text-center py-8`}>Courses coming soon.</p>
        ) : (
          <HScroll t={t}>
            {courses.map((course) => (
              <button
                key={course.id}
                onClick={() => go(`/courses/${course.id}`)}
                className={`${t.card} group text-left w-72 sm:w-80 shrink-0 snap-start overflow-hidden`}
              >
                <CourseThumbnail course={course} />
                <div className="p-4">
                  <h3 className={`font-bold leading-snug line-clamp-2 ${t.heading}`}>{course.name}</h3>
                  {course.description ? (
                    <p className={`mt-1.5 text-sm line-clamp-2 ${t.muted}`}>
                      {stripHtml(course.description)}
                    </p>
                  ) : null}
                  <div className="mt-3 flex items-center justify-between">
                    <Price course={course} t={t} />
                    <span className={`text-sm font-semibold inline-flex items-center gap-1 ${t.accent} opacity-0 group-hover:opacity-100 transition-opacity`}>
                      View <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </HScroll>
        )}

        {data.cta_label ? (
          <div className="mt-8 text-center sm:hidden">
            <button onClick={() => go(data.cta_link)} className={t.btnGhost}>
              {data.cta_label} <ArrowRight size={16} />
            </button>
          </div>
        ) : null}
      </div>
    </section>
  )
}

export default CoursesSection
