import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Tag, ArrowRight } from 'lucide-react'
import { useTenantStore } from '../../context/tenantStore'
import { bannerThemeStyle } from '../../config/bannerThemes'

const DISMISS_KEY = 'dt_promo_banner_dismissed'

/**
 * Sitewide promo banner shown at the very top of the app. Content comes from the
 * tenant config (`promo_banner`); a dismissible banner is remembered per id via
 * localStorage so it stays hidden until the admin publishes a different one.
 */
const PromoBanner = () => {
    const banner = useTenantStore((s) => s.tenant?.promo_banner)
    const [dismissed, setDismissed] = useState(() => {
        if (!banner) return false
        try {
            return localStorage.getItem(DISMISS_KEY) === banner.id
        } catch {
            return false
        }
    })

    if (!banner || dismissed) return null

    const style = bannerThemeStyle(banner)
    const dismiss = () => {
        try {
            localStorage.setItem(DISMISS_KEY, banner.id)
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
