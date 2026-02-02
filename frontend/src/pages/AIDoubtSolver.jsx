import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import ReactMarkdown from 'react-markdown'
import { chatService } from '../services/chatService'
import Loading from '../components/common/Loading'
import toast from 'react-hot-toast'

const AIDoubtSolver = () => {
  const queryClient = useQueryClient()
  const [input, setInput] = useState('')
  const [activeSession, setActiveSession] = useState(null)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Fetch sessions
  const { data: sessions, isLoading: sessionsLoading } = useQuery({
    queryKey: ['chatSessions'],
    queryFn: () => chatService.getSessions(),
  })

  // Fetch FAQ suggestions
  const { data: faqSuggestions } = useQuery({
    queryKey: ['faqSuggestions'],
    queryFn: () => chatService.getFAQSuggestions(),
  })

  // Fetch active session messages
  const { data: sessionData, isLoading: messagesLoading } = useQuery({
    queryKey: ['chatSession', activeSession],
    queryFn: () => chatService.getSession(activeSession),
    enabled: !!activeSession,
  })

  // Create new session mutation
  const createSessionMutation = useMutation({
    mutationFn: (data) => chatService.createSession(data),
    onSuccess: (data) => {
      setActiveSession(data.id)
      queryClient.invalidateQueries(['chatSessions'])
    },
  })

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: ({ sessionId, content }) => chatService.sendMessage(sessionId, content),
    onMutate: () => setIsTyping(true),
    onSuccess: () => {
      queryClient.invalidateQueries(['chatSession', activeSession])
    },
    onSettled: () => setIsTyping(false),
  })

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [sessionData?.messages, isTyping])

  const handleNewChat = async () => {
    const session = await createSessionMutation.mutateAsync({
      title: 'New Chat',
    })
  }

  const handleSend = async () => {
    if (!input.trim()) return

    // Create session if none exists
    if (!activeSession) {
      const session = await createSessionMutation.mutateAsync({
        title: input.slice(0, 50),
        initial_message: input,
      })
      setInput('')
      return
    }

    await sendMessageMutation.mutateAsync({
      sessionId: activeSession,
      content: input,
    })
    setInput('')
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFAQClick = async (question) => {
    if (!activeSession) {
      await createSessionMutation.mutateAsync({
        title: question.slice(0, 50),
        initial_message: question,
      })
    } else {
      await sendMessageMutation.mutateAsync({
        sessionId: activeSession,
        content: question,
      })
    }
  }

  const messages = sessionData?.messages || []

  return (
    <div className="flex h-[calc(100vh-8rem)] lg:h-[calc(100vh-6rem)] gap-6">
      {/* Sidebar - Chat History */}
      <div className="hidden lg:block w-72 flex-shrink-0">
        <div className="card h-full flex flex-col">
          <div className="p-4 border-b border-surface-200 dark:border-surface-700">
            <button
              onClick={handleNewChat}
              className="btn-primary w-full"
            >
              + New Chat
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            {sessionsLoading ? (
              <Loading />
            ) : (
              <div className="space-y-1">
                {(sessions?.results || sessions || []).map((session) => (
                  <button
                    key={session.id}
                    onClick={() => setActiveSession(session.id)}
                    className={`w-full text-left p-3 rounded-xl transition-colors ${
                      activeSession === session.id
                        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600'
                        : 'hover:bg-surface-100 dark:hover:bg-surface-800'
                    }`}
                  >
                    <p className="font-medium text-sm truncate">{session.title}</p>
                    <p className="text-xs text-surface-500 truncate">
                      {session.last_message?.content || 'No messages'}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col card overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-surface-200 dark:border-surface-700 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center">
            <span className="text-xl">🤖</span>
          </div>
          <div>
            <h2 className="font-semibold">AI Doubt Solver</h2>
            <p className="text-xs text-surface-500">Ask any question about your exams</p>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center mb-4">
                <span className="text-4xl">🤖</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">How can I help you today?</h3>
              <p className="text-surface-500 max-w-md mb-6">
                I'm your AI tutor, ready to help with any doubts about NEET, JEE, CBSE, or any other exam topics.
              </p>
              
              {/* Quick Questions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-lg">
                {(faqSuggestions || [
                  { question: "Explain the laws of thermodynamics" },
                  { question: "How to solve quadratic equations?" },
                  { question: "What is the structure of DNA?" },
                  { question: "Explain Newton's laws of motion" },
                ]).slice(0, 4).map((faq, index) => (
                  <button
                    key={index}
                    onClick={() => handleFAQClick(faq.question)}
                    className="p-3 text-left text-sm rounded-xl border border-surface-200 dark:border-surface-700 hover:border-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                  >
                    {faq.question}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <motion.div
                  key={message.id || index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-lg bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center flex-shrink-0">
                      <span>🤖</span>
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[80%] rounded-2xl p-4 ${
                      message.role === 'user'
                        ? 'bg-primary-500 text-white'
                        : 'bg-surface-100 dark:bg-surface-800'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p>{message.content}</p>
                    )}
                    
                    {message.role === 'assistant' && (
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-surface-200 dark:border-surface-700">
                        <button className="text-xs text-surface-500 hover:text-surface-700">
                          👍 Helpful
                        </button>
                        <button className="text-xs text-surface-500 hover:text-surface-700">
                          👎 Not helpful
                        </button>
                        <button className="text-xs text-surface-500 hover:text-surface-700">
                          📋 Copy
                        </button>
                      </div>
                    )}
                  </div>

                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                      <span>👤</span>
                    </div>
                  )}
                </motion.div>
              ))}
              
              {/* Typing Indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center">
                    <span>🤖</span>
                  </div>
                  <div className="bg-surface-100 dark:bg-surface-800 rounded-2xl p-4">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-surface-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-surface-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-surface-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-surface-200 dark:border-surface-700">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask your doubt..."
                rows={1}
                className="input resize-none pr-12"
                style={{ minHeight: '48px', maxHeight: '120px' }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || sendMessageMutation.isPending}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-primary-500 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-600 transition-colors"
              >
                {sendMessageMutation.isPending ? (
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <p className="text-xs text-surface-500 mt-2 text-center">
            AI can make mistakes. Always verify important information.
          </p>
        </div>
      </div>
    </div>
  )
}

export default AIDoubtSolver

