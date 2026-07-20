import { motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'

const AboutSection = ({ data = {}, t }) => {
  const points = Array.isArray(data.points) ? data.points.filter(Boolean) : []
  return (
    <section className={t.section}>
      <div className={t.container}>
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            {data.image ? (
              <img src={data.image} alt="" className="w-full rounded-3xl shadow-xl object-cover aspect-[4/3]" />
            ) : (
              <div className="aspect-[4/3] rounded-3xl bg-gradient-to-br from-primary-500/90 to-accent-500/90 shadow-xl grid place-items-center">
                <span className="font-display text-white/90 text-6xl font-extrabold">★</span>
              </div>
            )}
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className={`${t.h2} ${t.headingGradient}`}>{data.title}</h2>
            {data.body ? <p className={`mt-5 ${t.lead} ${t.muted}`}>{data.body}</p> : null}
            {points.length > 0 && (
              <ul className="mt-7 space-y-3">
                {points.map((p, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="text-primary-600 shrink-0 mt-0.5" size={20} />
                    <span className={`font-medium ${t.heading}`}>{p}</span>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default AboutSection
