import { useState } from 'react'
import { Download, Loader2, FileArchive } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'

/**
 * Download card for assignment files that can't be rendered inline (e.g. ZIP
 * archives). The file is fetched through the authenticated API so the raw blob
 * URL is never exposed, then saved with its original filename.
 */
const FileDownloadCard = ({ url, name = 'file', label = 'Attached file' }) => {
  const [busy, setBusy] = useState(false)

  const download = async () => {
    setBusy(true)
    try {
      const res = await api.get(url, { responseType: 'blob' })
      const blobUrl = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = name
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(blobUrl)
    } catch {
      toast.error('Could not download this file. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
        <FileArchive className="w-5 h-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{name}</p>
        <p className="text-xs text-surface-400">{label}</p>
      </div>
      <button
        type="button"
        onClick={download}
        disabled={busy}
        className="btn-secondary text-xs px-3 py-1.5 inline-flex items-center gap-1.5 shrink-0"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        Download
      </button>
    </div>
  )
}

export default FileDownloadCard
