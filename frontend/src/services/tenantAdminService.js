import api from './api'

export const tenantAdminService = {
    // Student Management
    getStudents: async (params = {}) => {
        const response = await api.get('/auth/tenant-students/', { params })
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
    }
}
