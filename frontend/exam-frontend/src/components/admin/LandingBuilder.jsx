import { useEffect, useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  Plus, Trash2, ChevronUp, ChevronDown, ChevronRight, Eye, EyeOff,
  GripVertical, Save, ExternalLink, X, Layout, FileText, Loader2,
  Upload, Image as ImageIcon,
} from 'lucide-react'
import { landingAdminService } from '../../services/landingAdminService'
import {
  SECTION_SCHEMAS, SECTION_ORDER, LANDING_TEMPLATES, getSectionMeta,
} from '../../config/landingSections'
import { Icon } from '../landing/shared'

const inputCls =
  'w-full rounded-lg border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800 ' +
  'px-3 py-2 text-sm text-surface-900 dark:text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500/40'
const labelCls = 'block text-xs font-semibold text-surface-500 dark:text-surface-400 mb-1'

const sid = () => Math.random().toString(36).slice(2, 14)

// Image field: upload a file (stored on the server) or paste a URL. Shows a
// live thumbnail preview and a clear button.
const ImageField = ({ value = '', onChange }) => {
  const [uploading, setUploading] = useState(false)
  const inputId = useMemo(() => `img-${Math.random().toString(36).slice(2, 9)}`, [])

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image is too large (max 5 MB).')
      return
    }
    setUploading(true)
    try {
      const url = await landingAdminService.uploadImage(file)
      onChange(url)
      toast.success('Image uploaded')
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex items-start gap-3">
      <div className="shrink-0">
        {value ? (
          <div className="relative group">
            <img
              src={value}
              alt="preview"
              className="h-16 w-16 rounded-lg object-cover border border-surface-200 dark:border-surface-700 bg-surface-50"
            />
            <button
              type="button"
              onClick={() => onChange('')}
              title="Remove image"
              className="absolute -top-1.5 -right-1.5 grid place-items-center h-5 w-5 rounded-full bg-red-600 text-white shadow"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <div className="h-16 w-16 grid place-items-center rounded-lg border border-dashed border-surface-300 dark:border-surface-600 text-surface-400">
            <ImageIcon size={20} />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        <label
          htmlFor={inputId}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
            uploading
              ? 'bg-surface-200 text-surface-500 dark:bg-surface-700'
              : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
        >
          {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
          {uploading ? 'Uploading…' : value ? 'Replace' : 'Upload image'}
        </label>
        <input
          id={inputId}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
          disabled={uploading}
        />
        <input
          className={inputCls}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="…or paste an image URL"
        />
      </div>
    </div>
  )
}

// ── Field editors ───────────────────────────────────────────────────────────
const TagEditor = ({ value = [], onChange }) => {
  const [draft, setDraft] = useState('')
  const list = Array.isArray(value) ? value : []
  const add = () => {
    const v = draft.trim()
    if (!v) return
    onChange([...list, v])
    setDraft('')
  }
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {list.map((tag, i) => (
          <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-medium">
            {tag}
            <button onClick={() => onChange(list.filter((_, j) => j !== i))} type="button">
              <X size={13} />
            </button>
          </span>
        ))}
        {list.length === 0 && <span className="text-xs text-surface-400">No items yet.</span>}
      </div>
      <div className="flex gap-2">
        <input
          className={inputCls}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder="Type and press Enter"
        />
        <button type="button" onClick={add} className="px-3 rounded-lg bg-primary-600 text-white text-sm font-medium shrink-0">
          Add
        </button>
      </div>
    </div>
  )
}

const Field = ({ field, value, onChange }) => {
  const v = value ?? ''
  if (field.type === 'textarea' || field.type === 'richtext') {
    return <textarea className={`${inputCls} min-h-[90px]`} value={v} onChange={(e) => onChange(e.target.value)} />
  }
  if (field.type === 'number') {
    return <input type="number" className={inputCls} value={v} onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))} />
  }
  if (field.type === 'tags') {
    return <TagEditor value={value} onChange={onChange} />
  }
  if (field.type === 'image') {
    return <ImageField value={v} onChange={onChange} />
  }
  if (field.choices) {
    return (
      <select className={inputCls} value={v} onChange={(e) => onChange(e.target.value)}>
        <option value="">— select —</option>
        {field.choices.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
    )
  }
  return (
    <input
      className={inputCls}
      value={v}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.type === 'link' ? '/path or https://…' : field.type === 'image' ? 'https://image-url' : ''}
    />
  )
}

