import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Tag, ArrowRight } from 'lucide-react'
import { useTenantStore } from '../../context/tenantStore'
import { bannerThemeStyle } from '../../config/bannerThemes'

const DISMISS_KEY = 'dt_promo_banner_dismissed'
// A dismissed banner reappears after this cooldown even if unchanged, so an
// active promotion keeps surfacing without nagging on every page view.
const REDISPLAY_AFTER_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

// A dismissal only sticks while the same banner *version* is live and within
// the cooldown window. Editing/republishing the banner (new id or updated_at)
// clears it immediately.
const isDismissed = (banner) => {
    try {
        const raw = localStorage.getItem(DISMISS_KEY)
        if (!raw) return false
        const saved = JSON.parse(raw)
        if (saved.id !== banner.id) return false
        if (saved.updated_at !== banner.updated_at) return false
        if (Date.now() - (saved.ts || 0) > REDISPLAY_AFTER_MS) return false
        return true
    } catch {
        return false
    }
}

/**
 * Sitewide promo banner shown at the very top of the app and the public landing
 * page. Content comes from the tenant config (`promo_banner`). A dismissal is
 * remembered per banner version for a 7-day cooldown, then the banner returns;
 * it also returns immediately if the admin edits or republishes the banner.
 */
const PromoBanner = () => {
    const banner = useTenantStore((s) => s.tenant?.promo_banner)
    const [dismissed, setDismissed] = useState(false)
    const ref = useRef(null)

    // Re-evaluate dismissal whenever the live banner (or its version) changes.
    useEffect(() => {
        setDismissed(banner ? isDismissed(banner) : false)
    }, [banner?.id, banner?.updated_at])

    const visible = Boolean(banner) && !dismissed

    // Publish the banner height so a fixed header (e.g. the landing navbar) can
    // sit right below it via `top: var(--promo-banner-height)`.
    useLayoutEffect(() => {
        const root = document.documentElement
        const reset = () => root.style.setProperty('--promo-banner-height', '0px')
        if (!visible || !ref.current) {
            reset()
            return reset
        }
        const update = () =>
            root.style.setProperty('--promo-banner-height', `${ref.current.offsetHeight}px`)
        update()
        const ro = new ResizeObserver(update)
        ro.observe(ref.current)
        return () => {
            ro.disconnect()
            reset()
        }
    }, [visible, banner?.message, banner?.title])

    if (!visible) return null

    const style = bannerThemeStyle(banner)
    const dismiss = () => {
        try {
            localStorage.setItem(
                DISMISS_KEY,
                JSON.stringify({ id: banner.id, updated_at: banner.updated_at, ts: Date.now() })
            )
        } catch {
            /* ignore storage errors */
        }
        setDismissed(true)
    }

    const CtaWrapper = banner.cta_url
        ? ({ children }) =>
              /^https?:\/\//i.test(banner.cta_url) ? (
                  <a href={banner.cta_url} target="_blank" rel="noreferrer" className="contents">
                      {children}
                  </a>
              ) : (
                  <Link to={banner.cta_url} className="contents">
                      {children}
                  </Link>
              )
        : ({ children }) => <>{children}</>

    return (
        <AnimatePresence>
            <motion.div
                ref={ref}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={style}
                className="relative overflow-hidden"
            >
                <div className="px-4 py-2.5 flex items-center justify-center gap-3 text-sm font-medium text-center flex-wrap">
                    {banner.title && <span className="font-bold">{banner.title}</span>}
                    <span>{banner.message}</span>
                    {banner.coupon_code && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-xs font-semibold tracking-wide">
                            <Tag size={12} /> {banner.coupon_code}
                        </span>
                    )}
                    {banner.cta_label && (
                        <CtaWrapper>
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors text-xs font-semibold cursor-pointer">
                                {banner.cta_label}
                                <ArrowRight size={12} />
                            </span>
                        </CtaWrapper>
                    )}
                </div>
                {banner.dismissible && (
                    <button
                        onClick={dismiss}
                        aria-label="Dismiss"
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/20 transition-colors"
                    >
                        <X size={16} />
                    </button>
                )}
            </motion.div>
        </AnimatePresence>
    )
}

export default PromoBanner
