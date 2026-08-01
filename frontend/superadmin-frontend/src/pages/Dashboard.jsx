import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Building2,
  CheckCircle2,
  XCircle,
  Users,
  GraduationCap,
  BookOpen,
  ArrowRight,
  Loader2,
  AlertTriangle,
  CreditCard,
  Gauge,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { fetchStats, fetchTenants } from '../services/superadminService'

const PLAN_ORDER = ['trial', 'starter', 'growth', 'enterprise']
const PLAN_LABELS = {
  trial: 'Trial',
  starter: 'Starter',
  growth: 'Growth',
  enterprise: 'Enterprise',
}

function StatCard({ icon: Icon, label, value, tone = 'brand' }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-600',
    green: 'bg-emerald-50 text-emerald-600',
    red: 'bg-rose-50 text-rose-600',
    amber: 'bg-amber-50 text-amber-600',
    slate: 'bg-slate-100 text-slate-600',
  }
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${tones[tone]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="text-sm text-slate-500">{label}</div>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchStats(), fetchTenants()])
      .then(([s, t]) => {
        setStats(s)
        setRecent((t.results || t).slice(0, 5))
      })
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Platform Overview</h1>
        <p className="text-slate-500 text-sm mt-1">
          A full picture of every tenant on DailyTaiyari.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Building2} label="Total Tenants" value={stats.total_tenants} tone="brand" />
        <StatCard icon={CheckCircle2} label="Active" value={stats.active_tenants} tone="green" />
        <StatCard icon={XCircle} label="Inactive" value={stats.inactive_tenants} tone="red" />
        <StatCard icon={AlertTriangle} label="Suspended" value={stats.suspended_tenants ?? 0} tone="amber" />
        <StatCard icon={BookOpen} label="Courses" value={stats.total_courses} tone="amber" />
        <StatCard icon={Users} label="Total Users" value={stats.total_users} tone="slate" />
        <StatCard icon={GraduationCap} label="Students" value={stats.total_students} tone="brand" />
        <StatCard icon={Users} label="Tenant Admins" value={stats.total_admins} tone="slate" />
        <StatCard icon={Users} label="Faculty" value={stats.total_instructors} tone="slate" />
      </div>

      {/* Plans & at-risk */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-4 h-4 text-brand-600" />
            <h2 className="font-semibold text-slate-900">Plan Distribution</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {PLAN_ORDER.map((key) => (
              <div key={key} className="rounded-lg bg-slate-50 border border-slate-100 p-3">
                <div className="text-2xl font-bold text-slate-900">
                  {stats.plan_distribution?.[key] ?? 0}
                </div>
                <div className="text-xs text-slate-500 capitalize">{PLAN_LABELS[key]}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Gauge className="w-4 h-4 text-brand-600" />
            <h2 className="font-semibold text-slate-900">Needs Attention</h2>
          </div>
          <ul className="space-y-2.5 text-sm">
            <li className="flex items-center justify-between">
              <span className="text-slate-600">Over quota</span>
              <span className="font-semibold text-rose-600">{stats.over_quota_tenants ?? 0}</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-slate-600">Near quota (≥80%)</span>
              <span className="font-semibold text-amber-600">{stats.near_quota_tenants ?? 0}</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-slate-600">Subscription inactive</span>
              <span className="font-semibold text-rose-600">{stats.billing_frozen_tenants ?? 0}</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-slate-600">Suspended</span>
              <span className="font-semibold text-amber-600">{stats.suspended_tenants ?? 0}</span>
            </li>
            <li className="flex items-center justify-between border-t border-slate-100 pt-2.5">
              <Link to="/support" className="text-slate-600 hover:text-brand-600">New leads</Link>
              <span className="font-semibold text-brand-600">{stats.new_leads ?? 0}</span>
            </li>
            <li className="flex items-center justify-between">
              <Link to="/announcements" className="text-slate-600 hover:text-brand-600">Active announcements</Link>
              <span className="font-semibold text-slate-700">{stats.active_announcements ?? 0}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900">Recent Tenants</h2>
          <Link
            to="/tenants"
            className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
          >
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <ul className="divide-y divide-slate-100">
          {recent.map((t) => (
            <li key={t.id}>
              <Link
                to={`/tenants/${t.id}`}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition"
              >
                <div>
                  <div className="font-medium text-slate-900">{t.name}</div>
                  <div className="text-xs text-slate-500">
                    {t.subdomain || 'no subdomain'} · {t.student_count} students · {t.course_count} courses
                  </div>
                </div>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    t.is_active
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  {t.is_active ? 'Active' : 'Inactive'}
                </span>
              </Link>
            </li>
          ))}
          {recent.length === 0 && (
            <li className="px-5 py-6 text-sm text-slate-400 text-center">No tenants yet.</li>
          )}
        </ul>
      </div>
    </div>
  )
}
