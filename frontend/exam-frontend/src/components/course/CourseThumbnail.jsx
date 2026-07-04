import { useState } from 'react'
import { GraduationCap, Star } from 'lucide-react'

const TYPE_LABELS = {
  competitive: 'Competitive',
  board: 'Board',
  entrance: 'Entrance',
  government: 'Government',
}

/**
 * Course banner used on course tiles.
 * Shows the uploaded thumbnail when available; otherwise renders a
 * professional, theme-aligned placeholder derived from the course color.
 */
const CourseThumbnail = ({ course, statusBadge = null }) => {
  const [imgOk, setImgOk] = useState(true)
  const hasImage = !!course.thumbnail && imgOk
  const typeLabel = TYPE_LABELS[course.course_type] || null

  return (
    <div className="relative aspect-[16/9] w-full overflow-hidden bg-surface-100 dark:bg-surface-800">
      {hasImage ? (
        <img
          src={course.thumbnail}
          alt={course.name}
          loading="lazy"
          onError={() => setImgOk(false)}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #fdba74 0%, #f97316 45%, #ea580c 100%)' }}
        >
          {/* soft decorative rings */}
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/15" />
          <div className="absolute -bottom-10 -left-6 w-28 h-28 rounded-full bg-black/10" />
          <span className="relative font-display font-bold text-white text-5xl sm:text-6xl drop-shadow-sm select-none">
            {course.name.charAt(0).toUpperCase()}
          </span>
          <GraduationCap
            size={40}
            className="absolute bottom-3 right-3 text-white/30"
            strokeWidth={1.5}
          />
        </div>
      )}

      {/* readability gradient for overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />

      {/* top-left: course type */}
      {typeLabel && (
        <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[11px] font-semibold tracking-wide uppercase bg-white/90 dark:bg-black/60 text-surface-700 dark:text-surface-100 backdrop-blur-sm shadow-sm">
          {typeLabel}
        </span>
      )}

      {/* top-right: featured */}
      {course.is_featured && (
        <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-400/95 text-amber-950 shadow-sm">
          <Star size={11} className="fill-amber-950" /> Featured
        </span>
      )}

      {/* bottom-left: status (enrolled / pending) */}
      {statusBadge && (
        <div className="absolute bottom-2.5 left-2.5">{statusBadge}</div>
      )}
    </div>
  )
}

export default CourseThumbnail
