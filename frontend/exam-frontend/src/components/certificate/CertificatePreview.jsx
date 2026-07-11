import { useMemo } from 'react'
import { buildCertificateSVG } from './CertificateTemplates'

/**
 * Inline, non-interactive preview of a certificate design.
 * Renders the same SVG used for the real download, with sample data so admins
 * can see what students will receive. Pass `data` to override the sample text.
 */
const CertificatePreview = ({ template = 'classic', data = {}, logoHref = null }) => {
  const svg = useMemo(
    () =>
      buildCertificateSVG({
        template,
        logoHref,
        data: {
          studentName: data.studentName || 'Student Name',
          courseName: data.courseName || 'Course Name',
          tenantName: data.tenantName || 'Your Institute',
          issuedDate: data.issuedDate || 'DD Month YYYY',
          certificateNumber: data.certificateNumber || 'DT-XXXX-XXXXXXXX',
          accent: data.accent,
        },
      }),
    [template, logoHref, data.studentName, data.courseName, data.tenantName, data.issuedDate, data.certificateNumber, data.accent],
  )

  return (
    <div
      className="w-full rounded-lg overflow-hidden ring-1 ring-black/10 shadow-sm bg-white [&>svg]:w-full [&>svg]:h-auto [&>svg]:block"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

export default CertificatePreview
