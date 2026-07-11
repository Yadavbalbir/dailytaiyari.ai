/**
 * Certificate designs.
 *
 * Each builder returns a standalone SVG **string** (viewBox 1400×990, ~A4
 * landscape) so the exact same markup powers both the on-screen preview and the
 * PNG/PDF export. Text is drawn with web-safe font families so it renders
 * identically when the SVG is rasterised onto a canvas.
 */

const WIDTH = 1400
const HEIGHT = 990

const esc = (s = '') =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

/** Fit a long course/student name into a font size that won't overflow. */
const fitSize = (text = '', base = 64, maxChars = 26, min = 30) => {
  const len = String(text).length
  if (len <= maxChars) return base
  return Math.max(min, Math.round(base * (maxChars / len)))
}

const sealMark = (cx, cy, r, ring, fill, star = '#ffffff') => `
  <g>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" />
    <circle cx="${cx}" cy="${cy}" r="${r - 8}" fill="none" stroke="${star}" stroke-opacity="0.5" stroke-width="2" />
    <circle cx="${cx}" cy="${cy}" r="${r + 10}" fill="none" stroke="${ring}" stroke-width="3" />
    <path d="M ${cx} ${cy - 26} l 7 20 21 0 -17 13 6 21 -17 -13 -17 13 6 -21 -17 -13 21 0 z" fill="${star}" />
    <path d="M ${cx - r} ${cy + r + 22} l 26 0 -13 20 z" fill="${ring}" />
    <path d="M ${cx + r} ${cy + r + 22} l -26 0 13 20 z" fill="${ring}" />
  </g>`

const logoBlock = (href, x, y, size) => {
  if (!href) return ''
  return `<image href="${href}" x="${x}" y="${y}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet" />`
}

