import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import remarkGfm from 'remark-gfm'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { contentService } from '../services/contentService'
import Loading from '../components/common/Loading'
import toast from 'react-hot-toast'
import {
  Bookmark, BookmarkCheck, Timer, Eye, PenTool, FileText, Bot,
  CheckCircle2, ChevronLeft, PlayCircle, Clock
} from 'lucide-react'

const ContentViewer = () => {
  const { contentId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const startTime = useRef(Date.now())
  const [isCompleted, setIsCompleted] = useState(false)

  const { data: content, isLoading } = useQuery({
    queryKey: ['content', contentId],
    queryFn: () => contentService.getContentDetails(contentId),
  })

  const { data: progressData } = useQuery({
    queryKey: ['contentProgress', contentId],
    queryFn: async () => {
      try {
        const all = await contentService.getProgress({ content: contentId })
        const results = all?.results || all
        return Array.isArray(results) ? results[0] || null : null
      } catch {
        return null
      }
    },
    enabled: !!contentId,
  })

  useEffect(() => {
    if (progressData?.is_completed) {
      setIsCompleted(true)
    }
  }, [progressData])

  const ensureProgressMutation = useMutation({
    mutationFn: async () => {
      if (progressData?.id) return progressData
      const res = await contentService.updateProgress(contentId, {
        progress_percentage: 0,
      })
      return res
    },
  })

  const markCompleteMutation = useMutation({
    mutationFn: async () => {
      let progress = progressData
      if (!progress?.id) {
        progress = await ensureProgressMutation.mutateAsync()
      }
      const timeSpent = Math.max(1, Math.round((Date.now() - startTime.current) / 60000))
      return contentService.markComplete(progress.id, { time_spent_minutes: timeSpent })
    },
    onSuccess: (data) => {
      setIsCompleted(true)
      const xpEarned = data?.xp_earned || 0
      toast.success(
        xpEarned > 0
          ? `Completed! +${xpEarned} XP earned`
          : 'Marked as complete!'
      )
      queryClient.invalidateQueries({ queryKey: ['content', contentId] })
      queryClient.invalidateQueries({ queryKey: ['contentProgress'] })
      queryClient.invalidateQueries({ queryKey: ['studyChapterDetail'] })
      queryClient.invalidateQueries({ queryKey: ['studyChapters'] })
      queryClient.invalidateQueries({ queryKey: ['studySubjects'] })
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] })
    },
    onError: () => {
      toast.error('Failed to mark complete. Please try again.')
    },
  })

  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      let progress = progressData
      if (!progress?.id) {
        progress = await ensureProgressMutation.mutateAsync()
      }
      return contentService.toggleBookmark(progress.id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contentProgress', contentId] })
    },
  })

  if (isLoading) return <Loading fullScreen />

  const isBookmarked = progressData?.is_bookmarked || false

  return (
    <div className="max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-surface-500 hover:text-primary-600 flex items-center gap-1"
        >
          <ChevronLeft size={16} /> Back
        </button>
        <span className="text-surface-400">/</span>
        <span className="font-medium truncate">{content?.title}</span>
      </div>

      {/* Content Header */}
      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className={`badge ${
                content?.content_type === 'video' ? 'bg-red-100 text-red-700' :
                content?.content_type === 'notes' ? 'bg-blue-100 text-blue-700' :
                content?.content_type === 'pdf' ? 'bg-green-100 text-green-700' :
                'bg-surface-100 text-surface-700'
              }`}>
                {content?.content_type === 'video' ? <PlayCircle size={12} className="mr-1" /> : <FileText size={12} className="mr-1" />}
                {content?.content_type?.toUpperCase()}
              </span>
              {isCompleted && (
                <span className="badge bg-success-100 text-success-700">
                  <CheckCircle2 size={12} className="mr-1" />
                  {content?.content_type === 'video' ? 'Watched' : 'Read'}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-display font-bold">{content?.title}</h1>
            {content?.description && (
              <p className="text-surface-500 mt-2">{content.description}</p>
            )}
          </div>
          <button
            onClick={() => bookmarkMutation.mutate()}
            className="btn-icon flex-shrink-0"
            title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
          >
            {isBookmarked ? (
              <BookmarkCheck size={20} className="text-warning-500 fill-warning-500" />
            ) : (
              <Bookmark size={20} />
            )}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-surface-500">
          <span className="flex items-center gap-1.5">
            <Clock size={16} /> {content?.estimated_time_minutes} min
          </span>
          <span className="flex items-center gap-1.5">
            <Eye size={16} /> {content?.views_count} views
          </span>
          {content?.author_name && (
            <span className="flex items-center gap-1.5">
              <PenTool size={16} /> {content.author_name}
            </span>
          )}
          {content?.topic_name && (
            <span className="flex items-center gap-1.5">
              Topic: {content.topic_name}
            </span>
          )}
        </div>
      </div>

      {/* Video Player */}
      {content?.content_type === 'video' && content?.video_url && (
        <div className="card overflow-hidden mb-6">
          <div className="aspect-video bg-black">
            <iframe
              src={content.video_url.replace('watch?v=', 'embed/')}
              title={content.title}
              className="w-full h-full"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* Notes Content: render as HTML if content looks like HTML, else as Markdown (with LaTeX) */}
      {content?.content_html && (
        <div className="card p-6 mb-6">
          <div className="prose prose-lg dark:prose-invert max-w-none [&_.katex]:text-base [&_.katex-display]:my-4 [&_.katex-display]:overflow-x-auto">
            {content.content_html.trimStart().startsWith('<') ? (
              <div
                className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-display prose-p:leading-relaxed prose-ul:my-3 prose-table:my-4"
                dangerouslySetInnerHTML={{ __html: content.content_html }}
              />
            ) : (
              <ReactMarkdown
                remarkPlugins={[remarkMath, remarkGfm]}
                rehypePlugins={[rehypeKatex]}
              >
                {content.content_html}
              </ReactMarkdown>
            )}
          </div>
        </div>
      )}

      {/* PDF Viewer */}
      {content?.content_type === 'pdf' && content?.pdf_file && (
        <div className="card p-4 mb-6">
          <a
            href={content.pdf_file}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-flex items-center gap-2"
          >
            <FileText size={18} /> Open PDF
          </a>
        </div>
      )}

      {/* Actions Footer */}
      <div className="card p-4 sticky bottom-4 flex items-center justify-between bg-white/95 dark:bg-surface-900/95 backdrop-blur-sm">
        <button
          onClick={() => navigate(-1)}
          className="btn-secondary flex items-center gap-2"
        >
          <ChevronLeft size={18} /> Back
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/doubt-solver')}
            className="btn-secondary flex items-center gap-2"
          >
            <Bot size={18} /> Ask Doubt
          </button>
          {!isCompleted ? (
            <button
              onClick={() => markCompleteMutation.mutate()}
              disabled={markCompleteMutation.isPending}
              className="btn-primary flex items-center gap-2"
            >
              {markCompleteMutation.isPending ? 'Saving...' : (
                <>
                  <CheckCircle2 size={18} />
                  Mark as {content?.content_type === 'video' ? 'Watched' : 'Read'}
                </>
              )}
            </button>
          ) : (
            <span className="flex items-center gap-2 text-success-600 font-medium px-4 py-2">
              <CheckCircle2 size={18} />
              {content?.content_type === 'video' ? 'Watched' : 'Read'}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default ContentViewer
