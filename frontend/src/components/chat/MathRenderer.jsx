import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

/**
 * Preprocesses content to convert various LaTeX formats to standard $$ and $ notation
 * that remark-math can understand.
 */
const preprocessMath = (content) => {
  if (!content) return ''
  
  let processed = content

  // Convert \[ ... \] to $$ ... $$ (display math)
  processed = processed.replace(/\\\[([^\]]+)\\\]/g, (match, math) => {
    return `$$${math.trim()}$$`
  })

  // Convert [ ... ] containing LaTeX commands to $$ ... $$ (display math)
  // Look for brackets containing common LaTeX commands
  processed = processed.replace(/\[\s*([^[\]]*(?:\\(?:frac|sqrt|sum|int|prod|lim|sin|cos|tan|log|ln|exp|pm|mp|times|div|cdot|neq|leq|geq|approx|equiv|infty|partial|nabla|alpha|beta|gamma|delta|epsilon|theta|lambda|mu|pi|sigma|omega|Delta|Sigma|Omega|rightarrow|leftarrow|Rightarrow|Leftarrow)[^[\]]*)+)\s*\]/g, (match, math) => {
    // Check if it looks like a math expression
    if (/\\[a-zA-Z]+/.test(math)) {
      return `$$${math.trim()}$$`
    }
    return match
  })

  // Convert \( ... \) to $ ... $ (inline math)
  processed = processed.replace(/\\\(([^)]+)\\\)/g, (match, math) => {
    return `$${math.trim()}$`
  })

  // Convert ( ... ) containing LaTeX to $ ... $ (inline math) - be more conservative
  processed = processed.replace(/\(\s*([^()]*(?:\\(?:frac|sqrt|pm|mp|times|div|cdot|neq|leq|geq|approx)[^()]*)+)\s*\)/g, (match, math) => {
    // Only convert if it clearly contains LaTeX commands (not just regular parentheses)
    if (/\\[a-zA-Z]+\{/.test(math)) {
      return `$${math.trim()}$`
    }
    return match
  })

  // Handle standalone LaTeX expressions on their own line
  // If a line starts with a LaTeX command and isn't wrapped, wrap it
  const lines = processed.split('\n')
  const processedLines = lines.map(line => {
    const trimmed = line.trim()
    // If line contains unwrapped LaTeX and isn't already wrapped
    if (
      !trimmed.startsWith('$') && 
      !trimmed.startsWith('$$') &&
      /^[a-zA-Z_]*\s*=\s*\\/.test(trimmed) // Like "x = \frac{...}"
    ) {
      return `$$${trimmed}$$`
    }
    return line
  })

  return processedLines.join('\n')
}

const MathRenderer = ({ content, className = '' }) => {
  const processedContent = preprocessMath(content)

  return (
    <div className={`prose prose-sm dark:prose-invert max-w-none 
      prose-p:my-2 prose-headings:my-3 prose-li:my-1 
      prose-pre:bg-surface-200 dark:prose-pre:bg-surface-900 
      prose-code:text-violet-600 dark:prose-code:text-violet-400
      [&_.katex]:text-base [&_.katex-display]:my-4 [&_.katex-display]:overflow-x-auto
      ${className}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { strict: false, throwOnError: false }]]}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  )
}

export default MathRenderer

