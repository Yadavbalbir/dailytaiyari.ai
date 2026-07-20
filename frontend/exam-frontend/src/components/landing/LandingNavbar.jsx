import { useEffect, useState } from 'react'
import { Menu, X, LogIn, LayoutDashboard } from 'lucide-react'
import { useAuthStore } from '../../context/authStore'

// Public landing navbar: tenant logo/name on the left, quick links + auth CTAs
// on the right. Fixed & translucent; solidifies on scroll.
const LandingNavbar = ({ t, brand = {}, go, sections = [] }) => {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const { isAuthenticated, isOnboarded } = useAuthStore()
  const loggedIn = isAuthenticated && isOnboarded

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const hasCourses = sections.some((s) => s.type === 'courses' && s.enabled !== false)
  const links = [
    { label: 'Home', to: '#top' },
    ...(hasCourses ? [{ label: 'Courses', to: '/courses' }] : []),
    ...(loggedIn ? [] : [{ label: 'Login', to: '/login' }]),
  ]

  const onLink = (to) => {
    setOpen(false)
    if (to.startsWith('#')) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      go(to)
    }
  }

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all ${scrolled ? `${t.navBg} shadow-sm` : 'bg-transparent'}`}
    >
      <div className={`${t.container} flex h-16 items-center justify-between`}>
        <button onClick={() => onLink('#top')} className="flex items-center gap-2.5 min-w-0">
          {brand.logo ? (
            <img src={brand.logo} alt={brand.name} className="h-9 w-auto object-contain" />
          ) : (
            <span className="grid place-items-center h-9 w-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 text-white font-bold">
              {(brand.name || '?').charAt(0)}
            </span>
          )}
          {brand.show_name !== false && brand.name ? (
            <span className={`font-display font-bold text-lg truncate ${scrolled ? t.navText : t.navText}`}>
              {brand.name}
            </span>
          ) : null}
        </button>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <button
              key={l.label}
              onClick={() => onLink(l.to)}
              className={`px-4 py-2 rounded-full text-sm font-medium ${t.navText} hover:bg-primary-500/10 transition-colors`}
            >
              {l.label}
            </button>
          ))}
          <button onClick={() => go(loggedIn ? '/dashboard' : '/register')} className={`${t.btnPrimary} ml-2 !py-2 !px-5 text-sm`}>
            {loggedIn ? (<><LayoutDashboard size={16} /> Dashboard</>) : 'Get Started'}
          </button>
        </nav>

        <button
          onClick={() => setOpen((v) => !v)}
          className={`md:hidden p-2 rounded-lg ${t.navText}`}
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className={`md:hidden ${t.navBg} border-t border-black/5 px-4 py-3 space-y-1`}>
          {links.map((l) => (
            <button
              key={l.label}
              onClick={() => onLink(l.to)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium ${t.navText} hover:bg-primary-500/10`}
            >
              {l.label}
            </button>
          ))}
          <button onClick={() => { setOpen(false); go(loggedIn ? '/dashboard' : '/register') }} className={`${t.btnPrimary} w-full !py-2.5 mt-1`}>
            {loggedIn ? (<><LayoutDashboard size={16} /> Dashboard</>) : (<><LogIn size={16} /> Get Started</>)}
          </button>
        </div>
      )}
    </header>
  )
}

export default LandingNavbar