/* ── Classic — navy & gold, ornate ─────────────────────────────────────── */
function classic(d) {
  const navy = '#0f2547'
  const gold = '#c39a3f'
  const name = esc(d.studentName)
  const course = esc(d.courseName)
  const nameSize = fitSize(d.studentName, 72, 24, 34)
  const courseSize = fitSize(d.courseName, 40, 40, 24)
  return `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" font-family="Georgia, 'Times New Roman', serif">
    <defs>
      <linearGradient id="cg-gold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#e7c66a"/><stop offset="0.5" stop-color="#c39a3f"/><stop offset="1" stop-color="#9c7628"/>
      </linearGradient>
    </defs>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="#fbf8f1"/>
    <rect x="26" y="26" width="${WIDTH - 52}" height="${HEIGHT - 52}" fill="none" stroke="url(#cg-gold)" stroke-width="6"/>
    <rect x="44" y="44" width="${WIDTH - 88}" height="${HEIGHT - 88}" fill="none" stroke="${navy}" stroke-width="2"/>
    ${[[44, 44], [WIDTH - 44, 44], [44, HEIGHT - 44], [WIDTH - 44, HEIGHT - 44]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="10" fill="${gold}"/>`).join('')}
    ${logoBlock(d.logoHref, WIDTH / 2 - 45, 78, 90)}
    <text x="${WIDTH / 2}" y="${d.logoHref ? 205 : 150}" text-anchor="middle" font-size="30" letter-spacing="6" fill="${navy}" font-weight="bold">${esc(d.tenantName || '')}</text>
    <text x="${WIDTH / 2}" y="285" text-anchor="middle" font-size="58" letter-spacing="8" fill="${navy}" font-weight="bold">CERTIFICATE</text>
    <text x="${WIDTH / 2}" y="330" text-anchor="middle" font-size="26" letter-spacing="14" fill="${gold}">OF COMPLETION</text>
    <line x1="${WIDTH / 2 - 90}" y1="360" x2="${WIDTH / 2 + 90}" y2="360" stroke="${gold}" stroke-width="2"/>
    <text x="${WIDTH / 2}" y="425" text-anchor="middle" font-size="24" fill="#6b6250" font-style="italic">This certificate is proudly presented to</text>
    <text x="${WIDTH / 2}" y="510" text-anchor="middle" font-size="${nameSize}" fill="${navy}" font-weight="bold">${name}</text>
    <line x1="${WIDTH / 2 - 260}" y1="540" x2="${WIDTH / 2 + 260}" y2="540" stroke="${navy}" stroke-opacity="0.25" stroke-width="1.5"/>
    <text x="${WIDTH / 2}" y="595" text-anchor="middle" font-size="24" fill="#6b6250" font-style="italic">for successfully completing the course</text>
    <text x="${WIDTH / 2}" y="650" text-anchor="middle" font-size="${courseSize}" fill="${gold}" font-weight="bold">${course}</text>
    ${sealMark(WIDTH / 2, 770, 46, gold, navy, '#e7c66a')}
    <text x="230" y="820" text-anchor="middle" font-size="26" fill="${navy}" font-weight="bold">${esc(d.issuedDate)}</text>
    <line x1="120" y1="838" x2="340" y2="838" stroke="${navy}" stroke-width="1.5"/>
    <text x="230" y="866" text-anchor="middle" font-size="18" letter-spacing="2" fill="#8a8371">DATE</text>
    <text x="${WIDTH - 230}" y="820" text-anchor="middle" font-size="22" fill="${navy}" font-weight="bold">${esc(d.tenantName || 'Authorised Signatory')}</text>
    <line x1="${WIDTH - 340}" y1="838" x2="${WIDTH - 120}" y2="838" stroke="${navy}" stroke-width="1.5"/>
    <text x="${WIDTH - 230}" y="866" text-anchor="middle" font-size="18" letter-spacing="2" fill="#8a8371">ISSUED BY</text>
    <text x="${WIDTH / 2}" y="928" text-anchor="middle" font-size="16" letter-spacing="1" fill="#9a927d">Certificate No: ${esc(d.certificateNumber)}${d.verifyUrl ? '  ·  Verify at ' + esc(d.verifyUrl) : ''}</text>
  </svg>`
}

/* ── Modern — bold color blocks ────────────────────────────────────────── */
function modern(d) {
  const accent = d.accent || '#4f46e5'
  const ink = '#0f172a'
  const name = esc(d.studentName)
  const course = esc(d.courseName)
  const nameSize = fitSize(d.studentName, 76, 22, 34)
  const courseSize = fitSize(d.courseName, 40, 38, 24)
  return `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" font-family="Helvetica, Arial, sans-serif">
    <defs>
      <linearGradient id="mg-band" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${accent}"/><stop offset="1" stop-color="${shade(accent, -28)}"/>
      </linearGradient>
    </defs>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="#ffffff"/>
    <rect x="0" y="0" width="150" height="${HEIGHT}" fill="url(#mg-band)"/>
    <circle cx="${WIDTH - 90}" cy="90" r="150" fill="${accent}" fill-opacity="0.10"/>
    <circle cx="${WIDTH - 40}" cy="${HEIGHT - 40}" r="120" fill="${accent}" fill-opacity="0.10"/>
    <rect x="150" y="0" width="${WIDTH - 150}" height="14" fill="${accent}"/>
    <rect x="150" y="${HEIGHT - 14}" width="${WIDTH - 150}" height="14" fill="${accent}"/>
    ${logoBlock(d.logoHref, 220, 90, 76)}
    <text x="${d.logoHref ? 320 : 230}" y="140" font-size="30" letter-spacing="2" fill="${ink}" font-weight="bold">${esc(d.tenantName || '')}</text>
    <text x="230" y="270" font-size="72" letter-spacing="1" fill="${ink}" font-weight="bold">Certificate</text>
    <text x="234" y="320" font-size="26" letter-spacing="10" fill="${accent}" font-weight="bold">OF COMPLETION</text>
    <rect x="234" y="345" width="120" height="6" rx="3" fill="${accent}"/>
    <text x="234" y="440" font-size="22" fill="#64748b">This is to certify that</text>
    <text x="230" y="530" font-size="${nameSize}" fill="${ink}" font-weight="bold">${name}</text>
    <text x="234" y="600" font-size="22" fill="#64748b">has successfully completed</text>
    <text x="230" y="662" font-size="${courseSize}" fill="${accent}" font-weight="bold">${course}</text>
    ${sealMark(WIDTH - 200, 300, 54, ink, accent, '#ffffff')}
    <g>
      <text x="234" y="838" font-size="24" fill="${ink}" font-weight="bold">${esc(d.issuedDate)}</text>
      <line x1="234" y1="856" x2="470" y2="856" stroke="#cbd5e1" stroke-width="2"/>
      <text x="234" y="884" font-size="16" letter-spacing="2" fill="#94a3b8">DATE ISSUED</text>
    </g>
    <g>
      <text x="${WIDTH - 120}" y="838" text-anchor="end" font-size="16" letter-spacing="1" fill="#94a3b8">Certificate No.</text>
      <text x="${WIDTH - 120}" y="866" text-anchor="end" font-size="22" fill="${ink}" font-weight="bold">${esc(d.certificateNumber)}</text>
      ${d.verifyUrl ? `<text x="${WIDTH - 120}" y="892" text-anchor="end" font-size="14" fill="#94a3b8">Verify at ${esc(d.verifyUrl)}</text>` : ''}
    </g>
  </svg>`
}

/* ── Elegant — cream & gold, refined ───────────────────────────────────── */
function elegant(d) {
  const gold = '#b08d3f'
  const ink = '#3a3220'
  const name = esc(d.studentName)
  const course = esc(d.courseName)
  const nameSize = fitSize(d.studentName, 74, 24, 34)
  const courseSize = fitSize(d.courseName, 38, 40, 22)
  return `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" font-family="'Palatino Linotype', Georgia, serif">
    <rect width="${WIDTH}" height="${HEIGHT}" fill="#faf6ec"/>
    <rect x="40" y="40" width="${WIDTH - 80}" height="${HEIGHT - 80}" fill="none" stroke="${gold}" stroke-width="1.5"/>
    <rect x="52" y="52" width="${WIDTH - 104}" height="${HEIGHT - 104}" fill="none" stroke="${gold}" stroke-opacity="0.5" stroke-width="1"/>
    ${[[40, 40], [WIDTH - 40, 40], [40, HEIGHT - 40], [WIDTH - 40, HEIGHT - 40]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6" fill="${gold}"/>`).join('')}
    ${logoBlock(d.logoHref, WIDTH / 2 - 40, 92, 80)}
    <text x="${WIDTH / 2}" y="${d.logoHref ? 210 : 160}" text-anchor="middle" font-size="26" letter-spacing="8" fill="${gold}">${esc((d.tenantName || '').toUpperCase())}</text>
    <text x="${WIDTH / 2}" y="300" text-anchor="middle" font-size="66" fill="${ink}" font-style="italic">Certificate of Completion</text>
    <g stroke="${gold}" stroke-width="1.5">
      <line x1="${WIDTH / 2 - 170}" y1="340" x2="${WIDTH / 2 - 30}" y2="340"/>
      <line x1="${WIDTH / 2 + 30}" y1="340" x2="${WIDTH / 2 + 170}" y2="340"/>
    </g>
    <circle cx="${WIDTH / 2}" cy="340" r="5" fill="${gold}"/>
    <text x="${WIDTH / 2}" y="420" text-anchor="middle" font-size="23" fill="#7a6f52" font-style="italic">This certifies that</text>
    <text x="${WIDTH / 2}" y="505" text-anchor="middle" font-size="${nameSize}" fill="${ink}">${name}</text>
    <line x1="${WIDTH / 2 - 240}" y1="535" x2="${WIDTH / 2 + 240}" y2="535" stroke="${gold}" stroke-opacity="0.6" stroke-width="1"/>
    <text x="${WIDTH / 2}" y="590" text-anchor="middle" font-size="23" fill="#7a6f52" font-style="italic">has completed with distinction the course of</text>
    <text x="${WIDTH / 2}" y="648" text-anchor="middle" font-size="${courseSize}" fill="${gold}" font-weight="bold" letter-spacing="1">${course}</text>
    ${sealMark(WIDTH / 2, 762, 42, gold, ink, '#f3e4bd')}
    <text x="250" y="822" text-anchor="middle" font-size="24" fill="${ink}">${esc(d.issuedDate)}</text>
    <line x1="140" y1="840" x2="360" y2="840" stroke="${gold}" stroke-width="1"/>
    <text x="250" y="866" text-anchor="middle" font-size="16" letter-spacing="3" fill="#9a8c66">DATE</text>
    <text x="${WIDTH - 250}" y="822" text-anchor="middle" font-size="22" fill="${ink}" font-style="italic">${esc(d.tenantName || 'Signature')}</text>
    <line x1="${WIDTH - 360}" y1="840" x2="${WIDTH - 140}" y2="840" stroke="${gold}" stroke-width="1"/>
    <text x="${WIDTH - 250}" y="866" text-anchor="middle" font-size="16" letter-spacing="3" fill="#9a8c66">ISSUED BY</text>
    <text x="${WIDTH / 2}" y="930" text-anchor="middle" font-size="15" letter-spacing="1" fill="#a99a72">No. ${esc(d.certificateNumber)}${d.verifyUrl ? '  ·  ' + esc(d.verifyUrl) : ''}</text>
  </svg>`
}

/* ── Minimal — clean & monochrome with an accent line ──────────────────── */
function minimal(d) {
  const accent = d.accent || '#111827'
  const ink = '#111827'
  const name = esc(d.studentName)
  const course = esc(d.courseName)
  const nameSize = fitSize(d.studentName, 70, 24, 32)
  const courseSize = fitSize(d.courseName, 34, 44, 22)
  return `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" font-family="Helvetica, Arial, sans-serif">
    <rect width="${WIDTH}" height="${HEIGHT}" fill="#ffffff"/>
    <rect x="34" y="34" width="${WIDTH - 68}" height="${HEIGHT - 68}" fill="none" stroke="#e5e7eb" stroke-width="2"/>
    <rect x="34" y="34" width="${WIDTH - 68}" height="10" fill="${accent}"/>
    ${logoBlock(d.logoHref, WIDTH / 2 - 34, 96, 68)}
    <text x="${WIDTH / 2}" y="${d.logoHref ? 205 : 165}" text-anchor="middle" font-size="24" letter-spacing="6" fill="#6b7280">${esc((d.tenantName || '').toUpperCase())}</text>
    <text x="${WIDTH / 2}" y="300" text-anchor="middle" font-size="30" letter-spacing="16" fill="${ink}" font-weight="bold">CERTIFICATE OF COMPLETION</text>
    <line x1="${WIDTH / 2 - 60}" y1="336" x2="${WIDTH / 2 + 60}" y2="336" stroke="${accent}" stroke-width="3"/>
    <text x="${WIDTH / 2}" y="430" text-anchor="middle" font-size="20" letter-spacing="2" fill="#9ca3af">PRESENTED TO</text>
    <text x="${WIDTH / 2}" y="510" text-anchor="middle" font-size="${nameSize}" fill="${ink}" font-weight="bold">${name}</text>
    <text x="${WIDTH / 2}" y="585" text-anchor="middle" font-size="20" letter-spacing="2" fill="#9ca3af">FOR COMPLETING</text>
    <text x="${WIDTH / 2}" y="645" text-anchor="middle" font-size="${courseSize}" fill="${accent}" font-weight="bold">${course}</text>
    <g>
      <text x="250" y="810" text-anchor="middle" font-size="22" fill="${ink}" font-weight="bold">${esc(d.issuedDate)}</text>
      <line x1="150" y1="830" x2="350" y2="830" stroke="#d1d5db" stroke-width="1.5"/>
      <text x="250" y="856" text-anchor="middle" font-size="15" letter-spacing="2" fill="#9ca3af">DATE</text>
    </g>
    <g>
      <text x="${WIDTH - 250}" y="810" text-anchor="middle" font-size="20" fill="${ink}" font-weight="bold">${esc(d.certificateNumber)}</text>
      <line x1="${WIDTH - 350}" y1="830" x2="${WIDTH - 150}" y2="830" stroke="#d1d5db" stroke-width="1.5"/>
      <text x="${WIDTH - 250}" y="856" text-anchor="middle" font-size="15" letter-spacing="2" fill="#9ca3af">CERTIFICATE NO.</text>
    </g>
    ${sealMark(WIDTH / 2, 792, 34, accent, ink, '#ffffff')}
    ${d.verifyUrl ? `<text x="${WIDTH / 2}" y="915" text-anchor="middle" font-size="14" fill="#b0b6c0">Verify at ${esc(d.verifyUrl)}</text>` : ''}
  </svg>`
}

/** Lighten (positive) or darken (negative) a hex color by a percentage. */
export function shade(hex, percent) {
  try {
    const h = hex.replace('#', '')
    const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16)
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255
    const t = percent < 0 ? 0 : 255
    const p = Math.abs(percent) / 100
    r = Math.round((t - r) * p) + r
    g = Math.round((t - g) * p) + g
    b = Math.round((t - b) * p) + b
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
  } catch {
    return hex
  }
}

const BUILDERS = { classic, modern, elegant, minimal }

export const CERTIFICATE_TEMPLATES = [
  { key: 'classic', label: 'Classic' },
  { key: 'modern', label: 'Modern' },
  { key: 'elegant', label: 'Elegant' },
  { key: 'minimal', label: 'Minimal' },
]

export const CERTIFICATE_SIZE = { width: WIDTH, height: HEIGHT }

/**
 * Build the certificate SVG string.
 * @param {object} opts
 * @param {string} opts.template  one of classic|modern|elegant|minimal
 * @param {object} opts.data      { studentName, courseName, tenantName, issuedDate, certificateNumber, verifyUrl, accent }
 * @param {string} [opts.logoHref] data URL (or URL) for the tenant logo
 */
export function buildCertificateSVG({ template, data, logoHref }) {
  const build = BUILDERS[template] || classic
  return build({ ...data, logoHref }).trim()
}
