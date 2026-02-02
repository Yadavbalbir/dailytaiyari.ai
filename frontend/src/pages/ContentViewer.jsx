import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import ReactMarkdown from 'react-markdown'
import { contentService } from '../services/contentService'
import Loading from '../components/common/Loading'
import toast from 'react-hot-toast'

const ContentViewer = () => {
  const { contentId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: content, isLoading } = useQuery({
    queryKey: ['content', contentId],
    queryFn: () => contentService.getContentDetails(contentId),
  })

  const markCompleteMutation = useMutation({
    mutationFn: () => contentService.markComplete(contentId),
    onSuccess: (data) => {
      const xpEarned = data?.xp_earned || 0
      if (xpEarned > 0) {
        toast.success(`Content marked as complete! +${xpEarned} XP`)
      } else {
        toast.success('Content marked as complete!')
      }
      queryClient.invalidateQueries(['content', contentId])
      queryClient.invalidateQueries(['dashboardStats'])
    },
  })

  if (isLoading) return <Loading fullScreen />

  return (
    <div className="max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm mb-6">
        <button onClick={() => navigate('/study')} className="text-surface-500 hover:text-primary-600">
          Study
        </button>
        <span className="text-surface-400">/</span>
        <button onClick={() => navigate(`/topic/${content?.topic}`)} className="text-surface-500 hover:text-primary-600">
          {content?.topic_name}
        </button>
        <span className="text-surface-400">/</span>
        <span className="font-medium truncate">{content?.title}</span>
      </div>

      {/* Content Header */}
      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className={`badge mb-3 ${
              content?.content_type === 'video' ? 'bg-red-100 text-red-700' :
              content?.content_type === 'notes' ? 'bg-blue-100 text-blue-700' :
              'bg-surface-100 text-surface-700'
            }`}>
              {content?.content_type?.toUpperCase()}
            </span>
            <h1 className="text-2xl font-display font-bold">{content?.title}</h1>
            <p className="text-surface-500 mt-2">{content?.description}</p>
          </div>
          <button className="btn-icon text-xl">🔖</button>
        </div>
        
        <div className="flex items-center gap-4 mt-4 text-sm text-surface-500">
          <span>⏱️ {content?.estimated_time_minutes} min read</span>
          <span>👁️ {content?.views_count} views</span>
          {content?.author_name && <span>✍️ {content.author_name}</span>}
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

      {/* Notes Content */}
      {content?.content_html && (
        <div className="card p-6 mb-6">
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <ReactMarkdown>{content.content_html}</ReactMarkdown>
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
            className="btn-primary"
          >
            📄 Open PDF
          </a>
        </div>
      )}

      {/* Actions Footer */}
      <div className="card p-4 sticky bottom-4 flex items-center justify-between bg-white/95 dark:bg-surface-900/95 backdrop-blur-sm">
        <button
          onClick={() => navigate(-1)}
          className="btn-secondary"
        >
          ← Back
        </button>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/doubt-solver')}
            className="btn-secondary"
          >
            🤖 Ask Doubt
          </button>
          <button
            onClick={() => markCompleteMutation.mutate()}
            disabled={markCompleteMutation.isPending}
            className="btn-primary"
          >
            {markCompleteMutation.isPending ? 'Saving...' : '✓ Mark Complete'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ContentViewer