// A repeatable list of objects (e.g. feature cards, testimonials).
const ListEditor = ({ field, value = [], onChange }) => {
  const list = Array.isArray(value) ? value : []
  const blank = () => Object.fromEntries(field.item.map((f) => [f.key, f.type === 'number' ? '' : '']))
  const update = (idx, key, val) => onChange(list.map((it, i) => (i === idx ? { ...it, [key]: val } : it)))
  const move = (idx, dir) => {
    const j = idx + dir
    if (j < 0 || j >= list.length) return
    const next = [...list]
    ;[next[idx], next[j]] = [next[j], next[idx]]
    onChange(next)
  }
  return (
    <div className="space-y-3">
      {list.map((item, idx) => (
        <div key={idx} className="rounded-lg border border-surface-200 dark:border-surface-700 p-3 bg-surface-50/60 dark:bg-surface-800/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-surface-400">#{idx + 1}</span>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => move(idx, -1)} className="p-1 text-surface-400 hover:text-primary-600"><ChevronUp size={15} /></button>
              <button type="button" onClick={() => move(idx, 1)} className="p-1 text-surface-400 hover:text-primary-600"><ChevronDown size={15} /></button>
              <button type="button" onClick={() => onChange(list.filter((_, i) => i !== idx))} className="p-1 text-surface-400 hover:text-red-600"><Trash2 size={15} /></button>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {field.item.map((sub) => (
              <div key={sub.key} className={sub.type === 'textarea' || sub.type === 'image' ? 'sm:col-span-2' : ''}>
                <label className={labelCls}>{sub.label}</label>
                <Field field={sub} value={item[sub.key]} onChange={(val) => update(idx, sub.key, val)} />
              </div>
            ))}
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...list, blank()])}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700"
      >
        <Plus size={16} /> Add item
      </button>
    </div>
  )
}

