import api from './api'

export const tenantAdminService = {
    // Student Management
    getStudents: async (params = {}) => {
        // Pull the full institution roster (high page_size) so search, filters
        // and CSV export operate over every student, not just the first page.
        const response = await api.get('/auth/tenant-students/', {
            params: { page_size: 5000, ...params },
        })
        return response.data
    },

    resetStudentProgress: async (studentId) => {
        const response = await api.post(`/auth/tenant-students/${studentId}/reset_progress/`)
        return response.data
    },

    toggleStudentStatus: async (studentId) => {
        const response = await api.post(`/auth/tenant-students/${studentId}/toggle_status/`)
        return response.data
    },

    updateStudent: async (studentId, data) => {
        const response = await api.patch(`/auth/tenant-students/${studentId}/`, data)
        return response.data
    },

    // Exam Enrollment Approvals
    getEnrollmentRequests: async (params = {}) => {
        const response = await api.get('/auth/enrollment-requests/', { params })
        return response.data
    },

    approveEnrollment: async (id) => {
        const response = await api.post(`/auth/enrollment-requests/${id}/approve/`)
        return response.data
    },

    rejectEnrollment: async (id, reason = '') => {
        const response = await api.post(`/auth/enrollment-requests/${id}/reject/`, { reason })
        return response.data
    },

    // Tenant Settings — branding (logo) + feature toggles
    getSettings: async () => {
        const response = await api.get('/tenant-admin/settings/')
        return response.data
    },

    updateFeatures: async (features) => {
        const response = await api.patch('/tenant-admin/settings/', { features })
        return response.data
    },

    updateLogo: async (file) => {
        const formData = new FormData()
        formData.append('logo', file)
        const response = await api.patch('/tenant-admin/settings/', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
        return response.data
    },
}
