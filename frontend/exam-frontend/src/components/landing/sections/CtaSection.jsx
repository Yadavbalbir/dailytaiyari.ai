import { ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'

const CtaSection = ({ data = {}, t, go }) => {
  if (!data.title) return null
  return (
    <section className={t.section}>
      <div className={t.container}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 to-accent-600 px-6 py-14 sm:px-14 sm:py-16 text-center shadow-2xl"
        >
          <div className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-black/10" />
          <div className="relative">
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white">{data.title}</h2>
            {data.subtitle ? (
              <p className="mt-4 text-lg text-white/85 max-w-2xl mx-auto">{data.subtitle}</p>
            ) : null}
            {data.button_label ? (
              <button
                onClick={() => go(data.button_link)}
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 font-bold text-primary-700 shadow-lg hover:-translate-y-0.5 transition-transform"
              >
                {data.button_label}
                <ArrowRight size={18} />
              </button>
            ) : null}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default CtaSection
