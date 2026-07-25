// Promo banner visual presets. Keys mirror backend marketing.PromoBanner.THEME_CHOICES.
// `style()` returns inline styles for a given theme (and custom colours).

export const BANNER_THEMES = [
    { key: 'sunset', label: 'Sunset', gradient: 'linear-gradient(90deg, #f97316, #ec4899)', text: '#ffffff' },
    { key: 'ocean', label: 'Ocean', gradient: 'linear-gradient(90deg, #2563eb, #06b6d4)', text: '#ffffff' },
    { key: 'forest', label: 'Forest', gradient: 'linear-gradient(90deg, #059669, #14b8a6)', text: '#ffffff' },
    { key: 'royal', label: 'Royal', gradient: 'linear-gradient(90deg, #4f46e5, #8b5cf6)', text: '#ffffff' },
    { key: 'midnight', label: 'Midnight', gradient: 'linear-gradient(90deg, #0f172a, #334155)', text: '#ffffff' },
    { key: 'custom', label: 'Custom', gradient: '', text: '#ffffff' },
]

export const bannerThemeStyle = (banner) => {
    if (!banner) return { background: BANNER_THEMES[0].gradient, color: '#fff' }
    if (banner.theme === 'custom') {
        return {
            background: banner.bg_color || '#111827',
            color: banner.text_color || '#ffffff',
        }
    }
    const preset = BANNER_THEMES.find((t) => t.key === banner.theme) || BANNER_THEMES[0]
    return { background: preset.gradient, color: preset.text }
}
