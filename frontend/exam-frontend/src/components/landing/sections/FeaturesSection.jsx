import { motion } from 'framer-motion'
import { SectionHeading, Icon } from '../shared'

const FeaturesSection = ({ data = {}, t }) => {
  const items = Array.isArray(data.items) ? data.items.filter((i) => i && i.title) : []
  return (
    <section className={t.section}>
      <div className={t.container}>
        <SectionHeading t={t} title={data.title} subtitle={data.subtitle} gradient />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {items.map((it, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.45, delay: (i % 3) * 0.08 }}
              className={`${t.card} p-6 sm:p-7 group`}
            >
              <div className="inline-grid place-items-center h-12 w-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 text-white shadow-lg shadow-primary-500/25 group-hover:scale-110 transition-transform">
                <Icon name={it.icon} size={22} />
              </div>
              <h3 className={`mt-5 text-lg font-bold ${t.heading}`}>{it.title}</h3>
              <p className={`mt-2 text-sm leading-relaxed ${t.muted}`}>{it.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FeaturesSection
