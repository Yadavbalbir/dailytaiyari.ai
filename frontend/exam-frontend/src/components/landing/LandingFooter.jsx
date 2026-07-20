import { Facebook, Instagram, Youtube, Twitter, Linkedin, Globe, Mail, Phone, MapPin } from 'lucide-react'

const SOCIAL_ICONS = {
  facebook: Facebook,
  instagram: Instagram,
  youtube: Youtube,
  twitter: Twitter,
  linkedin: Linkedin,
  website: Globe,
}

// Client-specific footer driven by the tenant's `footer` config: about blurb,
// contact details, social links, link columns and a copyright line.
const LandingFooter = ({ footer = {}, brand = {}, go }) => {
  const socials = (footer.socials || []).filter((s) => s && s.url)
  const columns = (footer.columns || []).filter((c) => c && (c.links || []).length)
  const year = new Date().getFullYear()
  const copyright = (footer.copyright || `© {year} ${brand.name || ''}. All rights reserved.`).replace(
    '{year}',
    year
  )

  return (
    <footer className="bg-surface-900 text-surface-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5">
              {brand.logo ? (
                <img src={brand.logo} alt={brand.name} className="h-9 w-auto object-contain" />
              ) : (
                <span className="grid place-items-center h-9 w-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 text-white font-bold">
                  {(brand.name || '?').charAt(0)}
                </span>
              )}
              {brand.show_name !== false && brand.name ? (
                <span className="font-display font-bold text-lg text-white">{brand.name}</span>
              ) : null}
            </div>
            {footer.about ? <p className="mt-4 text-sm leading-relaxed text-surface-400">{footer.about}</p> : null}
            {socials.length > 0 && (
              <div className="mt-5 flex gap-2.5">
                {socials.map((s, i) => {
                  const I = SOCIAL_ICONS[s.platform] || Globe
                  return (
                    <a
                      key={i}
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="grid place-items-center h-9 w-9 rounded-full bg-white/5 hover:bg-primary-600 hover:text-white transition-colors"
                      aria-label={s.platform}
                    >
                      <I size={17} />
                    </a>
                  )
                })}
              </div>
            )}
          </div>

          {columns.map((col, i) => (
            <div key={i}>
              <h4 className="font-semibold text-white text-sm uppercase tracking-wider">{col.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {(col.links || []).map((l, j) => (
                  <li key={j}>
                    <button
                      onClick={() => go(l.url)}
                      className="text-sm text-surface-400 hover:text-primary-400 transition-colors"
                    >
                      {l.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {(footer.email || footer.phone || footer.address) && (
            <div>
              <h4 className="font-semibold text-white text-sm uppercase tracking-wider">Contact</h4>
              <ul className="mt-4 space-y-3 text-sm text-surface-400">
                {footer.email ? (
                  <li className="flex items-start gap-2.5">
                    <Mail size={16} className="mt-0.5 shrink-0" />
                    <a href={`mailto:${footer.email}`} className="hover:text-primary-400 break-all">{footer.email}</a>
                  </li>
                ) : null}
                {footer.phone ? (
                  <li className="flex items-start gap-2.5">
                    <Phone size={16} className="mt-0.5 shrink-0" />
                    <a href={`tel:${footer.phone}`} className="hover:text-primary-400">{footer.phone}</a>
                  </li>
                ) : null}
                {footer.address ? (
                  <li className="flex items-start gap-2.5">
                    <MapPin size={16} className="mt-0.5 shrink-0" />
                    <span>{footer.address}</span>
                  </li>
                ) : null}
              </ul>
            </div>
          )}
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-surface-500">{copyright}</p>
          <div className="flex gap-4 text-xs text-surface-500">
            <button onClick={() => go('/privacy-policy')} className="hover:text-primary-400">Privacy</button>
            <button onClick={() => go('/refund-policy')} className="hover:text-primary-400">Refund</button>
            <button onClick={() => go('/terms')} className="hover:text-primary-400">Terms</button>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default LandingFooter
