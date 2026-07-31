import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { History, Loader2, Building2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fetchAuditLogs } from '../services/superadminService'

const ACTION_META = {
  'tenant.create': { label: 'Created tenant', color: 'bg-emerald-50 text-emerald-700' },
  'tenant.update': { label: 'Updated tenant', color: 'bg-slate-100 text-slate-700' },
  'tenant.suspend': { label: 'Suspended tenant', color: 'bg-rose-50 text-rose-700' },
  'tenant.unsuspend': { label: 'Unsuspended tenant', color: 'bg-emerald-50 text-emerald-700' },
  'tenant.feature_locks': { label: 'Changed feature locks', color: 'bg-amber-50 text-amber-700' },
  'tenant.plan': { label: 'Changed plan / quotas', color: 'bg-indigo-50 text-indigo-700' },
}

export default function AuditLog() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAuditLogs()
      .then((d) => setLogs(d.results || d))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <History className="w-6 h-6 text-brand-600" /> Audit Log
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Every super-admin change to tenants, newest first.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 px-5 py-12 text-center text-slate-400">
          No changes recorded yet.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <ul className="divide-y divide-slate-100">
            {logs.map((log) => {
              const meta = ACTION_META[log.action] || {
                label: log.action,
                color: 'bg-slate-100 text-slate-700',
              }
              return (
                <li key={log.id} className="px-5 py-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${meta.color}`}>
                        {meta.label}
                      </span>
                      {log.tenant_id ? (
                        <Link
                          to={`/tenants/${log.tenant_id}`}
                          className="text-sm font-medium text-slate-800 hover:text-brand-600 inline-flex items-center gap-1"
                        >
                          <Building2 className="w-3.5 h-3.5" />
                          {log.tenant_name || 'tenant'}
                        </Link>
                      ) : (
                        <span className="text-sm font-medium text-slate-800 inline-flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5" />
                          {log.tenant_name || '—'}
                        </span>
                      )}
                    </div>
                    {log.changes && Object.keys(log.changes).length > 0 && (
                      <div className="text-xs text-slate-500 mt-1">
                        Changed: {Object.keys(log.changes).join(', ')}
                      </div>
                    )}
                    <div className="text-xs text-slate-400 mt-0.5">
                      by {log.actor_email || 'system'}
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap shrink-0">
                    {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
