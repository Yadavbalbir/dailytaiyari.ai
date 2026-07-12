/**
 * Tenant colour themes.
 *
 * The whole app styles itself with Tailwind `primary-*` and `accent-*` classes.
 * Those two palettes are wired to CSS variables (see tailwind.config.js and
 * styles/index.css), so swapping the variables at runtime re-themes everything.
 *
 * Each palette value is an "R G B" channel triplet (space separated, no commas)
 * so Tailwind's `<alpha-value>` opacity modifiers keep working, e.g.
 * `bg-primary-500/25`.
 *
 * Keep the theme KEYS in sync with backend core/models.py Tenant.THEME_CHOICES.
 */

export const DEFAULT_THEME = 'sunrise'

export const THEMES = {
    sunrise: {
        key: 'sunrise',
        label: 'Sunrise Orange',
        description: 'Warm orange with a fuchsia pop — the classic look.',
        // Swatches shown in the picker (primary-500, accent-500).
        swatch: ['#f97316', '#d946ef'],
        primary: {
            50: '255 247 237', 100: '255 237 213', 200: '254 215 170',
            300: '253 186 116', 400: '251 146 60', 500: '249 115 22',
            600: '234 88 12', 700: '194 65 12', 800: '154 52 18', 900: '124 45 18',
        },
        accent: {
            50: '253 244 255', 100: '250 232 255', 200: '245 208 254',
            300: '240 171 252', 400: '232 121 249', 500: '217 70 239',
            600: '192 38 211', 700: '162 28 175', 800: '134 25 143', 900: '112 26 117',
        },
    },
    ocean: {
        key: 'ocean',
        label: 'Ocean Blue',
        description: 'Calm, trustworthy blue with a bright cyan accent.',
        swatch: ['#3b82f6', '#06b6d4'],
        primary: {
            50: '239 246 255', 100: '219 234 254', 200: '191 219 254',
            300: '147 197 253', 400: '96 165 250', 500: '59 130 246',
            600: '37 99 235', 700: '29 78 216', 800: '30 64 175', 900: '30 58 138',
        },
        accent: {
            50: '236 254 255', 100: '207 250 254', 200: '165 243 252',
            300: '103 232 249', 400: '34 211 238', 500: '6 182 212',
            600: '8 145 178', 700: '14 116 144', 800: '21 94 117', 900: '22 78 99',
        },
    },
    emerald: {
        key: 'emerald',
        label: 'Emerald Green',
        description: 'Fresh, focused green paired with a teal accent.',
        swatch: ['#10b981', '#14b8a6'],
        primary: {
            50: '236 253 245', 100: '209 250 229', 200: '167 243 208',
            300: '110 231 183', 400: '52 211 153', 500: '16 185 129',
            600: '5 150 105', 700: '4 120 87', 800: '6 95 70', 900: '6 78 59',
        },
        accent: {
            50: '240 253 250', 100: '204 251 241', 200: '153 246 228',
            300: '94 234 212', 400: '45 212 191', 500: '20 184 166',
            600: '13 148 136', 700: '15 118 110', 800: '17 94 89', 900: '19 78 74',
        },
    },
    violet: {
        key: 'violet',
        label: 'Royal Purple',
        description: 'Premium violet with a playful pink accent.',
        swatch: ['#8b5cf6', '#ec4899'],
        primary: {
            50: '245 243 255', 100: '237 233 254', 200: '221 214 254',
            300: '196 181 253', 400: '167 139 250', 500: '139 92 246',
            600: '124 58 237', 700: '109 40 217', 800: '91 33 182', 900: '76 29 149',
        },
        accent: {
            50: '253 242 248', 100: '252 231 243', 200: '251 207 232',
            300: '249 168 212', 400: '244 114 182', 500: '236 72 153',
            600: '219 39 119', 700: '190 24 93', 800: '157 23 77', 900: '131 24 67',
        },
    },
    rose: {
        key: 'rose',
        label: 'Crimson Rose',
        description: 'Bold rose-red warmed with a golden amber accent.',
        swatch: ['#f43f5e', '#f59e0b'],
        primary: {
            50: '255 241 242', 100: '255 228 230', 200: '254 205 211',
            300: '253 164 175', 400: '251 113 133', 500: '244 63 94',
            600: '225 29 72', 700: '190 18 60', 800: '159 18 57', 900: '136 19 55',
        },
        accent: {
            50: '255 251 235', 100: '254 243 199', 200: '253 230 138',
            300: '252 211 77', 400: '251 191 36', 500: '245 158 11',
            600: '217 119 6', 700: '180 83 9', 800: '146 64 14', 900: '120 53 15',
        },
    },
    indigo: {
        key: 'indigo',
        label: 'Midnight Indigo',
        description: 'Deep, techy indigo lit up by a sky-blue accent.',
        swatch: ['#6366f1', '#0ea5e9'],
        primary: {
            50: '238 242 255', 100: '224 231 255', 200: '199 210 254',
            300: '165 180 252', 400: '129 140 248', 500: '99 102 241',
            600: '79 70 229', 700: '67 56 202', 800: '55 48 163', 900: '49 46 129',
        },
        accent: {
            50: '240 249 255', 100: '224 242 254', 200: '186 230 253',
            300: '125 211 252', 400: '56 189 248', 500: '14 165 233',
            600: '2 132 199', 700: '3 105 161', 800: '7 89 133', 900: '12 74 110',
        },
    },
    slate: {
        key: 'slate',
        label: 'Graphite Slate',
        description: 'Understated, professional grey with a crisp blue accent.',
        swatch: ['#64748b', '#3b82f6'],
        primary: {
            50: '248 250 252', 100: '241 245 249', 200: '226 232 240',
            300: '203 213 225', 400: '148 163 184', 500: '100 116 139',
            600: '71 85 105', 700: '51 65 85', 800: '30 41 59', 900: '15 23 42',
        },
        accent: {
            50: '239 246 255', 100: '219 234 254', 200: '191 219 254',
            300: '147 197 253', 400: '96 165 250', 500: '59 130 246',
            600: '37 99 235', 700: '29 78 216', 800: '30 64 175', 900: '30 58 138',
        },
    },
    amber: {
        key: 'amber',
        label: 'Golden Amber',
        description: 'Rich golden amber with a rosy pink accent.',
        swatch: ['#f59e0b', '#f43f5e'],
        primary: {
            50: '255 251 235', 100: '254 243 199', 200: '253 230 138',
            300: '252 211 77', 400: '251 191 36', 500: '245 158 11',
            600: '217 119 6', 700: '180 83 9', 800: '146 64 14', 900: '120 53 15',
        },
        accent: {
            50: '255 241 242', 100: '255 228 230', 200: '254 205 211',
            300: '253 164 175', 400: '251 113 133', 500: '244 63 94',
            600: '225 29 72', 700: '190 18 60', 800: '159 18 57', 900: '136 19 55',
        },
    },
    cherry: {
        key: 'cherry',
        label: 'Cherry Red',
        description: 'Confident cherry red with a vivid orange accent.',
        swatch: ['#ef4444', '#f97316'],
        primary: {
            50: '254 242 242', 100: '254 226 226', 200: '254 202 202',
            300: '252 165 165', 400: '248 113 113', 500: '239 68 68',
            600: '220 38 38', 700: '185 28 28', 800: '153 27 27', 900: '127 29 29',
        },
        accent: {
            50: '255 247 237', 100: '255 237 213', 200: '254 215 170',
            300: '253 186 116', 400: '251 146 60', 500: '249 115 22',
            600: '234 88 12', 700: '194 65 12', 800: '154 52 18', 900: '124 45 18',
        },
    },
    lime: {
        key: 'lime',
        label: 'Fresh Lime',
        description: 'Energetic lime green with an emerald accent.',
        swatch: ['#84cc16', '#10b981'],
        primary: {
            50: '247 254 231', 100: '236 252 203', 200: '217 249 157',
            300: '190 242 100', 400: '163 230 53', 500: '132 204 22',
            600: '101 163 13', 700: '77 124 15', 800: '63 98 18', 900: '54 83 20',
        },
        accent: {
            50: '236 253 245', 100: '209 250 229', 200: '167 243 208',
            300: '110 231 183', 400: '52 211 153', 500: '16 185 129',
            600: '5 150 105', 700: '4 120 87', 800: '6 95 70', 900: '6 78 59',
        },
    },
}

// Ordered list for rendering the picker.
export const THEME_LIST = Object.values(THEMES)

/**
 * Apply a theme by writing its palette onto CSS custom properties on <html>.
 * Falls back to the default theme for unknown keys.
 */
export const applyTheme = (themeKey) => {
    if (typeof document === 'undefined') return
    const theme = THEMES[themeKey] || THEMES[DEFAULT_THEME]
    const root = document.documentElement
    Object.entries(theme.primary).forEach(([shade, rgb]) => {
        root.style.setProperty(`--color-primary-${shade}`, rgb)
    })
    Object.entries(theme.accent).forEach(([shade, rgb]) => {
        root.style.setProperty(`--color-accent-${shade}`, rgb)
    })
    root.dataset.theme = theme.key
}
