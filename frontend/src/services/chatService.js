import api from './api'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export const chatService = {
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
    const token = localStorage.getItem('access_token')
    
    try {
      const response = await fetch(
        `${API_BASE_URL}/chatbot/sessions/${sessionId}/send_message_stream/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ content }),
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
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
}
