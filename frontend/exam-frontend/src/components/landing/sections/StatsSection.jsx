import { motion } from 'framer-motion'
import { SectionHeading } from '../shared'

const StatsSection = ({ data = {}, t }) => {
  const items = Array.isArray(data.items) ? data.items.filter((i) => i && (i.value || i.label)) : []
  if (!items.length) return null
  return (
    <section className={`${t.section} ${t.sectionAlt}`}>
      <div className={t.container}>
        <SectionHeading t={t} title={data.title} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {items.map((it, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className={`${t.card} p-6 text-center`}
            >
              <div className={`font-display text-3xl sm:text-4xl font-extrabold ${t.headingGradient}`}>
                {it.value}
              </div>
              <div className={`mt-2 text-sm font-medium ${t.muted}`}>{it.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default StatsSection
