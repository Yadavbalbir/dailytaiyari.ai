import api from './api'

export const certificateService = {
  /**
   * Certificate status for the current student in a course.
   * Returns { enabled, template, progress, completed, total, eligible, certificate }.
   * When the student is eligible, the backend issues (once) and returns the
   * certificate payload used to render/download it.
   */
  getCourseCertificate: async (courseId) => {
    const response = await api.get(`/certificates/course/${courseId}/`)
    return response.data
  },

  verify: async (number) => {
    const response = await api.get(`/certificates/verify/${number}/`)
    return response.data
  },
}
