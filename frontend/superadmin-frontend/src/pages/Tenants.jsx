import { useEffect, useState, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Search, Plus, Loader2, Building2, X,
  Users as UsersIcon, BookOpen, GraduationCap,
  PieChart as PieIcon, CreditCard, Trophy,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { fetchTenants, createTenant } from '../services/superadminService'
import {
  ChartCard, MiniStat, DonutChart, BarChartCompact, HBarChart, CHART_COLORS,
} from '../components/charts'

const PLAN_ORDER = ['trial', 'starter', 'growth', 'enterprise']
const PLAN_LABELS = { trial: 'Trial', starter: 'Starter', growth: 'Growth', enterprise: 'Enterprise' }
const PLAN_COLORS = {
  trial: CHART_COLORS.slate,
  starter: CHART_COLORS.sky,
  growth: CHART_COLORS.indigo,
  enterprise: CHART_COLORS.violet,
}

const THEMES = [
  'sunrise', 'ocean', 'emerald', 'violet', 'rose',
  'indigo', 'slate', 'amber', 'cherry', 'lime',
]

function CreateTenantModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', subdomain: '', tagline: '', theme: 'sunrise' })
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState({})

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setErrors({ name: 'Name is required' })
      return
    }
    setSaving(true)
    setErrors({})
    try {
      const payload = {
        name: form.name.trim(),
        tagline: form.tagline.trim(),
        theme: form.theme,
      }
      if (form.subdomain.trim()) payload.subdomain = form.subdomain.trim().toLowerCase()
      const created = await createTenant(payload)
      toast.success('Tenant created')
      onCreated(created)
    } catch (err) {
      const d = err.response?.data || {}
      setErrors({
        name: Array.isArray(d.name) ? d.name[0] : undefined,
        subdomain: Array.isArray(d.subdomain) ? d.subdomain[0] : undefined,
      })
      toast.error('Could not create tenant')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Create Tenant</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Name *</label>
            <input
              value={form.name}
              onChange={set('name')}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 outline-none"
              placeholder="Acme Coaching Institute"
            />
            {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Subdomain</label>
            <input
              value={form.subdomain}
              onChange={set('subdomain')}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 outline-none"
              placeholder="acme"
            />
            {errors.subdomain && <p className="text-xs text-rose-600 mt-1">{errors.subdomain}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Tagline</label>
            <input
              value={form.tagline}
              onChange={set('tagline')}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 outline-none"
              placeholder="Learn. Practice. Succeed."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Theme</label>
            <select
              value={form.theme}
              onChange={set('theme')}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 outline-none capitalize"
            >
              {THEMES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg text-slate-600 hover:bg-slate-100 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Tenants() {
  const [tenants, setTenants] = useState([])
  const [allTenants, setAllTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  const load = useCallback((params) => {
    setLoading(true)
    fetchTenants(params)
      .then((data) => setTenants(data.results || data))
      .catch(() => toast.error('Failed to load tenants'))
      .finally(() => setLoading(false))
  }, [])

  // A full, unfiltered snapshot powers the summary charts (search shouldn't move them).
  const loadSnapshot = useCallback(() => {
    fetchTenants({ page_size: 200 })
      .then((data) => setAllTenants(data.results || data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    load()
    loadSnapshot()
  }, [load, loadSnapshot])

  useEffect(() => {
    const t = setTimeout(() => load(search ? { search } : {}), 300)
    return () => clearTimeout(t)
  }, [search, load])

  const summary = useMemo(() => {
    const list = allTenants
    const active = list.filter((t) => t.is_active && !t.is_suspended).length
    const suspended = list.filter((t) => t.is_suspended).length
    const inactive = list.filter((t) => !t.is_active && !t.is_suspended).length
    const students = list.reduce((n, t) => n + (t.student_count ?? 0), 0)
    const courses = list.reduce((n, t) => n + (t.course_count ?? 0), 0)
    const planDist = PLAN_ORDER.map((key) => ({
      name: PLAN_LABELS[key],
      value: list.filter((t) => t.plan === key).length,
      color: PLAN_COLORS[key],
    }))
    const statusData = [
      { name: 'Active', value: active, color: CHART_COLORS.emerald },
      { name: 'Inactive', value: inactive, color: CHART_COLORS.slate },
      { name: 'Suspended', value: suspended, color: CHART_COLORS.rose },
    ]
    const topTenants = [...list]
      .sort((a, b) => (b.student_count ?? 0) - (a.student_count ?? 0))
      .slice(0, 6)
      .map((t) => ({ name: t.name, value: t.student_count ?? 0 }))
    return { total: list.length, students, courses, planDist, statusData, topTenants }
  }, [allTenants])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tenants</h1>
          <p className="text-slate-500 text-sm mt-1">Manage every academy on the platform.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold"
        >
          <Plus className="w-4 h-4" /> New Tenant
        </button>
      </div>

      {/* Summary snapshot */}
      {allTenants.length > 0 && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MiniStat icon={Building2} label="Total Tenants" value={summary.total} tone="brand" />
            <MiniStat icon={GraduationCap} label="Total Students" value={summary.students} tone="green" />
            <MiniStat icon={BookOpen} label="Total Courses" value={summary.courses} tone="amber" />
            <MiniStat
              icon={UsersIcon}
              label="Avg Students / Tenant"
              value={summary.total ? Math.round(summary.students / summary.total) : 0}
              tone="slate"
            />
          </div>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            <ChartCard title="Status" icon={PieIcon}>
              <DonutChart data={summary.statusData} valueLabel="Tenants" centerLabel="tenants" height={170} />
            </ChartCard>
            <ChartCard title="Plans" icon={CreditCard}>
              <BarChartCompact data={summary.planDist} valueLabel="Tenants" height={180} />
            </ChartCard>
            <ChartCard title="Top by Students" icon={Trophy} className="md:col-span-2 xl:col-span-1">
              {summary.topTenants.some((t) => t.value > 0) ? (
                <HBarChart data={summary.topTenants} valueLabel="Students" height={180} />
              ) : (
                <div className="h-[180px] flex items-center justify-center text-sm text-slate-400">
                  No enrolled students yet.
                </div>
              )}
            </ChartCard>
          </div>
        </>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or subdomain..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-brand-500 outline-none bg-white"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : tenants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Building2 className="w-10 h-10 mb-3" />
            <p>No tenants found.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Subdomain</th>
                <th className="px-5 py-3 font-medium text-right">Students</th>
                <th className="px-5 py-3 font-medium text-right">Admins</th>
                <th className="px-5 py-3 font-medium text-right">Courses</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tenants.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 transition">
                  <td className="px-5 py-3.5">
                    <Link to={`/tenants/${t.id}`} className="font-medium text-slate-900 hover:text-brand-600">
                      {t.name}
                    </Link>
                    {t.tagline && <div className="text-xs text-slate-400">{t.tagline}</div>}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">{t.subdomain || '—'}</td>
                  <td className="px-5 py-3.5 text-right text-slate-700">{t.student_count}</td>
                  <td className="px-5 py-3.5 text-right text-slate-700">{t.admin_count}</td>
                  <td className="px-5 py-3.5 text-right text-slate-700">{t.course_count}</td>
                  <td className="px-5 py-3.5">
                    {t.is_suspended ? (
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">
                        Suspended
                      </span>
                    ) : t.is_billing_frozen ? (
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-rose-50 text-rose-700">
                        Subscription inactive
                      </span>
                    ) : (
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                          t.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {t.is_active ? 'Active' : 'Inactive'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showCreate && (
        <CreateTenantModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false)
            load(search ? { search } : {})
            loadSnapshot()
          }}
        />
      )}
    </div>
  )
}
