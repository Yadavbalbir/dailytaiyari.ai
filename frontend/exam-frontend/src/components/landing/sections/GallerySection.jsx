import { motion } from 'framer-motion'
import { SectionHeading } from '../shared'

const GallerySection = ({ data = {}, t }) => {
  const items = Array.isArray(data.items) ? data.items.filter((i) => i && i.image) : []
  if (!items.length) return null
  return (
    <section className={`${t.section} ${t.sectionAlt}`}>
      <div className={t.container}>
        <SectionHeading t={t} title={data.title} subtitle={data.subtitle} gradient />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((it, i) => (
            <motion.figure
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: (i % 4) * 0.05 }}
              className="group relative overflow-hidden rounded-2xl aspect-square"
            >
              <img
                src={it.image}
                alt={it.caption || ''}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              {it.caption ? (
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-sm font-medium text-white">
                  {it.caption}
                </figcaption>
              ) : null}
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  )
}

export default GallerySection
