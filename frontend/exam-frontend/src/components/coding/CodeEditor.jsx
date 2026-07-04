import { useRef } from 'react'
import Editor, { loader } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'

// Self-host Monaco: bundle the editor worker via Vite instead of pulling assets
// from a CDN at runtime. Basic syntax highlighting for python/cpp/java is
// Monarch-based (main thread), so it works without language-specific workers.
if (!window.__monacoConfigured) {
  self.MonacoEnvironment = { getWorker: () => new editorWorker() }
  loader.config({ monaco })
  window.__monacoConfigured = true
}

/**
 * Thin Monaco wrapper used on the coding solve page.
 * `language` is a Monaco mode string (python | cpp | java).
 */
const CodeEditor = ({ value, onChange, language = 'python', readOnly = false, height = 420 }) => {
  const editorRef = useRef(null)

  return (
    <div className="rounded-xl overflow-hidden border border-surface-200 dark:border-surface-700">
      <Editor
        height={height}
        language={language}
        theme="vs-dark"
        value={value}
        onChange={(v) => onChange?.(v ?? '')}
        onMount={(editor) => { editorRef.current = editor }}
        options={{
          readOnly,
          fontSize: 14,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 4,
          lineNumbers: 'on',
          renderWhitespace: 'selection',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, monospace',
          padding: { top: 12, bottom: 12 },
        }}
        loading={<div className="h-full flex items-center justify-center text-sm text-surface-400">Loading editor…</div>}
      />
    </div>
  )
}

export default CodeEditor
