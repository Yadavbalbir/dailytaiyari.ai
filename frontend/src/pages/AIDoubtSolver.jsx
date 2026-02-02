import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { chatService } from '../services/chatService'
import Loading from '../components/common/Loading'
import toast from 'react-hot-toast'
import 'katex/dist/katex.min.css'

const AIDoubtSolver = () => {
  const queryClient = useQueryClient()
  const [input, setInput] = useState('')
  const [activeSession, setActiveSession] = useState(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [showSidebar, setShowSidebar] = useState(true)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const textareaRef = useRef(null)

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
  const { data: sessionData, isLoading: messagesLoading, refetch: refetchSession } = useQuery({
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

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [sessionData?.messages, streamingContent])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [input])

  // Focus input on session change
  useEffect(() => {
    inputRef.current?.focus()
  }, [activeSession])

  const handleNewChat = async () => {
    setActiveSession(null)
    setStreamingContent('')
    setInput('')
    inputRef.current?.focus()
  }

  const handleSend = useCallback(async () => {
    if (!input.trim() || isStreaming) return

    const message = input.trim()
    setInput('')
    setStreamingContent('')
    setIsStreaming(true)

    let sessionId = activeSession

    // Create session if none exists
    if (!sessionId) {
      try {
        const session = await createSessionMutation.mutateAsync({
          title: message.slice(0, 50),
        })
        sessionId = session.id
      } catch (error) {
        toast.error('Failed to create chat session')
        setIsStreaming(false)
        return
      }
    }

    // Optimistically add user message to UI
    const optimisticMessages = [
      ...(sessionData?.messages || []),
      { id: 'temp-user', role: 'user', content: message, created_at: new Date().toISOString() }
    ]

    // Use streaming API
    try {
      await chatService.sendMessageStream(
        sessionId,
        message,
        // onChunk - called for each chunk of content
        (chunk, fullContent) => {
          setStreamingContent(fullContent)
        },
        // onComplete - called when streaming is done
        async (data) => {
          setIsStreaming(false)
          setStreamingContent('')
          // Refetch the session to get the saved messages
          await refetchSession()
          queryClient.invalidateQueries(['chatSessions'])
        },
        // onError - called on error
        (error) => {
          setIsStreaming(false)
          setStreamingContent('')
          toast.error('Failed to get response. Please try again.')
          refetchSession()
        }
      )
    } catch (error) {
      setIsStreaming(false)
      setStreamingContent('')
      toast.error('Failed to send message')
    }
  }, [input, activeSession, isStreaming, sessionData, refetchSession, queryClient, createSessionMutation])

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFAQClick = async (question) => {
    setInput(question)
    setTimeout(() => handleSend(), 100)
  }

  const handleCopyMessage = (content) => {
    navigator.clipboard.writeText(content)
    toast.success('Copied to clipboard!')
  }

  const handleMarkHelpful = async (messageId, isHelpful) => {
    try {
      await chatService.markHelpful(messageId, isHelpful)
      toast.success(isHelpful ? 'Marked as helpful!' : 'Thanks for feedback')
    } catch (error) {
      toast.error('Failed to submit feedback')
    }
  }

  const messages = sessionData?.messages || []
  const sessionsList = sessions?.results || sessions || []

  // Suggested questions for empty state
  const suggestedQuestions = faqSuggestions?.length > 0 ? faqSuggestions : [
    { question: "Explain Newton's laws of motion with examples" },
    { question: "How to solve quadratic equations step by step?" },
    { question: "What is the structure and function of DNA?" },
    { question: "Explain the laws of thermodynamics" },
    { question: "What is electromagnetic induction?" },
    { question: "Explain periodic table trends" },
  ]

  return (
    <div className="flex h-[calc(100vh-8rem)] lg:h-[calc(100vh-6rem)] gap-4">
      {/* Sidebar Toggle for Mobile */}
      <button
        onClick={() => setShowSidebar(!showSidebar)}
        className="lg:hidden fixed left-4 top-20 z-50 btn-secondary p-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Sidebar - Chat History */}
      <AnimatePresence>
        {showSidebar && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className={`${
              showSidebar ? 'fixed lg:relative' : 'hidden'
            } left-0 top-0 h-full w-72 flex-shrink-0 z-40 lg:z-0`}
          >
            <div className="card h-full flex flex-col bg-white dark:bg-surface-900 shadow-xl lg:shadow-none">
              {/* Sidebar Header */}
              <div className="p-4 border-b border-surface-200 dark:border-surface-700">
                <button
                  onClick={handleNewChat}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Chat
                </button>
              </div>
              
              {/* Sessions List */}
              <div className="flex-1 overflow-y-auto p-2">
                {sessionsLoading ? (
                  <div className="flex justify-center p-4">
                    <Loading />
                  </div>
                ) : sessionsList.length === 0 ? (
                  <div className="text-center p-4 text-surface-500">
                    <p className="text-sm">No previous chats</p>
                    <p className="text-xs mt-1">Start a new conversation!</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {sessionsList.map((session) => (
                      <button
                        key={session.id}
                        onClick={() => {
                          setActiveSession(session.id)
                          setShowSidebar(false)
                        }}
                        className={`w-full text-left p-3 rounded-xl transition-all group ${
                          activeSession === session.id
                            ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                            : 'hover:bg-surface-100 dark:hover:bg-surface-800'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-lg mt-0.5">💬</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{session.title || 'New Chat'}</p>
                            <p className="text-xs text-surface-500 truncate mt-0.5">
                              {session.message_count || 0} messages
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Close button for mobile */}
              <button
                onClick={() => setShowSidebar(false)}
                className="lg:hidden absolute top-4 right-4 p-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Overlay */}
      {showSidebar && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col card overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-surface-200 dark:border-surface-700 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
            <span className="text-2xl">🤖</span>
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-lg">AI Doubt Solver</h2>
            <p className="text-xs text-surface-500 flex items-center gap-1">
              <span className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></span>
              Powered by GPT-4 • Ask any exam doubt
            </p>
          </div>
          {activeSession && (
            <button
              onClick={handleNewChat}
              className="btn-secondary text-sm"
            >
              New Chat
            </button>
          )}
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages.length === 0 && !isStreaming ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              {/* Hero Icon */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-6 shadow-2xl shadow-violet-500/30"
              >
                <span className="text-5xl">🎓</span>
              </motion.div>
              
              <motion.h3
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-2xl font-bold mb-3"
              >
                How can I help you today?
              </motion.h3>
              
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-surface-500 max-w-md mb-8"
              >
                I'm your AI tutor, ready to help with NEET, JEE, CBSE, or any competitive exam topics. 
                Ask me anything - from complex problems to simple concept explanations!
              </motion.p>
              
              {/* Suggested Questions */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="w-full max-w-2xl"
              >
                <p className="text-sm text-surface-400 mb-4">Try asking about:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {suggestedQuestions.slice(0, 6).map((faq, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + index * 0.05 }}
                      onClick={() => handleFAQClick(faq.question)}
                      className="p-4 text-left text-sm rounded-xl border-2 border-surface-200 dark:border-surface-700 hover:border-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all group"
                    >
                      <span className="flex items-start gap-2">
                        <span className="text-violet-500 group-hover:scale-110 transition-transform">💡</span>
                        <span>{faq.question}</span>
                      </span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
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
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md">
                      <span className="text-lg">🤖</span>
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[85%] lg:max-w-[75%] rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white px-5 py-3'
                        : 'bg-surface-100 dark:bg-surface-800 px-5 py-4'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-headings:my-3 prose-li:my-1 prose-pre:bg-surface-200 dark:prose-pre:bg-surface-900 prose-code:text-violet-600 dark:prose-code:text-violet-400">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm, remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    )}
                    
                    {message.role === 'assistant' && (
                      <div className="flex items-center gap-3 mt-4 pt-3 border-t border-surface-200 dark:border-surface-700">
                        <button 
                          onClick={() => handleMarkHelpful(message.id, true)}
                          className="flex items-center gap-1 text-xs text-surface-500 hover:text-success-500 transition-colors"
                        >
                          <span>👍</span> Helpful
                        </button>
                        <button 
                          onClick={() => handleMarkHelpful(message.id, false)}
                          className="flex items-center gap-1 text-xs text-surface-500 hover:text-error-500 transition-colors"
                        >
                          <span>👎</span> Not helpful
                        </button>
                        <button 
                          onClick={() => handleCopyMessage(message.content)}
                          className="flex items-center gap-1 text-xs text-surface-500 hover:text-primary-500 transition-colors"
                        >
                          <span>📋</span> Copy
                        </button>
                      </div>
                    )}
                  </div>

                  {message.role === 'user' && (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0 shadow-md">
                      <span className="text-lg">👤</span>
                    </div>
                  )}
                </motion.div>
              ))}
              
              {/* Streaming Response */}
              {isStreaming && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md">
                    <span className="text-lg">🤖</span>
                  </div>
                  <div className="max-w-[85%] lg:max-w-[75%] bg-surface-100 dark:bg-surface-800 rounded-2xl px-5 py-4">
                    {streamingContent ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm, remarkMath]}
                          rehypePlugins={[rehypeKatex]}
                        >
                          {streamingContent}
                        </ReactMarkdown>
                        <span className="inline-block w-2 h-5 bg-violet-500 animate-pulse ml-1"></span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-surface-500">Thinking</span>
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900">
          <div className="relative">
            <textarea
              ref={(el) => {
                textareaRef.current = el
                inputRef.current = el
              }}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your doubt here... (Shift+Enter for new line)"
              rows={1}
              disabled={isStreaming}
              className="input resize-none pr-14 min-h-[52px] max-h-[200px] py-3.5"
              style={{ height: 'auto' }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              className="absolute right-2 bottom-2 w-10 h-10 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-violet-500/25 transition-all"
            >
              {isStreaming ? (
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
          <div className="flex items-center justify-between mt-2 text-xs text-surface-500">
            <p>Press Enter to send, Shift+Enter for new line</p>
            <p>AI responses may contain errors. Verify important info.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AIDoubtSolver
