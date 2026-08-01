import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export const CHART_COLORS = {
  indigo: '#4f46e5',
  indigoLight: '#818cf8',
  emerald: '#10b981',
  amber: '#f59e0b',
  rose: '#f43f5e',
  slate: '#94a3b8',
  sky: '#0ea5e9',
  violet: '#8b5cf6',
}

const AXIS = { fontSize: 12, fill: '#94a3b8' }

export function ChartCard({ title, icon: Icon, action, children, className = '' }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-brand-600" />}
          <h2 className="font-semibold text-slate-900">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

export function MiniStat({ icon: Icon, label, value, tone = 'brand' }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-600',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
    slate: 'bg-slate-100 text-slate-600',
  }
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${tones[tone]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <div className="text-xl font-bold text-slate-900 leading-none">{value}</div>
        <div className="text-xs text-slate-500 mt-1 truncate">{label}</div>
      </div>
    </div>
  )
}

function TooltipBox({ active, payload, label, valueLabel }) {
  if (!active || !payload || !payload.length) return null
  const row = payload[0]
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg text-xs">
      <div className="font-medium text-slate-700">{row.payload.name ?? label}</div>
      <div className="text-slate-500">
        {valueLabel || 'Count'}: <span className="font-semibold text-slate-900">{row.value}</span>
      </div>
    </div>
  )
}

/** Donut chart with a centered total and a compact legend. */
export function DonutChart({ data, valueLabel, centerLabel, height = 200 }) {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  const hasData = total > 0
  return (
    <div className="flex items-center gap-4">
      <div className="relative shrink-0" style={{ width: height, height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={hasData ? data : [{ name: 'No data', value: 1, color: '#e2e8f0' }]}
              dataKey="value"
              nameKey="name"
              innerRadius="62%"
              outerRadius="100%"
              paddingAngle={hasData ? 2 : 0}
              stroke="none"
            >
              {(hasData ? data : [{ color: '#e2e8f0' }]).map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            {hasData && <Tooltip content={<TooltipBox valueLabel={valueLabel} />} />}
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold text-slate-900">{total}</span>
          {centerLabel && <span className="text-xs text-slate-400">{centerLabel}</span>}
        </div>
      </div>
      <ul className="space-y-1.5 text-sm min-w-0">
        {data.map((d) => (
          <li key={d.name} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
            <span className="text-slate-600 truncate">{d.name}</span>
            <span className="ml-auto font-semibold text-slate-900 tabular-nums">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Vertical bar chart (one series). */
export function BarChartCompact({ data, valueLabel, height = 220 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis dataKey="name" tick={AXIS} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip cursor={{ fill: '#f8fafc' }} content={<TooltipBox valueLabel={valueLabel} />} />
        <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={54}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.color || CHART_COLORS.indigo} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

/** Horizontal bar chart, good for ranked lists (top tenants). */
export function HBarChart({ data, valueLabel, height = 220 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
        <XAxis type="number" tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="name"
          tick={AXIS}
          axisLine={false}
          tickLine={false}
          width={120}
        />
        <Tooltip cursor={{ fill: '#f8fafc' }} content={<TooltipBox valueLabel={valueLabel} />} />
        <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={26} fill={CHART_COLORS.indigo} />
      </BarChart>
    </ResponsiveContainer>
  )
}

/** Smooth cumulative area chart for growth over time. */
export function GrowthAreaChart({ data, valueLabel, height = 240 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHART_COLORS.indigo} stopOpacity={0.28} />
            <stop offset="100%" stopColor={CHART_COLORS.indigo} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis dataKey="name" tick={AXIS} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip content={<TooltipBox valueLabel={valueLabel} />} />
        <Area
          type="monotone"
          dataKey="value"
          stroke={CHART_COLORS.indigo}
          strokeWidth={2.5}
          fill="url(#growthFill)"
          dot={{ r: 3, fill: CHART_COLORS.indigo, strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
