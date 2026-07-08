import { useState } from 'react'
import { Eye, Pencil } from 'lucide-react'
import { NotesTextarea } from '../admin/builderShared'
import MathRenderer from '../chat/MathRenderer'

/**
 * Rich content editor for mock-test authoring.
 *
 * Wraps the shared {@link NotesTextarea} (Markdown + inline image paste / drop /
 * upload to blob storage) with a Write / Preview toggle so admins see exactly
 * what students will see. Content is stored as Markdown and rendered everywhere
 * through {@link MathRenderer} (Markdown + GFM + KaTeX math + inline images).
 */
export default function RichMarkdownEditor({ value, onChange, rows = 4 }) {
  const [tab, setTab] = useState('write')
  const has = !!(value && value.trim())

  const TabBtn = ({ id, icon: Icon, children }) => (
    <button
      type="button"
      onClick={() => setTab(id)}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
        tab === id
          ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'
          : 'text-surface-500 hover:text-surface-800 dark:hover:text-surface-200'
      }`}
    >
      <Icon className="w-3.5 h-3.5" /> {children}
    </button>
  )

  return (
    <div className="rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
      <div className="flex items-center gap-1 px-2 pt-2 pb-1 border-b border-surface-100 dark:border-surface-800">
        <TabBtn id="write" icon={Pencil}>Write</TabBtn>
        <TabBtn id="preview" icon={Eye}>Preview</TabBtn>
        <span className="ml-auto text-[11px] text-surface-400 pr-1 hidden sm:inline">
          Markdown · math with $…$ · paste images inline
        </span>
      </div>
      <div className="p-2">
        {tab === 'write' ? (
          <NotesTextarea value={value ?? ''} onChange={onChange} rows={rows} />
        ) : (
          <div className="min-h-[80px] px-1 py-1">
            {has ? (
              <MathRenderer content={value} />
            ) : (
              <p className="text-sm italic text-surface-400">Nothing to preview yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
