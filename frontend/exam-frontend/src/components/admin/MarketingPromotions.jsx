import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
    Ticket,
    Megaphone,
    Plus,
    Pencil,
    Trash2,
    Percent,
    IndianRupee,
    Tag,
    Users2,
    X,
    Loader2,
    BarChart3,
    Power,
} from 'lucide-react'
import { marketingService } from '../../services/marketingService'
import { formatApiError, ConfirmDialog } from './builderShared'
import { BANNER_THEMES, bannerThemeStyle } from '../../config/bannerThemes'

/* ---------------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------------- */
const money = (currency, amount) => {
    const sym = { INR: '₹', USD: '$', EUR: '€', GBP: '£' }[currency] || `${currency || ''} `
    const n = Number(amount)
    return `${sym}${Number.isFinite(n) ? n.toLocaleString('en-IN') : amount}`
}

const STATUS_BADGE = {
    live: 'badge-success',
    scheduled: 'badge-primary',
    expired: 'badge-error',
    exhausted: 'badge-error',
    inactive: 'badge-warning',
}

// datetime-local <-> ISO helpers
const toLocalInput = (iso) => (iso ? iso.slice(0, 16) : '')
const fromLocalInput = (val) => (val ? new Date(val).toISOString() : null)
const cleanNum = (v) => (v === '' || v === null || v === undefined ? null : Number(v))

/* ---------------------------------------------------------------------------
 * Coupons
 * ------------------------------------------------------------------------- */
const emptyCoupon = {
    code: '',
    description: '',
    discount_type: 'percent',
    discount_value: '',
    max_discount_amount: '',
    min_order_amount: '',
    applies_to_all: true,
    course_ids: [],
    starts_at: '',
    ends_at: '',
    usage_limit: '',
    per_user_limit: 1,
    is_active: true,
}

