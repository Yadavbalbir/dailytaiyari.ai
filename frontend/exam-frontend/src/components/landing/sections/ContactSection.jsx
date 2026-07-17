import { Mail, Phone, MapPin } from 'lucide-react'
import { SectionHeading } from '../shared'

const Row = ({ icon: I, children, t }) => {
  if (!children) return null
  return (
    <div className="flex items-start gap-3">
      <span className="grid place-items-center h-10 w-10 rounded-xl bg-primary-50 text-primary-600 shrink-0">
        <I size={18} />
      </span>
      <span className={`pt-2 ${t.heading}`}>{children}</span>
    </div>
  )
}

const ContactSection = ({ data = {}, t }) => {
  const hasAny = data.email || data.phone || data.address || data.map_embed
  if (!hasAny) return null
  return (
    <section className={`${t.section} ${t.sectionAlt}`}>
      <div className={t.container}>
        <SectionHeading t={t} title={data.title} subtitle={data.subtitle} gradient />
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <div className={`${t.card} p-7 space-y-5`}>
            <Row icon={Mail} t={t}>
              {data.email ? <a href={`mailto:${data.email}`} className="hover:underline">{data.email}</a> : null}
            </Row>
            <Row icon={Phone} t={t}>
              {data.phone ? <a href={`tel:${data.phone}`} className="hover:underline">{data.phone}</a> : null}
            </Row>
            <Row icon={MapPin} t={t}>{data.address}</Row>
          </div>
          {data.map_embed ? (
            <div className="overflow-hidden rounded-2xl shadow-lg aspect-video">
              <iframe
                title="Location"
                src={data.map_embed}
                className="h-full w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}

export default ContactSection
