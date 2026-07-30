import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Loader2,
  Save,
  Users,
  GraduationCap,
  BookOpen,
  ShieldCheck,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { fetchTenant, updateTenant } from '../services/superadminService'

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between w-full py-2"
    >
      <span className="text-sm text-slate-700">{label}</span>
      <span
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
          checked ? 'bg-brand-600' : 'bg-slate-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </span>
    </button>
  )
}

function MiniStat({ icon: Icon, label, value }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <div className="text-lg font-bold text-slate-900 leading-none">{value}</div>
        <div className="text-xs text-slate-500 mt-0.5">{label}</div>
      </div>
    </div>
  )
}

export default function TenantDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tenant, setTenant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(null)

  useEffect(() => {
    fetchTenant(id)
      .then((data) => {
        setTenant(data)
        setForm({
          name: data.name,
          tagline: data.tagline || '',
          subdomain: data.subdomain || '',
          theme: data.theme,
          show_name: data.show_name,
          is_active: data.is_active,
          features: { ...data.features },
        })
      })
      .catch(() => {
        toast.error('Tenant not found')
        navigate('/tenants', { replace: true })
      })
      .finally(() => setLoading(false))
  }, [id, navigate])

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const setFeature = (key, v) =>
    setForm((f) => ({ ...f, features: { ...f.features, [key]: v } }))

  const save = async () => {
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        tagline: form.tagline.trim(),
        theme: form.theme,
        show_name: form.show_name,
        is_active: form.is_active,
        features: form.features,
      }
      const sub = form.subdomain.trim().toLowerCase()
      if (sub !== (tenant.subdomain || '')) payload.subdomain = sub
      const updated = await updateTenant(id, payload)
      setTenant(updated)
      toast.success('Saved')
    } catch (err) {
      const d = err.response?.data || {}
      const msg =
        (Array.isArray(d.subdomain) && d.subdomain[0]) ||
        (Array.isArray(d.name) && d.name[0]) ||
        'Could not save changes'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  if (loading || !form) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link
        to="/tenants"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="w-4 h-4" /> Back to tenants
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{tenant.name}</h1>
          <p className="text-slate-500 text-sm mt-1">
            {tenant.subdomain || 'no subdomain'} ·{' '}
            <span className={tenant.is_active ? 'text-emerald-600' : 'text-rose-600'}>
              {tenant.is_active ? 'Active' : 'Inactive'}
            </span>
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniStat icon={Users} label="Users" value={tenant.user_count} />
        <MiniStat icon={GraduationCap} label="Students" value={tenant.student_count} />
        <MiniStat icon={ShieldCheck} label="Admins" value={tenant.admin_count} />
        <MiniStat icon={BookOpen} label="Courses" value={tenant.course_count} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Details */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
          <h2 className="font-semibold text-slate-900">Details</h2>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Name</label>
            <input
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Tagline</label>
            <input
              value={form.tagline}
              onChange={(e) => set('tagline', e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Subdomain</label>
            <input
              value={form.subdomain}
              onChange={(e) => set('subdomain', e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Theme</label>
            <select
              value={form.theme}
              onChange={(e) => set('theme', e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 outline-none capitalize"
            >
              {(tenant.available_themes || []).map((t) => (
                <option key={t.key} value={t.key}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="pt-2 border-t border-slate-100 space-y-1">
            <Toggle
              checked={form.is_active}
              onChange={(v) => set('is_active', v)}
              label="Tenant active"
            />
            <Toggle
              checked={form.show_name}
              onChange={(v) => set('show_name', v)}
              label="Show name alongside logo"
            />
          </div>
        </div>

        {/* Features */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-2">Features</h2>
          <p className="text-xs text-slate-500 mb-3">
            Toggle which product modules this tenant can use.
          </p>
          <div className="divide-y divide-slate-100">
            {(tenant.available_features || []).map((f) => (
              <Toggle
                key={f.key}
                checked={!!form.features[f.key]}
                onChange={(v) => setFeature(f.key, v)}
                label={f.label}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
