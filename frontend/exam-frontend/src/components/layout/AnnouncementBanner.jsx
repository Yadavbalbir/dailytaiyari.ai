import { useState } from 'react'
import { X, Info, AlertTriangle, AlertOctagon } from 'lucide-react'
import { useTenantStore } from '../../context/tenantStore'

const DISMISS_KEY = 'dt_announcements_dismissed'

const LEVEL_STYLE = {
  info: { bg: '#e0f2fe', fg: '#075985', Icon: Info },
  warning: { bg: '#fef3c7', fg: '#92400e', Icon: AlertTriangle },
  critical: { bg: '#ffe4e6', fg: '#9f1239', Icon: AlertOctagon },
}

const readDismissed = () => {
  try {
    return JSON.parse(localStorage.getItem(DISMISS_KEY) || '[]')
  } catch {
    return []
  }
}

/**
 * Platform announcements banner. Content comes from the tenant config
 * (`announcements`), which the backend fills with any live global or
 * tenant-scoped notices authored by the DailyTaiyari super admin. Each notice
 * is dismissible; a dismissal is remembered by id so it stays hidden until a
 * new announcement is published.
 */
const AnnouncementBanner = () => {
  const announcements = useTenantStore((s) => s.tenant?.announcements) || []
  const [dismissed, setDismissed] = useState(readDismissed)

  const visible = announcements.filter((a) => !dismissed.includes(a.id))
  if (visible.length === 0) return null

  const dismiss = (id) => {
    const next = [...new Set([...dismissed, id])]
    try {
      localStorage.setItem(DISMISS_KEY, JSON.stringify(next))
    } catch {
      /* ignore storage errors */
    }
    setDismissed(next)
  }

  return (
    <div>
      {visible.map((a) => {
        const style = LEVEL_STYLE[a.level] || LEVEL_STYLE.info
        const { Icon } = style
        return (
          <div
            key={a.id}
            style={{ backgroundColor: style.bg, color: style.fg }}
            className="relative px-4 py-2.5 text-sm"
          >
            <div className="flex items-start justify-center gap-2 text-center flex-wrap pr-6">
              <Icon size={16} className="mt-0.5 shrink-0" />
              <span>
                {a.title && <span className="font-semibold">{a.title}</span>}
                {a.title && a.body && <span className="mx-1">—</span>}
                {a.body && <span>{a.body}</span>}
              </span>
            </div>
            <button
              onClick={() => dismiss(a.id)}
              aria-label="Dismiss announcement"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-black/10 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )
      })}
    </div>
  )
}

export default AnnouncementBanner
