import api, { TENANT_ID } from './api'

// For streaming endpoints that need direct fetch instead of axios
const getStreamingBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  return import.meta.env.DEV ? 'http://localhost:8000/api/v1' : '/api/v1'
}

/**
 * Headers for the streaming endpoints.
 *
 * These use raw fetch() so they bypass the axios instance entirely — including
 * its default X-Tenant-ID header. TenantMiddleware rejects any API call without
 * it, so omitting it here makes streaming fail with a 403 while every other
 * request succeeds.
 */
const streamingHeaders = () => {
  const headers = { 'Content-Type': 'application/json' }

  if (TENANT_ID) headers['X-Tenant-ID'] = TENANT_ID

  try {
    const authData = localStorage.getItem('auth-storage')
    if (authData) {
      const { state } = JSON.parse(authData)
      if (state?.tokens?.access) headers.Authorization = `Bearer ${state.tokens.access}`
    }
  } catch {
    // Corrupt auth storage — send the request unauthenticated and let the
    // server's 401 drive the normal re-login flow.
  }

  return headers
}

export const chatService = {
  // Everything the chat empty-state needs: enrolled courses, tailored starter
  // prompts, and whether the AI is actually configured for this tenant.
  getWorkspace: async (courseId = null) => {
    const response = await api.get('/chatbot/workspace/', {
      params: courseId ? { course_id: courseId } : {},
    })
    return response.data
  },

  // Sessions
  getSessions: async () => {
    const response = await api.get('/chatbot/sessions/')
    return response.data
  },

  getSession: async (sessionId) => {
    const response = await api.get(`/chatbot/sessions/${sessionId}/`)
    return response.data
  },

  createSession: async (data = {}) => {
    const response = await api.post('/chatbot/sessions/', data)
    return response.data
  },

  deleteSession: async (sessionId) => {
    await api.delete(`/chatbot/sessions/${sessionId}/`)
  },

  setSessionCourse: async (sessionId, courseId) => {
    const response = await api.post(`/chatbot/sessions/${sessionId}/set_course/`, {
      course_id: courseId,
    })
    return response.data
  },

  // Non-streaming message send
  sendMessage: async (sessionId, content, image = null) => {
    const formData = new FormData()
    formData.append('content', content)
    if (image) {
      formData.append('image', image)
    }
    
    const response = await api.post(
      `/chatbot/sessions/${sessionId}/send_message/`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    )
    return response.data
  },

  // Streaming message send
  sendMessageStream: async (sessionId, content, onChunk, onComplete, onError) => {
    try {
      const response = await fetch(
        `${getStreamingBaseUrl()}/chatbot/sessions/${sessionId}/send_message_stream/`,
        {
          method: 'POST',
          headers: streamingHeaders(),
          body: JSON.stringify({ content }),
        }
      )

      if (!response.ok) {
        // Surface the server's own explanation (missing tenant, quota reached,
        // provider not configured) rather than a bare status code.
        let detail = ''
        try {
          const body = await response.json()
          detail = body.error || body.detail || ''
        } catch {
          // Non-JSON error body; the status code alone will have to do.
        }
        throw new Error(detail || `Request failed with status ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n').filter(line => line.trim())

        for (const line of lines) {
          try {
            const data = JSON.parse(line)
            
            if (data.done) {
              onComplete?.(data)
            } else if (data.content) {
              fullContent += data.content
              onChunk?.(data.content, fullContent)
            }
          } catch (e) {
            // Ignore parse errors for incomplete chunks
          }
        }
      }

      return { success: true, content: fullContent }
    } catch (error) {
      console.error('Streaming error:', error)
      onError?.(error)
      return { success: false, error: error.message }
    }
  },

  closeSession: async (sessionId) => {
    const response = await api.post(`/chatbot/sessions/${sessionId}/close/`)
    return response.data
  },

  rateSession: async (sessionId, rating, wasHelpful) => {
    const response = await api.post(`/chatbot/sessions/${sessionId}/rate/`, {
      rating,
      was_helpful: wasHelpful,
    })
    return response.data
  },

  // Messages
  markHelpful: async (messageId, isHelpful = true) => {
    const response = await api.post(`/chatbot/messages/${messageId}/mark_helpful/`, {
      is_helpful: isHelpful,
    })
    return response.data
  },

  saveMessage: async (messageId, title = '') => {
    const response = await api.post(`/chatbot/messages/${messageId}/save/`, {
      title,
    })
    return response.data
  },

  // Saved responses
  getSavedResponses: async () => {
    const response = await api.get('/chatbot/saved/')
    return response.data
  },

  deleteSavedResponse: async (savedId) => {
    await api.delete(`/chatbot/saved/${savedId}/`)
  },

  // FAQ
  getFAQs: async (topicId, subjectId) => {
    const response = await api.get('/chatbot/faq/', {
      params: { topic: topicId, subject: subjectId },
    })
    return response.data
  },

  getFAQSuggestions: async (topicId) => {
    const response = await api.get('/chatbot/faq/suggestions/', {
      params: { topic_id: topicId },
    })
    return response.data
  },

  markFAQHelpful: async (faqId) => {
    const response = await api.post(`/chatbot/faq/${faqId}/mark_helpful/`)
    return response.data
  },

  // AI Quiz Tracking
  submitAIQuiz: async (data) => {
    const response = await api.post('/chatbot/ai-quizzes/submit/', data)
    return response.data
  },

  getAIQuizzes: async () => {
    const response = await api.get('/chatbot/ai-quizzes/')
    return response.data
  },

  getAIQuizReview: async (attemptId) => {
    const response = await api.get(`/chatbot/ai-quizzes/${attemptId}/review/`)
    return response.data
  },

  getAILearningStats: async () => {
    const response = await api.get('/chatbot/ai-quizzes/stats/')
    return response.data
  },

  getAIQuizzesByTopic: async (topic) => {
    const response = await api.get('/chatbot/ai-quizzes/by_topic/', {
      params: { topic },
    })
    return response.data
  },

  getWrongQuestions: async (topic) => {
    const response = await api.get('/chatbot/ai-quizzes/wrong_questions/', {
      params: { topic },
    })
    return response.data
  },
}
