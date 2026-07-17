import { useRef, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import * as Icons from 'lucide-react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

// Resolve a lucide icon by name with a safe fallback.
export const Icon = ({ name, ...props }) => {
  const Cmp = (name && Icons[name]) || Icons.Sparkles
  return <Cmp {...props} />
}

// Animated section heading (eyebrow + title + subtitle), template-aware.
export const SectionHeading = ({ t, eyebrow, title, subtitle, center = true, gradient = false }) => {
  if (!title && !subtitle && !eyebrow) return null
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5 }}
      className={`${center ? 'text-center mx-auto max-w-2xl' : ''} mb-10 sm:mb-14`}
    >
      {eyebrow ? <span className={t.eyebrow}>{eyebrow}</span> : null}
      {title ? (
        <h2 className={`${t.h2} mt-3 ${gradient ? t.headingGradient : t.heading}`}>{title}</h2>
      ) : null}
      {subtitle ? <p className={`${t.lead} mt-4 ${t.muted}`}>{subtitle}</p> : null}
    </motion.div>
  )
}

// Reusable horizontal snap-scroll rail with drag + arrow controls. Children are
// rendered inline; each child should have a fixed/min width.
export const HScroll = ({ t, children, className = '' }) => {
  const ref = useRef(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(false)

  const update = () => {
    const el = ref.current
    if (!el) return
    setCanLeft(el.scrollLeft > 4)
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }

  useEffect(() => {
    update()
    const el = ref.current
    if (!el) return
    el.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      el.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [children])

  const scrollBy = (dir) => {
    const el = ref.current
    if (!el) return
    el.scrollBy({ left: dir * Math.max(el.clientWidth * 0.8, 280), behavior: 'smooth' })
  }

  const arrowCls =
    'absolute top-1/2 -translate-y-1/2 z-20 grid place-items-center h-11 w-11 rounded-full ' +
    'bg-primary-600 text-white shadow-lg shadow-primary-500/30 hover:bg-primary-700 ' +
    'transition disabled:opacity-0 disabled:pointer-events-none'

  return (
    <div className="relative group">
      <button
        type="button"
        aria-label="Scroll left"
        onClick={() => scrollBy(-1)}
        disabled={!canLeft}
        className={`${arrowCls} -left-2 sm:left-1`}
      >
        <ChevronLeft size={22} />
      </button>
      <button
        type="button"
        aria-label="Scroll right"
        onClick={() => scrollBy(1)}
        disabled={!canRight}
        className={`${arrowCls} -right-2 sm:right-1`}
      >
        <ChevronRight size={22} />
      </button>
      <div
        ref={ref}
        className={
          'flex gap-5 overflow-x-auto pb-4 -mx-4 px-4 scroll-smooth snap-x snap-mandatory ' +
          '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ' +
          className
        }
      >
        {children}
      </div>
    </div>
  )
}

// Initials avatar fallback for people without a photo.
export const Avatar = ({ src, name, size = 56, className = '' }) => {
  const initials = (name || '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={{ width: size, height: size }}
        className={`rounded-full object-cover ${className}`}
      />
    )
  }
  return (
    <div
      style={{ width: size, height: size }}
      className={`rounded-full grid place-items-center font-bold text-white bg-gradient-to-br from-primary-500 to-accent-500 ${className}`}
    >
      {initials}
    </div>
  )
}
