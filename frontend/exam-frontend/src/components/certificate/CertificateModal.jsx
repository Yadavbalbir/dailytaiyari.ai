import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, FileText, Loader2, Award } from 'lucide-react'
import toast from 'react-hot-toast'
import { buildCertificateSVG } from './CertificateTemplates'
import {
  loadImageAsDataUrl,
  downloadCertificatePng,
  downloadCertificatePdf,
} from './certificateDownload'

/**
 * Full-screen preview + download for an issued course certificate.
 * The design is fixed to the template the course admin selected.
 */
const CertificateModal = ({ open, onClose, certificate, accentColor }) => {
  const [logoHref, setLogoHref] = useState(null)
  const [logoReady, setLogoReady] = useState(false)
  const [busy, setBusy] = useState(null) // 'png' | 'pdf' | null

  useEffect(() => {
    if (!open || !certificate) return
    let alive = true
    setLogoReady(false)
    loadImageAsDataUrl(certificate.tenant_logo_url).then((href) => {
      if (!alive) return
      setLogoHref(href)
      setLogoReady(true)
    })
    return () => { alive = false }
  }, [open, certificate])

  const svg = useMemo(() => {
    if (!certificate) return ''
    return buildCertificateSVG({
      template: certificate.template || 'classic',
      logoHref,
      data: {
        studentName: certificate.student_name,
        courseName: certificate.course_name,
        tenantName: certificate.tenant_name,
        issuedDate: certificate.issued_date_display,
        certificateNumber: certificate.certificate_number,
        accent: accentColor,
      },
    })
  }, [certificate, logoHref, accentColor])

  const fileBase = useMemo(() => {
    const slug = (certificate?.course_name || 'certificate')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    return `${slug}-certificate`
  }, [certificate])

  const handleDownload = async (kind) => {
    if (!svg || !logoReady) return
    setBusy(kind)
    try {
      if (kind === 'pdf') await downloadCertificatePdf(svg, fileBase)
      else await downloadCertificatePng(svg, fileBase)
      toast.success(`Certificate downloaded as ${kind.toUpperCase()}`)
    } catch (err) {
      toast.error('Could not generate the certificate. Please try again.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <AnimatePresence>
      {open && certificate && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            className="card w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col"
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
          >
            <div className="flex items-center justify-between p-4 border-b border-surface-200 dark:border-surface-800">
              <h3 className="flex items-center gap-2 text-lg font-bold text-surface-900 dark:text-white">
                <Award size={20} className="text-amber-500" /> Your certificate
              </h3>
              <button onClick={onClose} className="btn-icon"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto bg-surface-100 dark:bg-surface-950">
              <div className="mx-auto max-w-3xl rounded-xl overflow-hidden shadow-2xl ring-1 ring-black/10">
                {logoReady ? (
                  <div
                    className="w-full [&>svg]:w-full [&>svg]:h-auto [&>svg]:block"
                    dangerouslySetInnerHTML={{ __html: svg }}
                  />
                ) : (
                  <div className="aspect-[1400/990] flex items-center justify-center bg-white">
                    <Loader2 className="w-8 h-8 animate-spin text-surface-300" />
                  </div>
                )}
              </div>
              <p className="text-center text-xs text-surface-400 mt-3">
                Certificate No. {certificate.certificate_number}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 p-4 border-t border-surface-200 dark:border-surface-800">
              <button
                onClick={() => handleDownload('png')}
                disabled={!logoReady || busy}
                className="btn-secondary w-full sm:w-auto disabled:opacity-60"
              >
                {busy === 'png' ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                PNG image
              </button>
              <button
                onClick={() => handleDownload('pdf')}
                disabled={!logoReady || busy}
                className="btn-primary w-full sm:w-auto disabled:opacity-60"
              >
                {busy === 'pdf' ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                Download PDF
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default CertificateModal
