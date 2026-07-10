// Course descriptions (and other rich fields) are stored as HTML. When we
// need a short plain-text preview — e.g. a clamped card description — render
// through this helper so raw markup like "<h3>…</h3>" never leaks into the UI.
export const stripHtml = (html) => {
  if (!html) return ''
  if (typeof window === 'undefined') {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  }
  const el = document.createElement('div')
  el.innerHTML = html
  return (el.textContent || el.innerText || '').replace(/\s+/g, ' ').trim()
}
