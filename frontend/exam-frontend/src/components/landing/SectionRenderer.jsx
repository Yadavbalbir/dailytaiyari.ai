import HeroSection from './sections/HeroSection'
import StatsSection from './sections/StatsSection'
import FeaturesSection from './sections/FeaturesSection'
import CoursesSection from './sections/CoursesSection'
import AchieversSection from './sections/AchieversSection'
import TestimonialsSection from './sections/TestimonialsSection'
import AboutSection from './sections/AboutSection'
import FaqSection from './sections/FaqSection'
import GallerySection from './sections/GallerySection'
import CtaSection from './sections/CtaSection'
import ContactSection from './sections/ContactSection'

// Maps a section `type` to its renderer. Unknown types are ignored so a future
// section type stored by a newer builder never crashes an older client.
const REGISTRY = {
  hero: HeroSection,
  stats: StatsSection,
  features: FeaturesSection,
  courses: CoursesSection,
  achievers: AchieversSection,
  testimonials: TestimonialsSection,
  about: AboutSection,
  faq: FaqSection,
  gallery: GallerySection,
  cta: CtaSection,
  contact: ContactSection,
}

const SectionRenderer = ({ section, t, go }) => {
  if (!section || section.enabled === false) return null
  const Cmp = REGISTRY[section.type]
  if (!Cmp) return null
  return <Cmp data={section.data || {}} t={t} go={go} />
}

export default SectionRenderer