// ── Section card ─────────────────────────────────────────────────────────────
const SectionCard = ({ section, index, total, onChange, onMove, onRemove, onToggle }) => {
  const [open, setOpen] = useState(false)
  const meta = getSectionMeta(section.type)
  if (!meta) return null
  const data = section.data || {}
  const setField = (key, val) => onChange({ ...section, data: { ...data, [key]: val } })

  return (
    <div className={`rounded-xl border ${section.enabled === false ? 'border-dashed border-surface-300 dark:border-surface-700 opacity-70' : 'border-surface-200 dark:border-surface-700'} bg-white dark:bg-surface-900 overflow-hidden`}>
      <div className="flex items-center gap-3 p-3">
        <GripVertical size={16} className="text-surface-300 shrink-0" />
        <span className="grid place-items-center h-9 w-9 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-600 shrink-0">
          <Icon name={meta.icon} size={18} />
        </span>
        <button className="flex-1 text-left min-w-0" onClick={() => setOpen((v) => !v)}>
          <div className="font-semibold text-sm text-surface-900 dark:text-surface-100 truncate">{meta.label}</div>
          <div className="text-xs text-surface-400 truncate">{meta.description}</div>
        </button>
        <div className="flex items-center gap-1 shrink-0">
          <button type="button" title={section.enabled === false ? 'Show' : 'Hide'} onClick={() => onToggle()} className="p-1.5 text-surface-400 hover:text-primary-600">
            {section.enabled === false ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
          <button type="button" onClick={() => onMove(-1)} disabled={index === 0} className="p-1.5 text-surface-400 hover:text-primary-600 disabled:opacity-30"><ChevronUp size={16} /></button>
          <button type="button" onClick={() => onMove(1)} disabled={index === total - 1} className="p-1.5 text-surface-400 hover:text-primary-600 disabled:opacity-30"><ChevronDown size={16} /></button>
          <button type="button" onClick={() => onRemove()} className="p-1.5 text-surface-400 hover:text-red-600"><Trash2 size={16} /></button>
          <button type="button" onClick={() => setOpen((v) => !v)} className="p-1.5 text-surface-400"><ChevronRight size={16} className={`transition-transform ${open ? 'rotate-90' : ''}`} /></button>
        </div>
      </div>
      {open && (
        <div className="border-t border-surface-100 dark:border-surface-800 p-4 space-y-4 bg-surface-50/50 dark:bg-surface-800/30">
          {meta.fields.map((field) => (
            <div key={field.key}>
              <label className={labelCls}>{field.label}</label>
              {field.type === 'list' ? (
                <ListEditor field={field} value={data[field.key]} onChange={(val) => setField(field.key, val)} />
              ) : (
                <Field field={field} value={data[field.key]} onChange={(val) => setField(field.key, val)} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Footer editor ────────────────────────────────────────────────────────────
const FooterEditor = ({ footer = {}, onChange }) => {
  const set = (key, val) => onChange({ ...footer, [key]: val })
  const socials = footer.socials || []
  const columns = footer.columns || []
  return (
    <div className="space-y-4">
      <div>
        <label className={labelCls}>About text</label>
        <textarea className={`${inputCls} min-h-[80px]`} value={footer.about || ''} onChange={(e) => set('about', e.target.value)} />
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        <div><label className={labelCls}>Email</label><input className={inputCls} value={footer.email || ''} onChange={(e) => set('email', e.target.value)} /></div>
        <div><label className={labelCls}>Phone</label><input className={inputCls} value={footer.phone || ''} onChange={(e) => set('phone', e.target.value)} /></div>
        <div><label className={labelCls}>Copyright</label><input className={inputCls} value={footer.copyright || ''} onChange={(e) => set('copyright', e.target.value)} placeholder="© {year} Name" /></div>
      </div>
      <div><label className={labelCls}>Address</label><input className={inputCls} value={footer.address || ''} onChange={(e) => set('address', e.target.value)} /></div>

      <div>
        <label className={labelCls}>Social links</label>
        <div className="space-y-2">
          {socials.map((s, i) => (
            <div key={i} className="flex gap-2">
              <select className={`${inputCls} w-40`} value={s.platform || ''} onChange={(e) => set('socials', socials.map((x, j) => j === i ? { ...x, platform: e.target.value } : x))}>
                {['facebook', 'instagram', 'youtube', 'twitter', 'linkedin', 'website'].map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <input className={inputCls} placeholder="https://…" value={s.url || ''} onChange={(e) => set('socials', socials.map((x, j) => j === i ? { ...x, url: e.target.value } : x))} />
              <button type="button" onClick={() => set('socials', socials.filter((_, j) => j !== i))} className="p-2 text-surface-400 hover:text-red-600"><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => set('socials', [...socials, { platform: 'facebook', url: '' }])} className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary-600"><Plus size={15} /> Add social</button>
      </div>

      <div>
        <label className={labelCls}>Link columns</label>
        <div className="space-y-3">
          {columns.map((col, ci) => (
            <div key={ci} className="rounded-lg border border-surface-200 dark:border-surface-700 p-3">
              <div className="flex gap-2 mb-2">
                <input className={inputCls} placeholder="Column title" value={col.title || ''} onChange={(e) => set('columns', columns.map((c, j) => j === ci ? { ...c, title: e.target.value } : c))} />
                <button type="button" onClick={() => set('columns', columns.filter((_, j) => j !== ci))} className="p-2 text-surface-400 hover:text-red-600"><Trash2 size={15} /></button>
              </div>
              {(col.links || []).map((lnk, li) => (
                <div key={li} className="flex gap-2 mb-2">
                  <input className={inputCls} placeholder="Label" value={lnk.label || ''} onChange={(e) => set('columns', columns.map((c, j) => j === ci ? { ...c, links: c.links.map((l, k) => k === li ? { ...l, label: e.target.value } : l) } : c))} />
                  <input className={inputCls} placeholder="/link" value={lnk.url || ''} onChange={(e) => set('columns', columns.map((c, j) => j === ci ? { ...c, links: c.links.map((l, k) => k === li ? { ...l, url: e.target.value } : l) } : c))} />
                  <button type="button" onClick={() => set('columns', columns.map((c, j) => j === ci ? { ...c, links: c.links.filter((_, k) => k !== li) } : c))} className="p-2 text-surface-400 hover:text-red-600"><Trash2 size={15} /></button>
                </div>
              ))}
              <button type="button" onClick={() => set('columns', columns.map((c, j) => j === ci ? { ...c, links: [...(c.links || []), { label: '', url: '' }] } : c))} className="text-xs font-medium text-primary-600 inline-flex items-center gap-1"><Plus size={13} /> Add link</button>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => set('columns', [...columns, { title: '', links: [] }])} className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary-600"><Plus size={15} /> Add column</button>
      </div>
    </div>
  )
}

// ── Legal editor ─────────────────────────────────────────────────────────────
const LEGAL_TABS = [
  { key: 'refund', label: 'Refund Policy' },
  { key: 'privacy', label: 'Privacy Policy' },
  { key: 'terms', label: 'Terms & Conditions' },
]

const LegalEditor = () => {
  const [tab, setTab] = useState('refund')
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['admin-legal', tab],
    queryFn: () => landingAdminService.getLegal(tab),
  })
  const [draft, setDraft] = useState({ title: '', content: '' })
  useEffect(() => { if (data) setDraft({ title: data.title || '', content: data.content || '' }) }, [data])

  const save = useMutation({
    mutationFn: () => landingAdminService.saveLegal(tab, draft),
    onSuccess: (res) => {
      qc.setQueryData(['admin-legal', tab], res)
      toast.success('Saved')
    },
    onError: () => toast.error('Could not save'),
  })

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {LEGAL_TABS.map((tb) => (
          <button key={tb.key} onClick={() => setTab(tb.key)} className={`px-3.5 py-1.5 rounded-full text-sm font-medium ${tab === tb.key ? 'bg-primary-600 text-white' : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300'}`}>
            {tb.label}
          </button>
        ))}
      </div>
      {isLoading ? (
        <div className="py-10 text-center text-surface-400"><Loader2 className="animate-spin inline" /></div>
      ) : (
        <div className="space-y-4">
          {data?.is_default && (
            <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
              Showing a platform-provided generic template. Edit and save to publish your own version.
            </div>
          )}
          <div>
            <label className={labelCls}>Title</label>
            <input className={inputCls} value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} />
          </div>
          <div>
            <label className={labelCls}>Content (HTML supported)</label>
            <textarea className={`${inputCls} min-h-[320px] font-mono text-xs`} value={draft.content} onChange={(e) => setDraft((d) => ({ ...d, content: e.target.value }))} />
          </div>
          <button onClick={() => save.mutate()} disabled={save.isPending} className="inline-flex items-center gap-2 rounded-lg bg-primary-600 text-white px-4 py-2 text-sm font-semibold disabled:opacity-60">
            {save.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save {LEGAL_TABS.find((t) => t.key === tab)?.label}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Main builder ─────────────────────────────────────────────────────────────
const LandingBuilder = () => {
  const qc = useQueryClient()
  const [view, setView] = useState('page') // 'page' | 'footer' | 'legal'
  const { data, isLoading } = useQuery({
    queryKey: ['admin-landing'],
    queryFn: landingAdminService.getLanding,
  })

  const [draft, setDraft] = useState(null)
  useEffect(() => {
    if (data) {
      setDraft({
        template: data.template || 'aurora',
        is_published: data.is_published !== false,
        sections: (data.sections || []).map((s) => ({ ...s, id: s.id || sid() })),
        footer: data.footer || {},
        meta: data.meta || {},
      })
    }
  }, [data])

  const save = useMutation({
    mutationFn: (payload) => landingAdminService.saveLanding(payload),
    onSuccess: (res) => {
      qc.setQueryData(['admin-landing'], res)
      toast.success('Landing page saved')
    },
    onError: () => toast.error('Could not save landing page'),
  })

  const usedTypes = useMemo(() => new Set((draft?.sections || []).map((s) => s.type)), [draft])
  const addable = SECTION_ORDER.filter((type) => {
    const meta = SECTION_SCHEMAS[type]
    return !(meta.singleton && usedTypes.has(type))
  })

  if (isLoading || !draft) {
    return <div className="py-16 text-center text-surface-400"><Loader2 className="animate-spin inline" size={22} /></div>
  }

  const setSections = (sections) => setDraft((d) => ({ ...d, sections }))
  const updateSection = (idx, next) => setSections(draft.sections.map((s, i) => (i === idx ? next : s)))
  const moveSection = (idx, dir) => {
    const j = idx + dir
    if (j < 0 || j >= draft.sections.length) return
    const next = [...draft.sections]
    ;[next[idx], next[j]] = [next[j], next[idx]]
    setSections(next)
  }
  const addSection = (type) => {
    const meta = SECTION_SCHEMAS[type]
    setSections([...draft.sections, { id: sid(), type, enabled: true, data: JSON.parse(JSON.stringify(meta.defaultData || {})) }])
  }

  return (
    <div className="max-w-4xl">
      {/* Header actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-bold text-surface-900 dark:text-surface-100">Home Page Builder</h2>
          <p className="text-sm text-surface-500">Design your public landing page — no code required.</p>
        </div>
        <div className="flex items-center gap-2">
          <a href="/?preview=1" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-surface-200 dark:border-surface-700 px-3 py-2 text-sm font-medium text-surface-600 dark:text-surface-300">
            <ExternalLink size={15} /> Preview
          </a>
          <button onClick={() => save.mutate(draft)} disabled={save.isPending} className="inline-flex items-center gap-2 rounded-lg bg-primary-600 text-white px-4 py-2 text-sm font-semibold disabled:opacity-60">
            {save.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save
          </button>
        </div>
      </div>

      {/* View tabs */}
      <div className="flex gap-2 mb-6 border-b border-surface-200 dark:border-surface-700">
        {[
          { id: 'page', label: 'Sections', icon: Layout },
          { id: 'footer', label: 'Footer', icon: Layout },
          { id: 'legal', label: 'Legal Pages', icon: FileText },
        ].map((v) => (
          <button key={v.id} onClick={() => setView(v.id)} className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px ${view === v.id ? 'border-primary-600 text-primary-600' : 'border-transparent text-surface-500 hover:text-surface-700'}`}>
            <v.icon size={16} /> {v.label}
          </button>
        ))}
      </div>

      {view === 'page' && (
        <div className="space-y-6">
          {/* Template + publish */}
          <div className="rounded-xl border border-surface-200 dark:border-surface-700 p-4 bg-white dark:bg-surface-900">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-surface-700 dark:text-surface-200">Design template</label>
              <label className="inline-flex items-center gap-2 text-sm">
                <span className="text-surface-500">Published</span>
                <button
                  type="button"
                  onClick={() => setDraft((d) => ({ ...d, is_published: !d.is_published }))}
                  className={`relative h-6 w-11 rounded-full transition-colors ${draft.is_published ? 'bg-primary-600' : 'bg-surface-300 dark:bg-surface-600'}`}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${draft.is_published ? 'left-[22px]' : 'left-0.5'}`} />
                </button>
              </label>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {LANDING_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.key}
                  onClick={() => setDraft((d) => ({ ...d, template: tpl.key }))}
                  className={`text-left rounded-lg border p-3 transition-all ${draft.template === tpl.key ? 'border-primary-500 ring-2 ring-primary-500/30 bg-primary-50/50 dark:bg-primary-900/20' : 'border-surface-200 dark:border-surface-700 hover:border-primary-300'}`}
                >
                  <div className="font-semibold text-sm text-surface-800 dark:text-surface-100">{tpl.label}</div>
                  <div className="text-[11px] text-surface-400 mt-0.5">{tpl.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Sections list */}
          <div className="space-y-3">
            {draft.sections.map((section, idx) => (
              <SectionCard
                key={section.id}
                section={section}
                index={idx}
                total={draft.sections.length}
                onChange={(next) => updateSection(idx, next)}
                onMove={(dir) => moveSection(idx, dir)}
                onRemove={() => setSections(draft.sections.filter((_, i) => i !== idx))}
                onToggle={() => updateSection(idx, { ...section, enabled: section.enabled === false })}
              />
            ))}
            {draft.sections.length === 0 && (
              <p className="text-center text-surface-400 py-8 text-sm">No sections yet. Add one below.</p>
            )}
          </div>

          {/* Add section */}
          <div className="rounded-xl border border-dashed border-surface-300 dark:border-surface-700 p-4">
            <div className="text-sm font-semibold text-surface-600 dark:text-surface-300 mb-3">Add a section</div>
            <div className="flex flex-wrap gap-2">
              {addable.map((type) => {
                const meta = SECTION_SCHEMAS[type]
                return (
                  <button key={type} onClick={() => addSection(type)} className="inline-flex items-center gap-1.5 rounded-full border border-surface-200 dark:border-surface-700 px-3 py-1.5 text-sm font-medium text-surface-600 dark:text-surface-300 hover:border-primary-400 hover:text-primary-600">
                    <Icon name={meta.icon} size={15} /> {meta.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {view === 'footer' && (
        <div className="rounded-xl border border-surface-200 dark:border-surface-700 p-4 bg-white dark:bg-surface-900">
          <FooterEditor footer={draft.footer} onChange={(footer) => setDraft((d) => ({ ...d, footer }))} />
        </div>
      )}

      {view === 'legal' && (
        <div className="rounded-xl border border-surface-200 dark:border-surface-700 p-4 bg-white dark:bg-surface-900">
          <LegalEditor />
        </div>
      )}
    </div>
  )
}

export default LandingBuilder
