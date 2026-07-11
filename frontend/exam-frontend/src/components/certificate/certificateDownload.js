/**
 * Client-side certificate export helpers.
 *
 * The certificate is an SVG string with the tenant logo already embedded as a
 * data URL, so rasterising it onto a canvas never taints the canvas — PNG and
 * PDF exports work fully offline in the browser.
 */
import { CERTIFICATE_SIZE } from './CertificateTemplates'

/** Fetch an image URL and return it as a data URL (or null if it can't load). */
export async function loadImageAsDataUrl(url) {
  if (!url) return null
  try {
    const res = await fetch(url, { mode: 'cors' })
    if (!res.ok) return null
    const blob = await res.blob()
    return await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

/** Rasterise an SVG string to a PNG data URL at the given pixel scale. */
export function svgToPngDataUrl(svgString, scale = 2) {
  return new Promise((resolve, reject) => {
    const { width, height } = CERTIFICATE_SIZE
    const svg64 = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString)
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = width * scale
      canvas.height = height * scale
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      try {
        resolve(canvas.toDataURL('image/png'))
      } catch (err) {
        reject(err)
      }
    }
    img.onerror = reject
    img.src = svg64
  })
}

function triggerDownload(dataUrl, filename) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
}

export async function downloadCertificatePng(svgString, filename) {
  const png = await svgToPngDataUrl(svgString, 2)
  triggerDownload(png, filename.endsWith('.png') ? filename : `${filename}.png`)
}

export async function downloadCertificatePdf(svgString, filename) {
  const { width, height } = CERTIFICATE_SIZE
  const png = await svgToPngDataUrl(svgString, 2)
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: [width, height] })
  pdf.addImage(png, 'PNG', 0, 0, width, height)
  pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`)
}
