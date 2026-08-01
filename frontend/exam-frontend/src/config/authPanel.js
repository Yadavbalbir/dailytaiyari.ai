// Generic, brand-neutral defaults for the marketing panel shown on the
// left-hand side of the login / register screens (see AuthLayout.jsx).
//
// A tenant admin can override any of these from Admin → Settings → General.
// Only the keys they set are stored; everything else falls back to the values
// here, so the auth screens always look complete out of the box.
export const DEFAULT_AUTH_PANEL = {
    heading: 'Your Learning Journey',
    heading_highlight: 'Starts Here',
    subtitle:
        'Join a community of motivated learners with structured courses, '
        + 'practice tests and personalised, AI-powered learning.',
    stats: [],
}

// Merge a tenant's stored auth_panel (which may be empty or partial) over the
// generic defaults so callers always get a complete, safe object to render.
export const resolveAuthPanel = (panel) => {
    const p = panel && typeof panel === 'object' ? panel : {}
    const stats = Array.isArray(p.stats) ? p.stats : DEFAULT_AUTH_PANEL.stats
    return {
        heading:
            typeof p.heading === 'string' && p.heading.trim()
                ? p.heading
                : DEFAULT_AUTH_PANEL.heading,
        heading_highlight:
            typeof p.heading_highlight === 'string' && p.heading_highlight.trim()
                ? p.heading_highlight
                : DEFAULT_AUTH_PANEL.heading_highlight,
        subtitle:
            typeof p.subtitle === 'string' && p.subtitle.trim()
                ? p.subtitle
                : DEFAULT_AUTH_PANEL.subtitle,
        stats: stats
            .filter((s) => s && (s.value || s.label))
            .map((s) => ({ value: s.value || '', label: s.label || '' })),
    }
}
