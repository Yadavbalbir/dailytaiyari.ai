import api from './api'

/**
 * Marketing & Promotions admin service — coupons and the sitewide promo banner.
 * Also exposes the student-facing coupon validation used at checkout.
 */
export const marketingService = {
    // ── Coupons (admin) ──────────────────────────────────────────────────
    getCoupons: async () => {
        const { data } = await api.get('/marketing/admin/coupons/')
        return Array.isArray(data) ? data : data.results || []
    },
    createCoupon: async (payload) => {
        const { data } = await api.post('/marketing/admin/coupons/', payload)
        return data
    },
    updateCoupon: async (id, payload) => {
        const { data } = await api.patch(`/marketing/admin/coupons/${id}/`, payload)
        return data
    },
    deleteCoupon: async (id) => {
        await api.delete(`/marketing/admin/coupons/${id}/`)
    },
    getCouponRedemptions: async (id) => {
        const { data } = await api.get(`/marketing/admin/coupons/${id}/redemptions/`)
        return Array.isArray(data) ? data : data.results || []
    },
    getCourseOptions: async () => {
        const { data } = await api.get('/marketing/admin/coupons/course-options/')
        return data
    },

    // ── Promo banners (admin) ────────────────────────────────────────────
    getBanners: async () => {
        const { data } = await api.get('/marketing/admin/banners/')
        return Array.isArray(data) ? data : data.results || []
    },
    createBanner: async (payload) => {
        const { data } = await api.post('/marketing/admin/banners/', payload)
        return data
    },
    updateBanner: async (id, payload) => {
        const { data } = await api.patch(`/marketing/admin/banners/${id}/`, payload)
        return data
    },
    deleteBanner: async (id) => {
        await api.delete(`/marketing/admin/banners/${id}/`)
    },

    // ── Coupon validation (student checkout) ─────────────────────────────
    validateCoupon: async (code, courseId) => {
        const { data } = await api.post('/marketing/coupons/validate/', {
            code,
            course: courseId,
        })
        return data
    },
}

export default marketingService
