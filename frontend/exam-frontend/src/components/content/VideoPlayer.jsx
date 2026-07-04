import { useMemo } from 'react'
import { AlertCircle } from 'lucide-react'

/**
 * Resolve a pasted video URL into an embeddable form.
 * Supports YouTube (watch / youtu.be / shorts / embed), Vimeo and Google Drive.
 * Returns { kind: 'iframe' | 'file' | 'none', src }.
 */
export const resolveVideo = (url = '', fileUrl = '') => {
  if (fileUrl) return { kind: 'file', src: fileUrl }
  const u = (url || '').trim()
  if (!u) return { kind: 'none', src: '' }

  // YouTube
  const yt =
    u.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/) ||
    u.match(/[?&]v=([\w-]{11})/)
  if (yt) {
    return { kind: 'iframe', src: `https://www.youtube.com/embed/${yt[1]}` }
  }

  // Vimeo
  const vimeo = u.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (vimeo) {
    return { kind: 'iframe', src: `https://player.vimeo.com/video/${vimeo[1]}` }
  }

  // Google Drive
  const gdrive = u.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([\w-]+)/)
  if (gdrive) {
    return { kind: 'iframe', src: `https://drive.google.com/file/d/${gdrive[1]}/preview` }
  }

  // Fallback: if it already looks like an embeddable/iframe URL, use as-is.
  if (/^https?:\/\//.test(u)) return { kind: 'iframe', src: u }
  return { kind: 'none', src: '' }
}

/**
 * Unified video player for reading material videos.
 * - External providers (YouTube/Vimeo/Drive) render in a responsive iframe.
 * - Videos uploaded to our blob render in a native <video> player with the
 *   download control hidden.
 */
const VideoPlayer = ({ url, fileUrl, title }) => {
  const { kind, src } = useMemo(() => resolveVideo(url, fileUrl), [url, fileUrl])

  if (kind === 'none') {
    return (
      <div className="card p-8 flex flex-col items-center justify-center text-center gap-2 text-surface-500">
        <AlertCircle className="w-8 h-8 text-amber-500" />
        <p>This video link could not be recognised.</p>
      </div>
    )
  }

  return (
    <div className="card overflow-hidden mb-6">
      <div className="aspect-video bg-black">
        {kind === 'file' ? (
          <video
            src={src}
            title={title}
            controls
            controlsList="nodownload"
            onContextMenu={(e) => e.preventDefault()}
            className="w-full h-full"
          />
        ) : (
          <iframe
            src={src}
            title={title}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}
      </div>
    </div>
  )
}

export default VideoPlayer
