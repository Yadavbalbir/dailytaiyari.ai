import { useEffect, useState } from 'react'
import {
  Inbox,
  Loader2,
  Mail,
  Phone,
  Building,
  Briefcase,
  ExternalLink,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import { fetchLeads, updateLead } from '../services/superadminService'

const TYPE_META = {
  demo: { label: 'Demo request', icon: Building, color: 'bg-indigo-50 text-indigo-700' },
  contact: { label: 'Contact message', icon: Mail, color: 'bg-sky-50 text-sky-700' },
  job: { label: 'Job application', icon: Briefcase, color: 'bg-amber-50 text-amber-700' },
}

const STATUS_META = {
  new: 'bg-brand-50 text-brand-700',
  contacted: 'bg-amber-50 text-amber-700',
  closed: 'bg-slate-100 text-slate-500',
}

const STATUSES = ['new', 'contacted', 'closed']

function LeadRow({ lead, onSelect, active }) {
  const meta = TYPE_META[lead.lead_type] || TYPE_META.contact
  const Icon = meta.icon
  return (
    <button
      onClick={() => onSelect(lead)}
      className={`w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition ${
        active ? 'bg-brand-50/60' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${meta.color} inline-flex items-center gap-1`}>
          <Icon className="w-3 h-3" /> {meta.label}
        </span>
        <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full ${STATUS_META[lead.status]}`}>
          {lead.status_label || lead.status}
        </span>
      </div>
      <div className="font-medium text-slate-900 mt-1 truncate">{lead.name}</div>
      <div className="text-xs text-slate-500 truncate">{lead.email}</div>
      <div className="text-[11px] text-slate-400 mt-0.5">
        {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
      </div>
    </button>
  )
}

function Detail({ lead, onSaved }) {
  const [status, setStatus] = useState(lead.status)
  const [notes, setNotes] = useState(lead.internal_notes || '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setStatus(lead.status)
    setNotes(lead.internal_notes || '')
  }, [lead.id])

  const save = async () => {
    setSaving(true)
    try {
      const updated = await updateLead(lead.lead_type, lead.id, { status, internal_notes: notes })
      toast.success('Saved')
      onSaved(updated)
    } catch {
      toast.error('Save failed')
    } finally {
      setSaving(false)
    }
  }

  const dirty = status !== lead.status || notes !== (lead.internal_notes || '')
  const rows = [
    ['Email', lead.email],
    ['Phone', lead.phone],
    ['Organization', lead.organization],
    ['Org type', lead.organization_type],
    ['Position', lead.position],
    ['Experience', lead.experience],
    ['Subject', lead.subject],
  ].filter(([, v]) => v)

  return (
    <div className="p-5 space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-900">{lead.name}</h2>
        <div className="text-sm text-slate-500 flex items-center gap-3 mt-0.5">
          <a href={`mailto:${lead.email}`} className="hover:text-brand-600 inline-flex items-center gap-1">
            <Mail className="w-3.5 h-3.5" /> {lead.email}
          </a>
          {lead.phone && (
            <span className="inline-flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {lead.phone}</span>
          )}
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt className="text-xs text-slate-400">{k}</dt>
            <dd className="text-slate-800">{v}</dd>
          </div>
        ))}
      </dl>

      {(lead.message || lead.cover_letter) && (
        <div>
          <div className="text-xs text-slate-400 mb-1">{lead.cover_letter ? 'Cover letter' : 'Message'}</div>
          <div className="text-sm text-slate-700 whitespace-pre-wrap bg-slate-50 border border-slate-100 rounded-lg p-3">
            {lead.cover_letter || lead.message}
          </div>
        </div>
      )}

      {lead.portfolio_url && (
        <a href={lead.portfolio_url} target="_blank" rel="noreferrer" className="text-sm text-brand-600 inline-flex items-center gap-1 hover:underline">
          <ExternalLink className="w-3.5 h-3.5" /> Portfolio
        </a>
      )}

      <div className="border-t border-slate-100 pt-4 space-y-3">
        <div>
          <label className="text-xs font-medium text-slate-500 block mb-1.5">Status</label>
          <div className="flex gap-2">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize border transition ${
                  status === s ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500 block mb-1.5">Internal notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Only visible to the DailyTaiyari team…"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <button
          onClick={save}
          disabled={!dirty || saving}
          className="px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-medium disabled:opacity-50 inline-flex items-center gap-2"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save
        </button>
      </div>
    </div>
  )
}

export default function Support() {
  const [data, setData] = useState({ results: [], counts: {} })
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected] = useState(null)

  const load = () => {
    setLoading(true)
    const params = {}
    if (typeFilter) params.type = typeFilter
    if (statusFilter) params.status = statusFilter
    fetchLeads(params)
      .then((d) => {
        setData(d)
        setSelected((prev) => d.results.find((x) => x.id === prev?.id) || d.results[0] || null)
      })
      .catch(() => toast.error('Failed to load inbox'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [typeFilter, statusFilter])

  const onSaved = (updated) => {
    setSelected(updated)
    // A status change may drop the row out of the current filter — reload.
    load()
  }

  const counts = data.counts || {}

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Inbox className="w-6 h-6 text-brand-600" /> Support Inbox
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Demo requests, contact messages and job applications from the marketing site.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="py-2 px-3 rounded-lg border border-slate-200 text-sm bg-white">
          <option value="">All types</option>
          <option value="demo">Demo requests ({counts.demo ?? 0})</option>
          <option value="contact">Contact messages ({counts.contact ?? 0})</option>
          <option value="job">Job applications ({counts.job ?? 0})</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="py-2 px-3 rounded-lg border border-slate-200 text-sm bg-white">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
        <span className="ml-auto self-center text-sm text-slate-500">
          <span className="font-semibold text-brand-600">{counts.new ?? 0}</span> new
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : data.results.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 px-5 py-16 text-center text-slate-400">
          Nothing in the inbox for these filters.
        </div>
      ) : (
        <div className="grid md:grid-cols-[320px_1fr] gap-4">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden max-h-[70vh] overflow-y-auto">
            {data.results.map((lead) => (
              <LeadRow key={`${lead.lead_type}-${lead.id}`} lead={lead} onSelect={setSelected} active={selected?.id === lead.id} />
            ))}
          </div>
          <div className="bg-white rounded-xl border border-slate-200">
            {selected ? <Detail lead={selected} onSaved={onSaved} /> : (
              <div className="px-5 py-16 text-center text-slate-400">Select a message to view details.</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
