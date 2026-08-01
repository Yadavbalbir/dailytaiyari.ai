import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Building2,
  CheckCircle2,
  Users,
  BookOpen,
  ArrowRight,
  Loader2,
  CreditCard,
  Gauge,
  PieChart as PieIcon,
  UsersRound,
  TrendingUp,
  Trophy,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { fetchStats, fetchTenants } from '../services/superadminService'
import {
  ChartCard,
  DonutChart,
  BarChartCompact,
  HBarChart,
  GrowthAreaChart,
  CHART_COLORS,
} from '../components/charts'

const PLAN_ORDER = ['trial', 'starter', 'growth', 'enterprise']
const PLAN_LABELS = { trial: 'Trial', starter: 'Starter', growth: 'Growth', enterprise: 'Enterprise' }
const PLAN_COLORS = {
  trial: CHART_COLORS.slate,
  starter: CHART_COLORS.sky,
  growth: CHART_COLORS.indigo,
  enterprise: CHART_COLORS.violet,
}

function KpiCard({ icon: Icon, label, value, sub, tone = 'brand' }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-600',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    slate: 'bg-slate-100 text-slate-600',
  }
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-3xl font-bold text-slate-900 leading-none">{value}</div>
          <div className="text-sm text-slate-500 mt-1.5">{label}</div>
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${tones[tone]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {sub && <div className="text-xs text-slate-400 mt-3">{sub}</div>}
    </div>
  )
}

function buildGrowthSeries(tenants) {
  // Cumulative tenant count by month, last 6 months.
  const now = new Date()
  const months = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      name: d.toLocaleString('en', { month: 'short' }),
      end: new Date(d.getFullYear(), d.getMonth() + 1, 1),
      value: 0,
    })
  }
  for (const t of tenants) {
    if (!t.created_at) continue
    const created = new Date(t.created_at)
    for (const m of months) {
      if (created < m.end) m.value += 1
    }
  }
  return months.map(({ name, value }) => ({ name, value }))
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchStats(), fetchTenants({ page_size: 200 })])
      .then(([s, t]) => {
        setStats(s)
        setTenants(t.results || t)
      })
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  const statusData = useMemo(() => {
    if (!stats) return []
    return [
      { name: 'Active', value: stats.active_tenants ?? 0, color: CHART_COLORS.emerald },
      { name: 'Inactive', value: stats.inactive_tenants ?? 0, color: CHART_COLORS.slate },
      { name: 'Suspended', value: stats.suspended_tenants ?? 0, color: CHART_COLORS.rose },
    ]
  }, [stats])

  const userData = useMemo(() => {
    if (!stats) return []
    return [
      { name: 'Students', value: stats.total_students ?? 0, color: CHART_COLORS.indigo },
      { name: 'Faculty', value: stats.total_instructors ?? 0, color: CHART_COLORS.sky },
      { name: 'Admins', value: stats.total_admins ?? 0, color: CHART_COLORS.amber },
    ]
  }, [stats])

  const planData = useMemo(() => {
    if (!stats) return []
    return PLAN_ORDER.map((key) => ({
      name: PLAN_LABELS[key],
      value: stats.plan_distribution?.[key] ?? 0,
      color: PLAN_COLORS[key],
    }))
  }, [stats])

  const growthData = useMemo(() => buildGrowthSeries(tenants), [tenants])

  const topTenants = useMemo(
    () =>
      [...tenants]
        .sort((a, b) => (b.student_count ?? 0) - (a.student_count ?? 0))
        .slice(0, 6)
        .map((t) => ({ name: t.name, value: t.student_count ?? 0 })),
    [tenants]
  )

  const recent = useMemo(() => tenants.slice(0, 5), [tenants])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    )
  }

  const activePct = stats.total_tenants
    ? Math.round((stats.active_tenants / stats.total_tenants) * 100)
    : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Platform Overview</h1>
        <p className="text-slate-500 text-sm mt-1">
          A full picture of every tenant on DailyTaiyari.
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={Building2}
          label="Total Tenants"
          value={stats.total_tenants}
          sub={`${activePct}% active`}
          tone="brand"
        />
        <KpiCard
          icon={Users}
          label="Total Users"
          value={stats.total_users}
          sub={`${stats.total_students} students · ${stats.total_instructors} faculty`}
          tone="slate"
        />
        <KpiCard
          icon={BookOpen}
          label="Courses"
          value={stats.total_courses}
          sub="Across all tenants"
          tone="amber"
        />
        <KpiCard
          icon={CheckCircle2}
          label="Active Tenants"
          value={stats.active_tenants}
          sub={`${stats.suspended_tenants ?? 0} suspended`}
          tone="green"
        />
      </div>

      {/* Charts row */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        <ChartCard title="Tenant Status" icon={PieIcon}>
          <DonutChart data={statusData} valueLabel="Tenants" centerLabel="tenants" />
        </ChartCard>
        <ChartCard title="User Composition" icon={UsersRound}>
          <DonutChart data={userData} valueLabel="Users" centerLabel="users" />
        </ChartCard>
        <ChartCard title="Plan Distribution" icon={CreditCard} className="md:col-span-2 xl:col-span-1">
          <BarChartCompact data={planData} valueLabel="Tenants" />
        </ChartCard>
      </div>

      {/* Growth + top tenants */}
      <div className="grid lg:grid-cols-3 gap-4">
        <ChartCard title="Tenant Growth" icon={TrendingUp} className="lg:col-span-2">
          <GrowthAreaChart data={growthData} valueLabel="Total tenants" />
        </ChartCard>
        <ChartCard title="Top Tenants by Students" icon={Trophy}>
          {topTenants.some((t) => t.value > 0) ? (
            <HBarChart data={topTenants} valueLabel="Students" />
          ) : (
            <div className="h-[220px] flex items-center justify-center text-sm text-slate-400">
              No enrolled students yet.
            </div>
          )}
        </ChartCard>
      </div>

      {/* Needs attention + recent */}
      <div className="grid lg:grid-cols-3 gap-4">
        <ChartCard title="Needs Attention" icon={Gauge}>
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
              <Link to="/announcements" className="text-slate-600 hover:text-brand-600">
                Active announcements
              </Link>
              <span className="font-semibold text-slate-700">{stats.active_announcements ?? 0}</span>
            </li>
          </ul>
        </ChartCard>

        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200">
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
                      t.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
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
    </div>
  )
}
