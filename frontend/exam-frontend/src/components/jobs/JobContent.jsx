import { useMemo } from 'react'
import DOMPurify from 'dompurify'
import { marked } from 'marked'

/**
 * Renders job description / requirements content.
 *
 * Job content may be authored as raw HTML (rich paste) or Markdown. We detect
 * which it is, convert Markdown to HTML when needed, then sanitize before
 * rendering so tags are shown as formatted content — never as escaped text.
 */
const looksLikeHtml = (s) => /<\/?[a-z][\s\S]*>/i.test(s || '')

const JobContent = ({ content, className = '' }) => {
  const html = useMemo(() => {
    const raw = content || ''
    if (!raw.trim()) return ''
    const asHtml = looksLikeHtml(raw)
      ? raw
      : marked.parse(raw, { breaks: true, gfm: true })
    return DOMPurify.sanitize(asHtml, { ADD_ATTR: ['target', 'rel'] })
  }, [content])

  if (!html) return null

  return (
    <div
      className={`prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-headings:my-3 prose-li:my-1 prose-ul:my-2 prose-a:text-primary-600 dark:prose-a:text-primary-400 ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

export default JobContent
