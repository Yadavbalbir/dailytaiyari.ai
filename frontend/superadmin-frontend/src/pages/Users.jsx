import { useEffect, useMemo, useState } from 'react'
import {
  Users as UsersIcon,
  Loader2,
  Search,
  ShieldOff,
  ShieldCheck,
  MailCheck,
  KeyRound,
  MoreHorizontal,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { fetchUsers, userAction, fetchTenants } from '../services/superadminService'

const ROLE_BADGE = {
  student: 'bg-brand-50 text-brand-700',
  admin: 'bg-indigo-50 text-indigo-700',
  instructor: 'bg-amber-50 text-amber-700',
}

function StatusBadge({ user }) {
  if (user.is_suspended)
    return <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-rose-50 text-rose-700">Suspended</span>
  if (!user.is_email_verified)
    return <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">Unverified</span>
  if (!user.is_active)
    return <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">Disabled</span>
  return <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">Active</span>
}

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tenant, setTenant] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [menuId, setMenuId] = useState(null)

  const load = () => {
    setLoading(true)
    const params = {}
    if (search) params.search = search
    if (tenant) params.tenant = tenant
    if (role) params.role = role
    if (status) params.status = status
    fetchUsers(params)
      .then((d) => setUsers(d.results || d))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchTenants().then((d) => setTenants(d.results || d)).catch(() => {})
  }, [])

  // Debounce search; refetch on any filter change.
  useEffect(() => {
    const t = setTimeout(load, 250)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, tenant, role, status])

  const act = async (user, action) => {
    setBusyId(user.id)
    setMenuId(null)
    try {
      const updated = await userAction(user.id, action)
      if (action === 'reset_password') {
        toast.success(`Password reset email sent to ${user.email}`)
      } else {
        setUsers((prev) => prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)))
        toast.success('Done')
      }
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Action failed')
    } finally {
      setBusyId(null)
    }
  }

  const roleOptions = useMemo(
    () => [
      { v: '', l: 'All roles' },
      { v: 'student', l: 'Students' },
      { v: 'admin', l: 'Admins' },
      { v: 'instructor', l: 'Faculty' },
    ],
    []
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <UsersIcon className="w-6 h-6 text-brand-600" /> Users
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Every user across every tenant. Suspend, verify, or trigger a password reset.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search email or name…"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <select
          value={tenant}
          onChange={(e) => setTenant(e.target.value)}
          className="py-2 px-3 rounded-lg border border-slate-200 text-sm bg-white"
        >
          <option value="">All tenants</option>
          {tenants.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="py-2 px-3 rounded-lg border border-slate-200 text-sm bg-white"
        >
          {roleOptions.map((o) => (
            <option key={o.v} value={o.v}>{o.l}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="py-2 px-3 rounded-lg border border-slate-200 text-sm bg-white"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="unverified">Unverified</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-visible">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="px-5 py-16 text-center text-slate-400">No users match these filters.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-400 border-b border-slate-100">
                <th className="px-5 py-3 font-medium">User</th>
                <th className="px-5 py-3 font-medium">Tenant</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <div className="font-medium text-slate-900">{u.name}</div>
                    <div className="text-xs text-slate-500">{u.email}</div>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{u.tenant_name || '—'}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_BADGE[u.role] || 'bg-slate-100 text-slate-600'}`}>
                      {u.role_label || u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3"><StatusBadge user={u} /></td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1 relative">
                      {busyId === u.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                      ) : (
                        <button
                          onClick={() => setMenuId(menuId === u.id ? null : u.id)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      )}
                      {menuId === u.id && (
                        <div
                          className="absolute right-0 top-9 z-10 w-52 bg-white border border-slate-200 rounded-lg shadow-lg py-1 text-sm"
                          onMouseLeave={() => setMenuId(null)}
                        >
                          {u.is_suspended ? (
                            <button onClick={() => act(u, 'unsuspend')} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-emerald-700">
                              <ShieldCheck className="w-4 h-4" /> Unsuspend
                            </button>
                          ) : (
                            <button onClick={() => act(u, 'suspend')} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-rose-700">
                              <ShieldOff className="w-4 h-4" /> Suspend
                            </button>
                          )}
                          {!u.is_email_verified && (
                            <button onClick={() => act(u, 'verify')} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-slate-700">
                              <MailCheck className="w-4 h-4" /> Mark email verified
                            </button>
                          )}
                          <button onClick={() => act(u, 'reset_password')} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 text-slate-700">
                            <KeyRound className="w-4 h-4" /> Send password reset
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
