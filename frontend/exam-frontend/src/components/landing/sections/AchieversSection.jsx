import { motion } from 'framer-motion'
import { Trophy } from 'lucide-react'
import { SectionHeading, HScroll, Avatar } from '../shared'

const AchieversSection = ({ data = {}, t }) => {
  const items = Array.isArray(data.items) ? data.items.filter((i) => i && i.name) : []
  if (!items.length) return null
  return (
    <section className={t.section}>
      <div className={t.container}>
        <SectionHeading t={t} eyebrow="Results" title={data.title} subtitle={data.subtitle} gradient />
        <HScroll t={t}>
          {items.map((it, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className={`${t.card} w-64 sm:w-72 shrink-0 snap-start p-6 text-center relative overflow-hidden`}
            >
              <div className="absolute top-3 right-3 text-primary-500/20">
                <Trophy size={40} />
              </div>
              <div className="relative mx-auto w-fit">
                <Avatar src={it.photo} name={it.name} size={84} className="ring-4 ring-primary-500/20" />
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 grid place-items-center h-7 w-7 rounded-full bg-primary-600 text-white shadow-lg">
                  <Trophy size={14} />
                </span>
              </div>
              <h3 className={`mt-5 font-bold text-lg ${t.heading}`}>{it.name}</h3>
              <div className={`mt-1 inline-block px-3 py-1 rounded-full text-xs font-bold bg-primary-50 text-primary-700`}>
                {it.achievement}
              </div>
              {it.quote ? (
                <p className={`mt-3 text-sm italic ${t.muted}`}>“{it.quote}”</p>
              ) : null}
            </motion.div>
          ))}
        </HScroll>
      </div>
    </section>
  )
}

export default AchieversSection
