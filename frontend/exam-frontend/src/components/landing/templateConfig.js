/**
 * Per-template visual tokens for the public landing page.
 *
 * The tenant's *colour* theme is already wired to Tailwind `primary-*` /
 * `accent-*` CSS variables app-wide, so templates here control *layout & skin*
 * (light vs dark, gradients, card treatment, radius) and lean on primary/accent
 * for the brand colour. Every template returns the same token keys so section
 * components stay template-agnostic.
 */

const BASE = {
  section: 'py-16 sm:py-20 lg:py-24',
  container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  eyebrow: 'inline-block text-sm font-semibold uppercase tracking-wider text-primary-600',
  h2: 'font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight',
  lead: 'text-base sm:text-lg',
  btnPrimary:
    'inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 font-semibold ' +
    'bg-primary-600 text-white shadow-lg shadow-primary-500/30 hover:bg-primary-700 ' +
    'hover:-translate-y-0.5 transition-all',
  btnGhost:
    'inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 font-semibold ' +
    'transition-all hover:-translate-y-0.5',
}

export const TEMPLATES = {
  aurora: {
    ...BASE,
    key: 'aurora',
    page: 'bg-white text-surface-900',
    heroBg:
      'relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-accent-50',
    heroBlob: true,
    sectionAlt: 'bg-gradient-to-b from-surface-50 to-white',
    heading: 'text-surface-900',
    headingGradient:
      'bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent',
    muted: 'text-surface-500',
    card: 'rounded-2xl bg-white border border-surface-100 shadow-sm hover:shadow-xl transition-shadow',
    chip: 'rounded-full bg-white/70 backdrop-blur border border-surface-200 text-surface-700',
    btnGhost: BASE.btnGhost + ' bg-white text-surface-800 border border-surface-200 hover:bg-surface-50',
    accent: 'text-primary-600',
    navBg: 'bg-white/80 backdrop-blur-md border-b border-surface-100',
    navText: 'text-surface-700',
    footerBg: 'bg-surface-900 text-surface-300',
  },
  spotlight: {
    ...BASE,
    key: 'spotlight',
    page: 'bg-surface-950 text-surface-100',
    heroBg: 'relative overflow-hidden bg-surface-950',
    heroBlob: true,
    sectionAlt: 'bg-surface-900/40',
    heading: 'text-white',
    headingGradient:
      'bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent',
    muted: 'text-surface-400',
    eyebrow: 'inline-block text-sm font-semibold uppercase tracking-wider text-primary-400',
    card: 'rounded-2xl bg-surface-900/70 border border-white/10 shadow-lg hover:border-primary-500/40 transition-colors',
    chip: 'rounded-full bg-white/5 backdrop-blur border border-white/10 text-surface-200',
    btnGhost: BASE.btnGhost + ' bg-white/5 text-white border border-white/15 hover:bg-white/10',
    accent: 'text-primary-400',
    navBg: 'bg-surface-950/80 backdrop-blur-md border-b border-white/10',
    navText: 'text-surface-200',
    footerBg: 'bg-black text-surface-400',
  },
  classic: {
    ...BASE,
    key: 'classic',
    page: 'bg-white text-surface-900',
    heroBg: 'relative overflow-hidden bg-primary-600 text-white',
    heroBlob: false,
    sectionAlt: 'bg-surface-50',
    heading: 'text-surface-900',
    headingGradient: 'text-primary-700',
    muted: 'text-surface-500',
    eyebrow: 'inline-block text-sm font-semibold uppercase tracking-wider text-primary-600',
    card: 'rounded-xl bg-white border border-surface-200 shadow-sm hover:shadow-md transition-shadow',
    chip: 'rounded-full bg-white/15 border border-white/25 text-white',
    btnGhost: BASE.btnGhost + ' bg-white text-primary-700 border border-white hover:bg-primary-50',
    accent: 'text-primary-600',
    navBg: 'bg-white border-b border-surface-200',
    navText: 'text-surface-700',
    footerBg: 'bg-surface-800 text-surface-300',
  },
  minimal: {
    ...BASE,
    key: 'minimal',
    page: 'bg-white text-surface-900',
    heroBg: 'relative overflow-hidden bg-white',
    heroBlob: false,
    sectionAlt: 'bg-surface-50',
    heading: 'text-surface-900',
    headingGradient: 'text-surface-900',
    muted: 'text-surface-500',
    eyebrow: 'inline-block text-sm font-semibold uppercase tracking-[0.2em] text-surface-500',
    card: 'rounded-none bg-white border border-surface-200 hover:border-surface-900 transition-colors',
    chip: 'rounded-full border border-surface-300 text-surface-700',
    btnPrimary:
      'inline-flex items-center justify-center gap-2 rounded-none px-7 py-3 font-semibold ' +
      'bg-surface-900 text-white hover:bg-surface-700 transition-colors',
    btnGhost: BASE.btnGhost + ' rounded-none border border-surface-900 text-surface-900 hover:bg-surface-900 hover:text-white',
    accent: 'text-surface-900',
    navBg: 'bg-white border-b border-surface-200',
    navText: 'text-surface-700',
    footerBg: 'bg-surface-900 text-surface-400',
  },
}

export const getTemplate = (key) => TEMPLATES[key] || TEMPLATES.aurora