const CouponModal = ({ instance, courses, onClose, onSaved }) => {
    const isEdit = Boolean(instance?.id)
    const [form, setForm] = useState(() => {
        if (!instance) return emptyCoupon
        return {
            ...emptyCoupon,
            ...instance,
            discount_value: instance.discount_value ?? '',
            max_discount_amount: instance.max_discount_amount ?? '',
            min_order_amount: instance.min_order_amount ?? '',
            usage_limit: instance.usage_limit ?? '',
            per_user_limit: instance.per_user_limit ?? 1,
            starts_at: toLocalInput(instance.starts_at),
            ends_at: toLocalInput(instance.ends_at),
            course_ids: (instance.courses || []).map((c) => c.id),
        }
    })
    const set = (patch) => setForm((f) => ({ ...f, ...patch }))

    const mutation = useMutation({
        mutationFn: (payload) =>
            isEdit
                ? marketingService.updateCoupon(instance.id, payload)
                : marketingService.createCoupon(payload),
        onSuccess: () => {
            toast.success(isEdit ? 'Coupon updated' : 'Coupon created')
            onSaved()
        },
        onError: (err) => toast.error(formatApiError(err, 'Could not save coupon')),
    })

    const submit = (e) => {
        e.preventDefault()
        if (!form.code.trim()) return toast.error('Coupon code is required')
        if (!form.discount_value) return toast.error('Discount value is required')
        const payload = {
            code: form.code.trim().toUpperCase(),
            description: form.description,
            discount_type: form.discount_type,
            discount_value: Number(form.discount_value),
            max_discount_amount:
                form.discount_type === 'percent' ? cleanNum(form.max_discount_amount) : null,
            min_order_amount: cleanNum(form.min_order_amount) ?? 0,
            applies_to_all: form.applies_to_all,
            course_ids: form.applies_to_all ? [] : form.course_ids,
            starts_at: fromLocalInput(form.starts_at),
            ends_at: fromLocalInput(form.ends_at),
            usage_limit: cleanNum(form.usage_limit),
            per_user_limit: cleanNum(form.per_user_limit) ?? 0,
            is_active: form.is_active,
        }
        mutation.mutate(payload)
    }

    const toggleCourse = (id) =>
        set({
            course_ids: form.course_ids.includes(id)
                ? form.course_ids.filter((c) => c !== id)
                : [...form.course_ids, id],
        })

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={onClose}
        >
            <motion.form
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                onSubmit={submit}
                className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5"
            >
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-display font-bold flex items-center gap-2">
                        <Ticket size={20} className="text-primary-500" />
                        {isEdit ? 'Edit coupon' : 'New coupon'}
                    </h3>
                    <button type="button" onClick={onClose} className="btn-icon">
                        <X size={18} />
                    </button>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium mb-1 block">Coupon code *</label>
                        <input
                            className="input uppercase"
                            value={form.code}
                            onChange={(e) => set({ code: e.target.value.toUpperCase() })}
                            placeholder="WELCOME20"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1 block">Description</label>
                        <input
                            className="input"
                            value={form.description}
                            onChange={(e) => set({ description: e.target.value })}
                            placeholder="Launch offer"
                        />
                    </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                        <label className="text-sm font-medium mb-1 block">Discount type</label>
                        <select
                            className="input"
                            value={form.discount_type}
                            onChange={(e) => set({ discount_type: e.target.value })}
                        >
                            <option value="percent">Percentage (%)</option>
                            <option value="flat">Flat amount</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1 block">
                            {form.discount_type === 'percent' ? 'Percent off' : 'Amount off'}
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            className="input"
                            value={form.discount_value}
                            onChange={(e) => set({ discount_value: e.target.value })}
                            placeholder={form.discount_type === 'percent' ? '20' : '500'}
                        />
                    </div>
                    {form.discount_type === 'percent' && (
                        <div>
                            <label className="text-sm font-medium mb-1 block">Max discount cap</label>
                            <input
                                type="number"
                                step="0.01"
                                className="input"
                                value={form.max_discount_amount}
                                onChange={(e) => set({ max_discount_amount: e.target.value })}
                                placeholder="Optional"
                            />
                        </div>
                    )}
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                        <label className="text-sm font-medium mb-1 block">Min order amount</label>
                        <input
                            type="number"
                            step="0.01"
                            className="input"
                            value={form.min_order_amount}
                            onChange={(e) => set({ min_order_amount: e.target.value })}
                            placeholder="0"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1 block">Total usage limit</label>
                        <input
                            type="number"
                            className="input"
                            value={form.usage_limit}
                            onChange={(e) => set({ usage_limit: e.target.value })}
                            placeholder="Unlimited"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1 block">Per-user limit</label>
                        <input
                            type="number"
                            className="input"
                            value={form.per_user_limit}
                            onChange={(e) => set({ per_user_limit: e.target.value })}
                            placeholder="0 = unlimited"
                        />
                    </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium mb-1 block">Starts at</label>
                        <input
                            type="datetime-local"
                            className="input"
                            value={form.starts_at}
                            onChange={(e) => set({ starts_at: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1 block">Ends at</label>
                        <input
                            type="datetime-local"
                            className="input"
                            value={form.ends_at}
                            onChange={(e) => set({ ends_at: e.target.value })}
                        />
                    </div>
                </div>

                <div className="rounded-xl border border-surface-200 dark:border-surface-700 p-4 space-y-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={form.applies_to_all}
                            onChange={(e) => set({ applies_to_all: e.target.checked })}
                            className="w-4 h-4 accent-primary-500"
                        />
                        <span className="font-medium">Apply to all paid courses</span>
                    </label>
                    {!form.applies_to_all && (
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {courses.length === 0 && (
                                <p className="text-sm text-surface-500">No paid courses available.</p>
                            )}
                            {courses.map((c) => (
                                <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={form.course_ids.includes(c.id)}
                                        onChange={() => toggleCourse(c.id)}
                                        className="w-4 h-4 accent-primary-500"
                                    />
                                    <span>{c.name}</span>
                                    <span className="text-surface-400">· {money(c.currency, c.price)}</span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={form.is_active}
                        onChange={(e) => set({ is_active: e.target.checked })}
                        className="w-4 h-4 accent-primary-500"
                    />
                    <span className="font-medium">Active</span>
                </label>

                <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={onClose} className="btn-secondary">
                        Cancel
                    </button>
                    <button type="submit" disabled={mutation.isPending} className="btn-primary">
                        {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : null}
                        {isEdit ? 'Save changes' : 'Create coupon'}
                    </button>
                </div>
            </motion.form>
        </motion.div>
    )
}

const RedemptionsModal = ({ coupon, onClose }) => {
    const { data = [], isLoading } = useQuery({
        queryKey: ['couponRedemptions', coupon.id],
        queryFn: () => marketingService.getCouponRedemptions(coupon.id),
    })
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
            <div className="card w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-display font-bold flex items-center gap-2">
                        <BarChart3 size={18} className="text-primary-500" /> {coupon.code} — redemptions
                    </h3>
                    <button onClick={onClose} className="btn-icon"><X size={18} /></button>
                </div>
                {isLoading ? (
                    <div className="py-8 text-center"><Loader2 className="animate-spin inline" /></div>
                ) : data.length === 0 ? (
                    <p className="text-surface-500 text-sm py-6 text-center">No redemptions yet.</p>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-surface-500 border-b border-surface-200 dark:border-surface-700">
                                <th className="py-2">Student</th>
                                <th>Course</th>
                                <th>Discount</th>
                                <th>Paid</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((r) => (
                                <tr key={r.id} className="border-b border-surface-100 dark:border-surface-800">
                                    <td className="py-2">{r.student_name}</td>
                                    <td>{r.course_name}</td>
                                    <td className="text-success-600">−{money(r.currency, r.discount_amount)}</td>
                                    <td>{money(r.currency, r.final_amount)}</td>
                                    <td className="text-surface-400">{new Date(r.created_at).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}

const CouponsPanel = () => {
    const queryClient = useQueryClient()
    const [modal, setModal] = useState(null) // { instance } | null
    const [redeeming, setRedeeming] = useState(null)
    const [deleting, setDeleting] = useState(null)

    const { data: coupons = [], isLoading } = useQuery({
        queryKey: ['adminCoupons'],
        queryFn: marketingService.getCoupons,
    })
    const { data: courses = [] } = useQuery({
        queryKey: ['couponCourseOptions'],
        queryFn: marketingService.getCourseOptions,
    })

    const refresh = () => queryClient.invalidateQueries({ queryKey: ['adminCoupons'] })

    const del = useMutation({
        mutationFn: (id) => marketingService.deleteCoupon(id),
        onSuccess: () => {
            toast.success('Coupon deleted')
            setDeleting(null)
            refresh()
        },
        onError: (err) => toast.error(formatApiError(err, 'Could not delete coupon')),
    })

    const describeDiscount = (c) =>
        c.discount_type === 'percent'
            ? `${Number(c.discount_value)}% off${c.max_discount_amount ? ` (max ${money('INR', c.max_discount_amount)})` : ''}`
            : `${money('INR', c.discount_value)} off`

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-display font-bold text-lg">Coupons</h3>
                    <p className="text-sm text-surface-500">Create discount codes to boost enrolments.</p>
                </div>
                <button className="btn-primary" onClick={() => setModal({ instance: null })}>
                    <Plus size={16} /> New coupon
                </button>
            </div>

            {isLoading ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin inline" /></div>
            ) : coupons.length === 0 ? (
                <div className="card p-10 text-center">
                    <Ticket size={40} className="mx-auto text-surface-300 mb-3" />
                    <p className="text-surface-500">No coupons yet. Create your first promotion.</p>
                </div>
            ) : (
                <div className="grid gap-3">
                    {coupons.map((c) => (
                        <div key={c.id} className="card p-4 flex flex-wrap items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                                {c.discount_type === 'percent' ? (
                                    <Percent size={20} className="text-primary-500" />
                                ) : (
                                    <IndianRupee size={20} className="text-primary-500" />
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-mono font-bold tracking-wide">{c.code}</span>
                                    <span className={STATUS_BADGE[c.status] || 'badge'}>{c.status}</span>
                                </div>
                                <p className="text-sm text-surface-500">
                                    {describeDiscount(c)} ·{' '}
                                    {c.applies_to_all ? 'All courses' : `${c.courses?.length || 0} course(s)`}
                                    {c.usage_limit ? ` · ${c.times_redeemed}/${c.usage_limit} used` : ` · ${c.times_redeemed} used`}
                                </p>
                            </div>
                            <div className="flex items-center gap-1">
                                <button className="btn-icon" title="Redemptions" onClick={() => setRedeeming(c)}>
                                    <Users2 size={16} />
                                </button>
                                <button className="btn-icon" title="Edit" onClick={() => setModal({ instance: c })}>
                                    <Pencil size={16} />
                                </button>
                                <button className="btn-icon text-error-500" title="Delete" onClick={() => setDeleting(c)}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <AnimatePresence>
                {modal && (
                    <CouponModal
                        instance={modal.instance}
                        courses={courses}
                        onClose={() => setModal(null)}
                        onSaved={() => {
                            setModal(null)
                            refresh()
                        }}
                    />
                )}
            </AnimatePresence>
            {redeeming && <RedemptionsModal coupon={redeeming} onClose={() => setRedeeming(null)} />}
            {deleting && (
                <ConfirmDialog
                    label={`coupon "${deleting.code}"`}
                    deleting={del.isPending}
                    onCancel={() => setDeleting(null)}
                    onConfirm={() => del.mutate(deleting.id)}
                />
            )}
        </div>
    )
}

/* ---------------------------------------------------------------------------
 * Promo banners
 * ------------------------------------------------------------------------- */
const emptyBanner = {
    title: '',
    message: '',
    cta_label: '',
    cta_url: '',
    coupon: '',
    theme: 'sunset',
    bg_color: '#111827',
    text_color: '#ffffff',
    dismissible: true,
    is_active: false,
    starts_at: '',
    ends_at: '',
}

const BannerPreview = ({ banner }) => {
    const style = bannerThemeStyle(banner)
    return (
        <div className="rounded-xl overflow-hidden shadow-sm" style={style}>
            <div className="px-4 py-2.5 flex items-center justify-center gap-3 text-sm font-medium text-center flex-wrap">
                {banner.title && <span className="font-bold">{banner.title}</span>}
                <span>{banner.message || 'Your promo message appears here'}</span>
                {banner.cta_label && (
                    <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-semibold">
                        {banner.cta_label}
                    </span>
                )}
            </div>
        </div>
    )
}

const BannerModal = ({ instance, coupons, onClose, onSaved }) => {
    const isEdit = Boolean(instance?.id)
    const [form, setForm] = useState(() =>
        instance
            ? {
                  ...emptyBanner,
                  ...instance,
                  coupon: instance.coupon || '',
                  bg_color: instance.bg_color || '#111827',
                  text_color: instance.text_color || '#ffffff',
                  starts_at: toLocalInput(instance.starts_at),
                  ends_at: toLocalInput(instance.ends_at),
              }
            : emptyBanner
    )
    const set = (patch) => setForm((f) => ({ ...f, ...patch }))

    const mutation = useMutation({
        mutationFn: (payload) =>
            isEdit
                ? marketingService.updateBanner(instance.id, payload)
                : marketingService.createBanner(payload),
        onSuccess: () => {
            toast.success(isEdit ? 'Banner updated' : 'Banner created')
            onSaved()
        },
        onError: (err) => toast.error(formatApiError(err, 'Could not save banner')),
    })

    const submit = (e) => {
        e.preventDefault()
        if (!form.message.trim()) return toast.error('Message is required')
        mutation.mutate({
            title: form.title,
            message: form.message,
            cta_label: form.cta_label,
            cta_url: form.cta_url,
            coupon: form.coupon || null,
            theme: form.theme,
            bg_color: form.theme === 'custom' ? form.bg_color : '',
            text_color: form.theme === 'custom' ? form.text_color : '',
            dismissible: form.dismissible,
            is_active: form.is_active,
            starts_at: fromLocalInput(form.starts_at),
            ends_at: fromLocalInput(form.ends_at),
        })
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={onClose}
        >
            <motion.form
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                onSubmit={submit}
                className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5"
            >
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-display font-bold flex items-center gap-2">
                        <Megaphone size={20} className="text-primary-500" />
                        {isEdit ? 'Edit banner' : 'New promo banner'}
                    </h3>
                    <button type="button" onClick={onClose} className="btn-icon"><X size={18} /></button>
                </div>

                <BannerPreview banner={form} />

                <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium mb-1 block">Headline (optional)</label>
                        <input className="input" value={form.title} onChange={(e) => set({ title: e.target.value })} placeholder="Diwali Sale" />
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1 block">Message *</label>
                        <input className="input" value={form.message} onChange={(e) => set({ message: e.target.value })} placeholder="Flat 20% off all courses!" />
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1 block">Button label</label>
                        <input className="input" value={form.cta_label} onChange={(e) => set({ cta_label: e.target.value })} placeholder="Shop now" />
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1 block">Button link</label>
                        <input className="input" value={form.cta_url} onChange={(e) => set({ cta_url: e.target.value })} placeholder="/courses" />
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1 block">Linked coupon (optional)</label>
                        <select className="input" value={form.coupon} onChange={(e) => set({ coupon: e.target.value })}>
                            <option value="">None</option>
                            {coupons.map((c) => (
                                <option key={c.id} value={c.id}>{c.code}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1 block">Theme</label>
                        <select className="input" value={form.theme} onChange={(e) => set({ theme: e.target.value })}>
                            {BANNER_THEMES.map((t) => (
                                <option key={t.key} value={t.key}>{t.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {form.theme === 'custom' && (
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-1 block">Background colour</label>
                            <input type="color" className="input h-12 p-1" value={form.bg_color} onChange={(e) => set({ bg_color: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1 block">Text colour</label>
                            <input type="color" className="input h-12 p-1" value={form.text_color} onChange={(e) => set({ text_color: e.target.value })} />
                        </div>
                    </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium mb-1 block">Starts at</label>
                        <input type="datetime-local" className="input" value={form.starts_at} onChange={(e) => set({ starts_at: e.target.value })} />
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1 block">Ends at</label>
                        <input type="datetime-local" className="input" value={form.ends_at} onChange={(e) => set({ ends_at: e.target.value })} />
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={form.dismissible} onChange={(e) => set({ dismissible: e.target.checked })} className="w-4 h-4 accent-primary-500" />
                        <span className="font-medium">Dismissible</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={form.is_active} onChange={(e) => set({ is_active: e.target.checked })} className="w-4 h-4 accent-primary-500" />
                        <span className="font-medium">Active (show on site)</span>
                    </label>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                    <button type="submit" disabled={mutation.isPending} className="btn-primary">
                        {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : null}
                        {isEdit ? 'Save changes' : 'Create banner'}
                    </button>
                </div>
            </motion.form>
        </motion.div>
    )
}

const BannersPanel = () => {
    const queryClient = useQueryClient()
    const [modal, setModal] = useState(null)
    const [deleting, setDeleting] = useState(null)

    const { data: banners = [], isLoading } = useQuery({
        queryKey: ['adminBanners'],
        queryFn: marketingService.getBanners,
    })
    const { data: coupons = [] } = useQuery({
        queryKey: ['adminCoupons'],
        queryFn: marketingService.getCoupons,
    })

    const refresh = () => queryClient.invalidateQueries({ queryKey: ['adminBanners'] })

    const toggle = useMutation({
        mutationFn: (b) => marketingService.updateBanner(b.id, { is_active: !b.is_active }),
        onSuccess: () => refresh(),
        onError: (err) => toast.error(formatApiError(err, 'Could not update banner')),
    })
    const del = useMutation({
        mutationFn: (id) => marketingService.deleteBanner(id),
        onSuccess: () => {
            toast.success('Banner deleted')
            setDeleting(null)
            refresh()
        },
        onError: (err) => toast.error(formatApiError(err, 'Could not delete banner')),
    })

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-display font-bold text-lg">Promo banners</h3>
                    <p className="text-sm text-surface-500">Show an attractive announcement bar at the top of the app.</p>
                </div>
                <button className="btn-primary" onClick={() => setModal({ instance: null })}>
                    <Plus size={16} /> New banner
                </button>
            </div>

            {banners.some((b) => b.is_active) && (
                <p className="text-xs text-surface-400">
                    The most recently updated active banner is shown to learners.
                </p>
            )}

            {isLoading ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin inline" /></div>
            ) : banners.length === 0 ? (
                <div className="card p-10 text-center">
                    <Megaphone size={40} className="mx-auto text-surface-300 mb-3" />
                    <p className="text-surface-500">No banners yet. Create one to promote a sale.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {banners.map((b) => (
                        <div key={b.id} className="card p-4 space-y-3">
                            <BannerPreview banner={b} />
                            <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-2">
                                    <span className={b.is_live ? 'badge-success' : 'badge-warning'}>
                                        {b.is_live ? 'Live' : b.is_active ? 'Scheduled/expired' : 'Inactive'}
                                    </span>
                                    {b.coupon_code && (
                                        <span className="badge-primary"><Tag size={12} /> {b.coupon_code}</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        className={`btn-icon ${b.is_active ? 'text-success-500' : ''}`}
                                        title={b.is_active ? 'Deactivate' : 'Activate'}
                                        onClick={() => toggle.mutate(b)}
                                    >
                                        <Power size={16} />
                                    </button>
                                    <button className="btn-icon" title="Edit" onClick={() => setModal({ instance: b })}>
                                        <Pencil size={16} />
                                    </button>
                                    <button className="btn-icon text-error-500" title="Delete" onClick={() => setDeleting(b)}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <AnimatePresence>
                {modal && (
                    <BannerModal
                        instance={modal.instance}
                        coupons={coupons}
                        onClose={() => setModal(null)}
                        onSaved={() => {
                            setModal(null)
                            refresh()
                        }}
                    />
                )}
            </AnimatePresence>
            {deleting && (
                <ConfirmDialog
                    label="this banner"
                    deleting={del.isPending}
                    onCancel={() => setDeleting(null)}
                    onConfirm={() => del.mutate(deleting.id)}
                />
            )}
        </div>
    )
}

/* ---------------------------------------------------------------------------
 * Root
 * ------------------------------------------------------------------------- */
const MarketingPromotions = () => {
    const [panel, setPanel] = useState('coupons')
    const tabs = [
        { id: 'coupons', label: 'Coupons', icon: Ticket },
        { id: 'banners', label: 'Promo Banner', icon: Megaphone },
    ]
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-display font-bold">Marketing &amp; Promotions</h2>
                <p className="text-surface-500">Run coupon campaigns and promote sales with a sitewide banner.</p>
            </div>

            <div className="flex gap-2 border-b border-surface-200 dark:border-surface-800">
                {tabs.map((t) => {
                    const Icon = t.icon
                    const active = panel === t.id
                    return (
                        <button
                            key={t.id}
                            onClick={() => setPanel(t.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 -mb-px border-b-2 font-medium transition-colors ${
                                active
                                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                                    : 'border-transparent text-surface-500 hover:text-surface-800 dark:hover:text-surface-200'
                            }`}
                        >
                            <Icon size={16} /> {t.label}
                        </button>
                    )
                })}
            </div>

            {panel === 'coupons' ? <CouponsPanel /> : <BannersPanel />}
        </div>
    )
}

export default MarketingPromotions
