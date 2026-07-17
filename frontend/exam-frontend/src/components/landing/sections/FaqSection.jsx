import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { SectionHeading } from '../shared'

const FaqSection = ({ data = {}, t }) => {
  const items = Array.isArray(data.items) ? data.items.filter((i) => i && i.question) : []
  const [open, setOpen] = useState(0)
  if (!items.length) return null
  return (
    <section className={t.section}>
      <div className={`${t.container} max-w-3xl`}>
        <SectionHeading t={t} title={data.title} subtitle={data.subtitle} gradient />
        <div className="space-y-3">
          {items.map((it, i) => {
            const isOpen = open === i
            return (
              <div key={i} className={`${t.card} overflow-hidden`}>
                <button
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  className="w-full flex items-center justify-between gap-4 p-5 text-left"
                >
                  <span className={`font-semibold ${t.heading}`}>{it.question}</span>
                  <ChevronDown
                    size={20}
                    className={`shrink-0 ${t.accent} transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <p className={`px-5 pb-5 text-sm leading-relaxed ${t.muted}`}>{it.answer}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default FaqSection
