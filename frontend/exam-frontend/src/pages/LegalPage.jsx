import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { landingService } from '../services/landingService'

// Maps the route slug to the backend doc_type.
const SLUG_TO_TYPE = {
  'refund-policy': 'refund',
  'privacy-policy': 'privacy',
  terms: 'terms',
}

// Public legal page (refund / privacy / terms). Content is tenant-editable with
// generic platform defaults, so the page is always populated.
const LegalPage = ({ slug: slugProp }) => {
  const params = useParams()
  const navigate = useNavigate()
  const slug = slugProp || params.slug
  const docType = SLUG_TO_TYPE[slug]

  const { data, isLoading, isError } = useQuery({
    queryKey: ['legal', docType],
    queryFn: () => landingService.getLegal(docType),
    enabled: !!docType,
    staleTime: 5 * 60 * 1000,
  })

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [slug])

  if (!docType) {
    return (
      <div className="min-h-screen grid place-items-center bg-white">
        <p className="text-surface-500">Page not found.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white text-surface-900">
      <header className="border-b border-surface-100 bg-white/90 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-surface-600 hover:text-primary-600"
          >
            <ArrowLeft size={18} /> Back to Home
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-8 w-2/3 rounded bg-surface-200" />
            <div className="h-4 w-full rounded bg-surface-200" />
            <div className="h-4 w-5/6 rounded bg-surface-200" />
            <div className="h-4 w-4/6 rounded bg-surface-200" />
          </div>
        ) : isError ? (
          <p className="text-surface-500">Unable to load this page right now.</p>
        ) : (
          <>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-surface-900">{data.title}</h1>
            {data.updated_at ? (
              <p className="mt-2 text-sm text-surface-400">
                Last updated {new Date(data.updated_at).toLocaleDateString()}
              </p>
            ) : null}
            <div
              className="legal-content mt-8 max-w-none text-surface-700 leading-relaxed [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-surface-900 [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-surface-900 [&_h3]:mt-6 [&_h3]:mb-2 [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:space-y-1.5 [&_a]:text-primary-600 [&_a]:underline"
              dangerouslySetInnerHTML={{ __html: data.content || '' }}
            />
          </>
        )}
      </main>

      <footer className="border-t border-surface-100 py-8 text-center text-sm text-surface-400">
        <button onClick={() => navigate('/')} className="hover:text-primary-600">Return to homepage</button>
      </footer>
    </div>
  )
}

export default LegalPage
