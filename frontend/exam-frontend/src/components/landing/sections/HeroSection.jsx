import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

// Big hero. Uses gradient headline on templates that support it, animated blobs,
// dual CTAs and highlight badges.
const HeroSection = ({ data = {}, t, go }) => {
  const badges = Array.isArray(data.badges) ? data.badges.filter(Boolean) : []
  const onDark = t.key === 'spotlight' || t.key === 'classic'
  return (
    <section className={`${t.heroBg} pt-28 pb-20 sm:pt-32 sm:pb-28`}>
      {t.heroBlob && (
        <>
          <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-accent-400/20 blur-3xl" />
        </>
      )}
      <div className={`${t.container} relative`}>
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            {data.eyebrow ? (
              <motion.span
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className={`${onDark ? 'text-white/80 border-white/25' : t.eyebrow} inline-flex items-center rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-wider ${onDark ? '' : 'border-primary-200 bg-primary-50'}`}
              >
                {data.eyebrow}
              </motion.span>
            ) : null}
            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className={`font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05] mt-5 ${onDark ? 'text-white' : t.heading}`}
            >
              {data.title}
            </motion.h1>
            {data.subtitle ? (
              <motion.p
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.12 }}
                className={`mt-6 text-lg max-w-xl ${onDark ? 'text-white/80' : t.muted}`}
              >
                {data.subtitle}
              </motion.p>
            ) : null}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-9 flex flex-wrap gap-3"
            >
              {data.primary_cta_label ? (
                <button onClick={() => go(data.primary_cta_link)} className={t.btnPrimary}>
                  {data.primary_cta_label}
                  <ArrowRight size={18} />
                </button>
              ) : null}
              {data.secondary_cta_label ? (
                <button onClick={() => go(data.secondary_cta_link)} className={t.btnGhost}>
                  {data.secondary_cta_label}
                </button>
              ) : null}
            </motion.div>
            {badges.length > 0 && (
              <div className="mt-9 flex flex-wrap gap-2.5">
                {badges.map((b, i) => (
                  <span
                    key={i}
                    className={`px-3.5 py-1.5 text-xs font-medium ${onDark && t.key === 'classic' ? t.chip : t.chip}`}
                  >
                    {b}
                  </span>
                ))}
              </div>
            )}
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative"
          >
            {data.image ? (
              <img
                src={data.image}
                alt=""
                className="w-full rounded-3xl shadow-2xl object-cover aspect-[4/3]"
              />
            ) : (
              <div className="relative aspect-[4/3] rounded-3xl bg-gradient-to-br from-primary-500 to-accent-500 shadow-2xl overflow-hidden">
                <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/20" />
                <div className="absolute bottom-6 left-6 right-6 rounded-2xl bg-white/15 backdrop-blur p-5 text-white">
                  <div className="h-2.5 w-24 rounded-full bg-white/70" />
                  <div className="mt-3 h-2 w-40 rounded-full bg-white/40" />
                  <div className="mt-2 h-2 w-32 rounded-full bg-white/40" />
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
