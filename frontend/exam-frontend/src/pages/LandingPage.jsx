import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { landingService } from '../services/landingService'
import { getTemplate } from '../components/landing/templateConfig'
import LandingNavbar from '../components/landing/LandingNavbar'
import LandingFooter from '../components/landing/LandingFooter'
import SectionRenderer from '../components/landing/SectionRenderer'

// Public, no-login landing page rendered at "/" for anonymous visitors. Fully
// tenant-configurable: template, ordered sections and footer all come from the
// backend (with generic platform defaults so it's never empty).
const LandingPage = () => {
  const navigate = useNavigate()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['public-landing'],
    queryFn: landingService.getLanding,
    staleTime: 5 * 60 * 1000,
  })

  // Navigate helper: internal paths via router, external URLs in a new tab.
  const go = (link) => {
    if (!link) return
    if (/^https?:\/\//i.test(link)) {
      window.open(link, '_blank', 'noopener')
    } else if (link.startsWith('#')) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      navigate(link)
    }
  }

  const template = data?.template || 'aurora'
  const t = getTemplate(template)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen grid place-items-center bg-white text-center px-6">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Welcome</h1>
          <p className="mt-2 text-surface-500">This page is being set up. Please check back soon.</p>
          <button onClick={() => navigate('/courses')} className={`${getTemplate('aurora').btnPrimary} mt-6`}>
            Browse Courses
          </button>
        </div>
      </div>
    )
  }

  const sections = Array.isArray(data.sections) ? data.sections : []

  return (
    <div id="top" className={`min-h-screen ${t.page}`}>
      <LandingNavbar t={t} brand={data.brand || {}} go={go} sections={sections} />
      <main>
        {sections.map((section) => (
          <SectionRenderer key={section.id || section.type} section={section} t={t} go={go} />
        ))}
      </main>
      <LandingFooter footer={data.footer || {}} brand={data.brand || {}} go={go} />
    </div>
  )
}

export default LandingPage
