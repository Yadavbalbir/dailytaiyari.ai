import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { contentService } from '../services/contentService'
import Loading from '../components/common/Loading'
import {
  Bookmark, BookmarkX, BookOpen, PlayCircle, FileText, RefreshCw,
  Sparkles, Clock, ChevronRight, CheckCircle2
} from 'lucide-react'

// Icon + colour styling per content type, mirroring the study screens.
const TYPE_CONFIG = {
  video: { icon: PlayCircle, label: 'Video', color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
  notes: { icon: BookOpen, label: 'Notes', color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
  pdf: { icon: FileText, label: 'PDF', color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' },
  revision: { icon: RefreshCw, label: 'Revision', color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
  formula: { icon: Sparkles, label: 'Formula', color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
  interactive: { icon: Sparkles, label: 'Interactive', color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' },
}

const typeConfig = (type) => TYPE_CONFIG[type] || { icon: FileText, label: type || 'Content', color: 'bg-surface-100 text-surface-600 dark:bg-surface-700 dark:text-surface-300' }

const Revision = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: contentService.getBookmarks,
  })

  const removeMutation = useMutation({
    mutationFn: (progressId) => contentService.toggleBookmark(progressId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
      queryClient.invalidateQueries({ queryKey: ['contentProgress'] })
      toast.success('Removed from Revision')
    },
    onError: () => toast.error('Could not remove bookmark. Please try again.'),
  })

  if (isLoading) return <Loading fullScreen />

  const results = data?.results || data || []
  const bookmarks = Array.isArray(results) ? results.filter((p) => p.is_bookmarked) : []

  // Group bookmarks by subject for an organised revision list.
  const groups = bookmarks.reduce((acc, item) => {
    const subject = item.content_data?.subject_name || 'Other'
    if (!acc[subject]) acc[subject] = []
    acc[subject].push(item)
    return acc
  }, {})

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-warning-400 to-amber-500 flex items-center justify-center">
            <Bookmark size={22} className="text-white fill-white" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold">Revision</h1>
            <p className="text-surface-500 text-sm">
              {bookmarks.length > 0
                ? `${bookmarks.length} item${bookmarks.length === 1 ? '' : 's'} saved for revision`
                : 'Bookmark study material to build your revision list'}
            </p>
          </div>
        </div>
      </div>

      {bookmarks.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-4">
            <Bookmark size={28} className="text-surface-400" />
          </div>
          <h3 className="font-display font-semibold text-lg">Nothing saved yet</h3>
          <p className="text-surface-500 text-sm mt-1 max-w-md mx-auto">
            Tap the bookmark icon on any notes, video or PDF while studying to save it here for quick revision.
          </p>
          <button onClick={() => navigate('/study')} className="btn-primary mt-5 inline-flex items-center gap-2">
            <BookOpen size={18} /> Go to Study
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groups).map(([subject, items]) => (
            <div key={subject}>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-surface-400 mb-3 px-1">
                {subject}
              </h2>
              <div className="card divide-y divide-surface-100 dark:divide-surface-800 overflow-hidden">
                {items.map((item, idx) => {
                  const cfg = typeConfig(item.content_type)
                  const Icon = cfg.icon
                  const c = item.content_data || {}
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.02 }}
                      className="flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-3.5 group hover:bg-surface-50 dark:hover:bg-surface-800/60 transition-colors"
                    >
                      <button
                        onClick={() => navigate(`/content/${item.content}`)}
                        className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 text-left"
                      >
                        <span className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${cfg.color}`}>
                          <Icon size={20} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm truncate">{item.content_title}</h4>
                            {item.is_completed && (
                              <CheckCircle2 size={13} className="shrink-0 text-success-500" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-surface-400">
                            <span className="font-medium text-surface-500">{cfg.label}</span>
                            {c.topic_name && (
                              <>
                                <span className="text-surface-300">•</span>
                                <span className="truncate">{c.topic_name}</span>
                              </>
                            )}
                            {c.estimated_time_minutes ? (
                              <>
                                <span className="text-surface-300">•</span>
                                <span className="flex items-center gap-1 shrink-0"><Clock size={10} /> {c.estimated_time_minutes}m</span>
                              </>
                            ) : null}
                          </div>
                        </div>
                        <ChevronRight size={18} className="shrink-0 text-surface-300 group-hover:text-primary-500 transition-colors" />
                      </button>
                      <button
                        onClick={() => removeMutation.mutate(item.id)}
                        disabled={removeMutation.isPending}
                        title="Remove from Revision"
                        className="shrink-0 p-2 rounded-lg text-surface-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <BookmarkX size={18} />
                      </button>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Revision
