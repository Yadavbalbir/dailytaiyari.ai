import { useEffect, useState } from 'react'
import {
  Megaphone,
  Loader2,
  Plus,
  Trash2,
  Pencil,
  Globe,
  Building2,
  X,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import {
  fetchAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  fetchTenants,
} from '../services/superadminService'

const LEVELS = [
  { v: 'info', l: 'Info', c: 'bg-sky-50 text-sky-700 border-sky-200' },
  { v: 'warning', l: 'Warning', c: 'bg-amber-50 text-amber-700 border-amber-200' },
  { v: 'critical', l: 'Critical', c: 'bg-rose-50 text-rose-700 border-rose-200' },
]
const LEVEL_BADGE = Object.fromEntries(LEVELS.map((l) => [l.v, l.c]))

// <input type="datetime-local"> <-> ISO helpers.
const toLocalInput = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16)
}
const fromLocalInput = (v) => (v ? new Date(v).toISOString() : null)

const EMPTY = { title: '', body: '', level: 'info', target_tenant: '', is_active: true, starts_at: '', ends_at: '' }

function Editor({ initial, tenants, onClose, onSaved }) {
  const [form, setForm] = useState(() => ({
    title: initial?.title || '',
    body: initial?.body || '',
    level: initial?.level || 'info',
    target_tenant: initial?.target_tenant || '',
    is_active: initial?.is_active ?? true,
    starts_at: toLocalInput(initial?.starts_at),
    ends_at: toLocalInput(initial?.ends_at),
  }))
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.title.trim()) return toast.error('Title is required')
    setSaving(true)
    const payload = {
      title: form.title.trim(),
      body: form.body,
      level: form.level,
      target_tenant: form.target_tenant || null,
      is_active: form.is_active,
      starts_at: fromLocalInput(form.starts_at),
      ends_at: fromLocalInput(form.ends_at),
    }
    try {
      const saved = initial?.id
        ? await updateAnnouncement(initial.id, payload)
        : await createAnnouncement(payload)
      toast.success(initial?.id ? 'Updated' : 'Announcement created')
      onSaved(saved)
    } catch (e) {
      const d = e?.response?.data
      toast.error(d?.ends_at?.[0] || d?.detail || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-30 bg-slate-900/40 flex items-start justify-center overflow-y-auto py-10 px-4">
      <div className="bg-white rounded-xl border border-slate-200 w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">{initial?.id ? 'Edit announcement' : 'New announcement'}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100 text-slate-500"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1.5">Title</label>
            <input value={form.title} onChange={(e) => set('title', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1.5">Body</label>
            <textarea value={form.body} onChange={(e) => set('body', e.target.value)} rows={3} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1.5">Level</label>
              <select value={form.level} onChange={(e) => set('level', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white">
                {LEVELS.map((l) => <option key={l.v} value={l.v}>{l.l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1.5">Audience</label>
              <select value={form.target_tenant} onChange={(e) => set('target_tenant', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white">
                <option value="">All tenants (global)</option>
                {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1.5">Starts (optional)</label>
              <input type="datetime-local" value={form.starts_at} onChange={(e) => set('starts_at', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1.5">Ends (optional)</label>
              <input type="datetime-local" value={form.ends_at} onChange={(e) => set('ends_at', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} className="rounded border-slate-300" />
            Active (uncheck to save as a draft)
          </label>
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-100">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">Cancel</button>
          <button onClick={submit} disabled={saving} className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium disabled:opacity-50 inline-flex items-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />} {initial?.id ? 'Save' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Announcements() {
  const [items, setItems] = useState([])
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null) // null = closed, {} = new, {..} = edit

  const load = () => {
    setLoading(true)
    fetchAnnouncements()
      .then((d) => setItems(d.results || d))
      .catch(() => toast.error('Failed to load announcements'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    fetchTenants().then((d) => setTenants(d.results || d)).catch(() => {})
  }, [])

  const remove = async (a) => {
    if (!confirm(`Delete announcement "${a.title}"?`)) return
    try {
      await deleteAnnouncement(a.id)
      setItems((prev) => prev.filter((x) => x.id !== a.id))
      toast.success('Deleted')
    } catch {
      toast.error('Delete failed')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-brand-600" /> Announcements
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Banners shown inside tenant apps — global or scoped to one tenant.
          </p>
        </div>
        <button onClick={() => setEditing({})} className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium inline-flex items-center gap-2">
          <Plus className="w-4 h-4" /> New
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-slate-400"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 px-5 py-16 text-center text-slate-400">No announcements yet.</div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <ul className="divide-y divide-slate-100">
            {items.map((a) => (
              <li key={a.id} className="px-5 py-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${LEVEL_BADGE[a.level] || ''}`}>{a.level_label || a.level}</span>
                    {a.is_live ? (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">Live</span>
                    ) : (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{a.is_active ? 'Scheduled' : 'Inactive'}</span>
                    )}
                    <span className="text-xs text-slate-500 inline-flex items-center gap-1">
                      {a.target_tenant ? <><Building2 className="w-3.5 h-3.5" /> {a.target_tenant_name}</> : <><Globe className="w-3.5 h-3.5" /> All tenants</>}
                    </span>
                  </div>
                  <div className="font-medium text-slate-900 mt-1">{a.title}</div>
                  {a.body && <div className="text-sm text-slate-500 mt-0.5 line-clamp-2">{a.body}</div>}
                  <div className="text-xs text-slate-400 mt-1">
                    {a.starts_at || a.ends_at
                      ? `${a.starts_at ? new Date(a.starts_at).toLocaleString() : 'now'} → ${a.ends_at ? new Date(a.ends_at).toLocaleString() : '∞'}`
                      : `created ${formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}`}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => setEditing(a)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => remove(a)} className="p-2 rounded-lg hover:bg-rose-50 text-rose-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {editing !== null && (
        <Editor
          initial={editing}
          tenants={tenants}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load() }}
        />
      )}
    </div>
  )
}
