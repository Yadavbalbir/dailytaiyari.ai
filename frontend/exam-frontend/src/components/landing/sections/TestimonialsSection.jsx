import { Star, Quote } from 'lucide-react'
import { SectionHeading, HScroll, Avatar } from '../shared'

const TestimonialsSection = ({ data = {}, t }) => {
  const items = Array.isArray(data.items) ? data.items.filter((i) => i && i.quote) : []
  if (!items.length) return null
  return (
    <section className={`${t.section} ${t.sectionAlt}`}>
      <div className={t.container}>
        <SectionHeading t={t} eyebrow="Testimonials" title={data.title} subtitle={data.subtitle} gradient />
        <HScroll t={t}>
          {items.map((it, i) => {
            const rating = Math.max(0, Math.min(5, Number(it.rating) || 5))
            return (
              <div
                key={i}
                className={`${t.card} w-80 sm:w-96 shrink-0 snap-start p-7 flex flex-col`}
              >
                <Quote className="text-primary-500/30" size={32} />
                <div className="flex gap-0.5 mt-3">
                  {[...Array(5)].map((_, s) => (
                    <Star
                      key={s}
                      size={16}
                      className={s < rating ? 'text-amber-400 fill-amber-400' : 'text-surface-300'}
                    />
                  ))}
                </div>
                <p className={`mt-4 flex-1 leading-relaxed ${t.heading}`}>“{it.quote}”</p>
                <div className="mt-6 flex items-center gap-3">
                  <Avatar src={it.photo} name={it.name} size={44} />
                  <div>
                    <div className={`font-semibold text-sm ${t.heading}`}>{it.name}</div>
                    {it.role ? <div className={`text-xs ${t.muted}`}>{it.role}</div> : null}
                  </div>
                </div>
              </div>
            )
          })}
        </HScroll>
      </div>
    </section>
  )
}

export default TestimonialsSection
