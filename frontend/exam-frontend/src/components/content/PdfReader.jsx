import { useEffect, useMemo, useRef, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { Loader2, AlertCircle, ZoomIn, ZoomOut, ChevronUp, ChevronDown, Lock, Maximize2, Minimize2 } from 'lucide-react'
import api from '../../services/api'

// Bundle the pdf.js worker with Vite (no external CDN dependency).
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

/**
 * In-app PDF reader for reading material.
 *
 * The PDF bytes are streamed from an authenticated backend endpoint (the raw
 * blob URL is never exposed) and rendered page-by-page with pdf.js — there is
 * no browser download/print toolbar and the context menu is disabled, so the
 * document can be read but not casually downloaded.
 */
const PdfReader = ({ contentId, url }) => {
  const containerRef = useRef(null)
  const pageRefs = useRef([])
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [numPages, setNumPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [scale, setScale] = useState(1)
  const [width, setWidth] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)

  const src = url || `/content/${contentId}/pdf/`

  // Fetch the PDF through the authenticated API (handles auth + token refresh).
  useEffect(() => {
    let cancelled = false
    setData(null)
    setError(null)
    api
      .get(src, { responseType: 'arraybuffer' })
      .then((res) => {
        if (!cancelled) setData(new Uint8Array(res.data))
      })
      .catch(() => {
        if (!cancelled) setError('Unable to load this PDF. Please try again.')
      })
    return () => {
      cancelled = true
    }
  }, [src])

  // Track container width so pages render responsively.
  useEffect(() => {
    if (!containerRef.current) return
    const el = containerRef.current
    const update = () => setWidth(el.clientWidth)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [data])

  // Update the current-page indicator as the user scrolls.
  useEffect(() => {
    const root = containerRef.current
    if (!root || !numPages) return
    const onScroll = () => {
      const mid = root.scrollTop + root.clientHeight / 2
      let cur = 1
      for (let i = 0; i < pageRefs.current.length; i++) {
        const node = pageRefs.current[i]
        if (node && node.offsetTop <= mid) cur = i + 1
      }
      setCurrentPage(cur)
    }
    root.addEventListener('scroll', onScroll, { passive: true })
    return () => root.removeEventListener('scroll', onScroll)
  }, [numPages])

  const file = useMemo(() => (data ? { data } : null), [data])
  const pageWidth = width ? Math.max(280, Math.floor(width * scale) - 24) : undefined

  // Exit fullscreen on Escape and lock body scroll while expanded.
  useEffect(() => {
    if (!fullscreen) return
    const onKey = (e) => {
      if (e.key === 'Escape') setFullscreen(false)
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [fullscreen])

  const goToPage = (n) => {
    const node = pageRefs.current[n - 1]
    if (node && containerRef.current) {
      containerRef.current.scrollTo({ top: node.offsetTop - 8, behavior: 'smooth' })
    }
  }

  if (error) {
    return (
      <div className="card p-8 flex flex-col items-center justify-center text-center gap-2 text-surface-500">
        <AlertCircle className="w-8 h-8 text-rose-500" />
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className={fullscreen ? 'fixed inset-0 z-[70] flex flex-col bg-white dark:bg-surface-900' : 'card overflow-hidden mb-6'}>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-900/50">
        <div className="flex items-center gap-1.5 text-xs font-medium text-surface-500">
          <Lock size={13} /> View only
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => goToPage(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className="btn-icon disabled:opacity-40"
            title="Previous page"
          >
            <ChevronUp size={16} />
          </button>
          <span className="text-xs font-medium text-surface-600 dark:text-surface-300 tabular-nums px-1">
            {numPages ? `${currentPage} / ${numPages}` : '—'}
          </span>
          <button
            onClick={() => goToPage(Math.min(numPages, currentPage + 1))}
            disabled={currentPage >= numPages}
            className="btn-icon disabled:opacity-40"
            title="Next page"
          >
            <ChevronDown size={16} />
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setScale((s) => Math.max(0.5, +(s - 0.15).toFixed(2)))}
            className="btn-icon"
            title="Zoom out"
          >
            <ZoomOut size={16} />
          </button>
          <span className="text-xs font-medium text-surface-500 tabular-nums w-10 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale((s) => Math.min(2.5, +(s + 0.15).toFixed(2)))}
            className="btn-icon"
            title="Zoom in"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={() => setFullscreen((f) => !f)}
            className="btn-icon ml-1"
            title={fullscreen ? 'Exit full screen (Esc)' : 'Full screen'}
          >
            {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* Document */}
      <div
        ref={containerRef}
        onContextMenu={(e) => e.preventDefault()}
        className={`overflow-y-auto bg-surface-100 dark:bg-surface-950 px-3 py-4 flex flex-col items-center select-none ${fullscreen ? 'flex-1' : 'max-h-[75vh]'}`}
      >
        {!file ? (
          <div className="flex flex-col items-center gap-2 py-16 text-surface-400">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-sm">Loading PDF…</span>
          </div>
        ) : (
          <Document
            file={file}
            onLoadSuccess={({ numPages: n }) => setNumPages(n)}
            onLoadError={() => setError('Unable to render this PDF.')}
            loading={
              <div className="flex flex-col items-center gap-2 py-16 text-surface-400">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="text-sm">Loading PDF…</span>
              </div>
            }
          >
            {Array.from({ length: numPages }, (_, i) => (
              <div
                key={i}
                ref={(el) => (pageRefs.current[i] = el)}
                className="mb-4 shadow-lg rounded overflow-hidden bg-white"
              >
                <Page
                  pageNumber={i + 1}
                  width={pageWidth}
                  renderTextLayer
                  renderAnnotationLayer={false}
                />
              </div>
            ))}
          </Document>
        )}
      </div>
    </div>
  )
}

export default PdfReader
