import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { chatService } from '../services/chatService'
import Loading from '../components/common/Loading'
import MathRenderer from '../components/chat/MathRenderer'
import ChatQuiz from '../components/chat/ChatQuiz'
import toast from 'react-hot-toast'
import {
  Bot,
  MessageSquare,
  Send,
  Plus,
  X,
  Maximize2,
  Minimize2,
  Menu,
  Copy,
  ThumbsUp,
  ThumbsDown,
  User,
  GraduationCap,
  Lightbulb,
  FileText,
  Search,
  ChevronLeft
} from 'lucide-react'

/**
 * Detects if the message contains a quiz format and extracts it
 */
const parseQuizFromMessage = (content) => {
  if (!content) return null

  // Try to find JSON quiz block
  const jsonMatch = content.match(/```json\s*(\{[\s\S]*?"type"\s*:\s*"quiz"[\s\S]*?\})\s*```/i)
  if (jsonMatch) {
    try {
      const quiz = JSON.parse(jsonMatch[1])
      if (quiz.type === 'quiz' && quiz.questions) {
        return {
          quiz,
          remainingContent: content.replace(jsonMatch[0], '').trim()
        }
      }
    } catch (e) {
      // JSON parse failed, continue to other detection methods
    }
  }

  // Parse structured quiz format
  const lines = content.split('\n')
  const questions = []
  let currentQuestion = null
  let currentOptions = []
  let currentExplanation = ''
  let correctAnswer = null
  let introText = []
  let isInQuiz = false

  const saveCurrentQuestion = () => {
    if (currentQuestion && currentOptions.length >= 2) {
      let correctIndex = -1
      if (correctAnswer) {
        correctIndex = correctAnswer.toUpperCase().charCodeAt(0) - 65
      }
      if (correctIndex === -1 || correctIndex >= currentOptions.length) {
        correctIndex = currentOptions.findIndex(o => o.isCorrect)
      }
      if (correctIndex === -1) correctIndex = 0

      questions.push({
        question: currentQuestion,
        options: currentOptions.map(o => o.text),
        correct_option: correctIndex,
        explanation: currentExplanation.trim() || null,
        difficulty: 'medium'
      })
    }
    currentQuestion = null
    currentOptions = []
    currentExplanation = ''
    correctAnswer = null
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const questionMatch = line.match(/^\*{0,2}Q(?:uestion)?\.?\s*(\d+)[\.\):\s]+\*{0,2}\s*(.+)/i) ||
      line.match(/^(\d+)[\.\)]\s+(.+)/)

    if (questionMatch && !line.match(/^[A-Da-d][\.\)]/)) {
      saveCurrentQuestion()
      isInQuiz = true
      currentQuestion = questionMatch[2].trim().replace(/\*+/g, '')
      continue
    }

    const optionMatch = line.match(/^\*{0,2}([A-Da-d])[\.\):\s]+\*{0,2}\s*(.+)/i)
    if (optionMatch && currentQuestion) {
      const optionLetter = optionMatch[1].toUpperCase()
      let optionText = optionMatch[2].trim()

      const isCorrect = optionText.includes('✓') ||
        optionText.toLowerCase().includes('(correct)') ||
        optionText.includes('✔') ||
        /\*{2}correct\*{2}/i.test(optionText)

      optionText = optionText
        .replace(/[✓✔]/g, '')
        .replace(/\*{0,2}\(correct\)\*{0,2}/gi, '')
        .replace(/\*{2}correct\*{2}/gi, '')
        .trim()

      currentOptions.push({
        letter: optionLetter,
        text: optionText,
        isCorrect
      })
      continue
    }

    const answerMatch = line.match(/^\*{0,2}(?:Correct\s+)?Answer\*{0,2}[:\s]+\*{0,2}([A-Da-d])\)?/i)
    if (answerMatch && currentQuestion) {
      correctAnswer = answerMatch[1].toUpperCase()
      continue
    }

    const explanationMatch = line.match(/^\*{0,2}(?:Explanation|Solution|Reason)\*{0,2}[:\s]+(.+)/i)
    if (explanationMatch && currentQuestion) {
      currentExplanation = explanationMatch[1].trim()
      while (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim()
        if (!nextLine ||
          nextLine.match(/^\*{0,2}Q(?:uestion)?\.?\s*\d+/i) ||
          nextLine.match(/^\d+[\.\)]\s+/) ||
          nextLine.match(/^\*{0,2}(?:Correct\s+)?Answer\*{0,2}[:\s]/i)) {
          break
        }
        i++
        currentExplanation += ' ' + nextLine
      }
      continue
    }

    if (!isInQuiz) {
      introText.push(line)
    }
  }

  saveCurrentQuestion()

  if (questions.length >= 1) {
    return {
      quiz: {
        type: 'quiz',
        title: 'Practice Quiz',
        questions
      },
      remainingContent: introText.join('\n').trim()
    }
  }

  return null
}

const AIDoubtSolver = () => {
  const queryClient = useQueryClient()
  const [input, setInput] = useState('')
  const [activeSession, setActiveSession] = useState(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [pendingUserMessage, setPendingUserMessage] = useState(null) // For optimistic UI
  const [showSidebar, setShowSidebar] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)
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

  // Smooth scroll to bottom (only scroll container, not the page)
  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [])

  // Auto-scroll on new messages (debounced to prevent flickering)
  useEffect(() => {
    const timeout = setTimeout(scrollToBottom, 50)
    return () => clearTimeout(timeout)
  }, [sessionData?.messages, streamingContent, scrollToBottom])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`
    }
  }, [input])

  // Focus input on session change
  useEffect(() => {
    inputRef.current?.focus()
  }, [activeSession])

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFullscreen])

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

    // Optimistically show user message immediately
    setPendingUserMessage({
      id: 'pending-user-' + Date.now(),
      role: 'user',
      content: message,
      created_at: new Date().toISOString()
    })

    let sessionId = activeSession

    if (!sessionId) {
      try {
        const session = await createSessionMutation.mutateAsync({
          title: message.slice(0, 50),
        })
        sessionId = session.id
      } catch (error) {
        toast.error('Failed to create chat session')
        setIsStreaming(false)
        setPendingUserMessage(null)
        return
      }
    }

    try {
      await chatService.sendMessageStream(
        sessionId,
        message,
        (chunk, fullContent) => {
          setStreamingContent(fullContent)
        },
        async (data) => {
          setIsStreaming(false)
          setStreamingContent('')
          setPendingUserMessage(null) // Clear pending message
          await refetchSession()
          queryClient.invalidateQueries(['chatSessions'])
        },
        (error) => {
          setIsStreaming(false)
          setStreamingContent('')
          setPendingUserMessage(null)
          toast.error('Failed to get response. Please try again.')
          refetchSession()
        }
      )
    } catch (error) {
      setIsStreaming(false)
      setStreamingContent('')
      setPendingUserMessage(null)
      toast.error('Failed to send message')
    }
  }, [input, activeSession, isStreaming, refetchSession, queryClient, createSessionMutation])

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

  const renderMessageContent = (content, isStreamingMsg = false) => {
    // Don't parse quiz during streaming - just show a loading placeholder
    if (isStreamingMsg) {
      // Check if content looks like it might be a quiz (to show appropriate loading state)
      const looksLikeQuiz = /^\*{0,2}Q(?:uestion)?\.?\s*\d+/im.test(content) ||
        /^\d+[\.\)]\s+.+\n.*[A-D][\.\)]/m.test(content)

      if (looksLikeQuiz) {
        // Show a quiz loading indicator instead of revealing answers
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="font-medium">Generating quiz questions...</span>
            </div>
            <div className="bg-violet-50 dark:bg-violet-900/20 rounded-xl p-4 border border-violet-200 dark:border-violet-800">
              <div className="flex items-center gap-3 text-sm text-violet-700 dark:text-violet-300">
                <FileText size={24} />
                <div>
                  <p className="font-medium">Interactive quiz loading</p>
                  <p className="text-xs opacity-70">Questions will appear shortly...</p>
                </div>
              </div>
            </div>
          </div>
        )
      }

      // For non-quiz content during streaming, render normally
      return <MathRenderer content={content} />
    }

    // After streaming is complete, parse and render quiz if present
    const quizData = parseQuizFromMessage(content)

    if (quizData) {
      return (
        <div className="space-y-4">
          {quizData.remainingContent && (
            <MathRenderer content={quizData.remainingContent} />
          )}
          <ChatQuiz
            quiz={quizData.quiz}
            sessionId={activeSession}
            onComplete={(result) => {
              // Refresh queries when quiz is completed
              queryClient.invalidateQueries(['dashboardStats'])
            }}
          />
        </div>
      )
    }

    return <MathRenderer content={content} />
  }

  const messages = sessionData?.messages || []

  // Filter out any message that matches the pending user message to prevent duplicates
  // This handles the case where the server returns the user message before we clear pendingUserMessage
  const filteredMessages = pendingUserMessage
    ? messages.filter(m => !(m.role === 'user' && m.content === pendingUserMessage.content))
    : messages

  const sessionsList = sessions?.results || sessions || []

  const suggestedQuestions = faqSuggestions?.length > 0 ? faqSuggestions : [
    { question: "Explain Newton's laws of motion with examples" },
    { question: "How to solve quadratic equations step by step?" },
    { question: "What is the structure and function of DNA?" },
    { question: "Give me 5 practice questions on thermodynamics" },
    { question: "Quiz me on electromagnetic induction" },
    { question: "Create a practice test on periodic table trends" },
  ]

  // Container classes for fullscreen/normal mode
  const containerClasses = isFullscreen
    ? 'fixed inset-0 z-50 bg-white dark:bg-surface-900 flex'
    : 'flex h-[calc(100vh-8rem)] lg:h-[calc(100vh-6rem)] gap-4'

  return (
    <div className={containerClasses}>
      {/* Sidebar Toggle for Mobile */}
      {!isFullscreen && (
        <button
          onClick={() => setShowSidebar(!showSidebar)}
          className="lg:hidden fixed left-4 top-20 z-50 btn-secondary p-2"
        >
          <Menu size={20} />
        </button>
      )}

      {/* Sidebar - Chat History */}
      <AnimatePresence>
        {showSidebar && !isFullscreen && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className="fixed lg:relative left-0 top-0 h-full w-72 flex-shrink-0 z-40 lg:z-0"
          >
            <div className="card h-full flex flex-col bg-white dark:bg-surface-900 shadow-xl lg:shadow-none">
              <div className="p-4 border-b border-surface-200 dark:border-surface-700">
                <button
                  onClick={handleNewChat}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <Plus size={18} />
                  New Chat
                </button>
              </div>

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
                        className={`w-full text-left p-3 rounded-xl transition-all group ${activeSession === session.id
                          ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                          : 'hover:bg-surface-100 dark:hover:bg-surface-800'
                          }`}
                      >
                        <div className="flex items-start gap-2">
                          <MessageSquare size={18} className="mt-1" />
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

              <button
                onClick={() => setShowSidebar(false)}
                className="lg:hidden absolute top-4 right-4 p-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Overlay */}
      {showSidebar && !isFullscreen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col overflow-hidden ${isFullscreen ? '' : 'card'}`}>
        {/* Header - Fixed height */}
        <div className="flex-shrink-0 h-[72px] p-4 border-b border-surface-200 dark:border-surface-700 flex items-center gap-3 bg-white dark:bg-surface-900">
          {isFullscreen && (
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="btn-icon mr-2"
            >
              <Menu size={20} />
            </button>
          )}

          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25 flex-shrink-0">
            <Bot size={24} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-base truncate">AI Doubt Solver</h2>
            <p className="text-xs text-surface-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-success-500 rounded-full animate-pulse"></span>
              GPT-4 • Ask doubts or request quizzes
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {activeSession && (
              <button
                onClick={handleNewChat}
                className="btn-secondary text-sm hidden sm:flex items-center gap-1"
              >
                <Plus size={16} />
                New
              </button>
            )}

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="btn-icon"
              title={isFullscreen ? 'Exit fullscreen (Esc)' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
          </div>
        </div>

        {/* Messages Area - Flex grow with fixed overflow */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto overscroll-contain"
          style={{ minHeight: 0 }} // Important for flex child scrolling
        >
          <div className="p-4 space-y-6">
            {filteredMessages.length === 0 && !isStreaming && !pendingUserMessage ? (
              <div className="flex flex-col items-center justify-center text-center px-4 py-12">
                {/* Hero Icon */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-6 shadow-xl shadow-violet-500/30"
                >
                  <GraduationCap size={40} className="text-white" />
                </motion.div>

                <motion.h3
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-xl font-bold mb-2"
                >
                  How can I help you today?
                </motion.h3>

                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-surface-500 max-w-md mb-8 text-sm"
                >
                  Ask about NEET or JEE topics, or say{' '}
                  <span className="font-semibold text-violet-600">"Quiz me on..."</span> for interactive practice!
                </motion.p>

                {/* Suggested Questions */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="w-full max-w-xl"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {suggestedQuestions.slice(0, 6).map((faq, index) => (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + index * 0.05 }}
                        onClick={() => handleFAQClick(faq.question)}
                        className="p-3 text-left text-sm rounded-xl border border-surface-200 dark:border-surface-700 hover:border-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all"
                      >
                        <span className="flex items-start gap-2">
                          <span className="text-violet-500 mt-1 flex-shrink-0">
                            {faq.question.toLowerCase().includes('quiz') || faq.question.toLowerCase().includes('practice') ? <FileText size={16} /> : <Lightbulb size={16} />}
                          </span>
                          <span className="line-clamp-2">{faq.question}</span>
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              </div>
            ) : (
              <>
                {/* Render existing messages */}
                {filteredMessages.map((message, index) => (
                  <div
                    key={message.id || index}
                    className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md">
                        <Bot size={18} className="text-white" />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] lg:max-w-[75%] rounded-2xl ${message.role === 'user'
                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white px-4 py-3'
                        : 'bg-surface-100 dark:bg-surface-800 px-4 py-3'
                        }`}
                    >
                      {message.role === 'assistant' ? (
                        <>
                          {renderMessageContent(message.content)}
                          <div className="flex items-center gap-3 mt-3 pt-2 border-t border-surface-200 dark:border-surface-700">
                            <button
                              onClick={() => handleMarkHelpful(message.id, true)}
                              className="flex items-center gap-1 text-xs text-surface-500 hover:text-success-500 transition-colors"
                            >
                              <ThumbsUp size={14} /> Helpful
                            </button>
                            <button
                              onClick={() => handleMarkHelpful(message.id, false)}
                              className="flex items-center gap-1 text-xs text-surface-500 hover:text-error-500 transition-colors"
                            >
                              <ThumbsDown size={14} />
                            </button>
                            <button
                              onClick={() => handleCopyMessage(message.content)}
                              className="flex items-center gap-1 text-xs text-surface-500 hover:text-primary-500 transition-colors"
                            >
                              <Copy size={14} /> Copy
                            </button>
                          </div>
                        </>
                      ) : (
                        <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                      )}
                    </div>

                    {message.role === 'user' && (
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0 shadow-md">
                        <User size={18} className="text-white" />
                      </div>
                    )}
                  </div>
                ))}

                {/* Render pending user message (optimistic UI) */}
                {pendingUserMessage && (
                  <div className="flex gap-3 justify-end">
                    <div className="max-w-[85%] lg:max-w-[75%] rounded-2xl bg-gradient-to-r from-primary-500 to-primary-600 text-white px-4 py-3">
                      <p className="whitespace-pre-wrap text-sm">{pendingUserMessage.content}</p>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0 shadow-md">
                      <User size={18} className="text-white" />
                    </div>
                  </div>
                )}

                {/* Streaming Response */}
                {isStreaming && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md">
                      <Bot size={18} className="text-white" />
                    </div>
                    <div className="max-w-[85%] lg:max-w-[75%] bg-surface-100 dark:bg-surface-800 rounded-2xl px-4 py-3">
                      {streamingContent ? (
                        <div>
                          {renderMessageContent(streamingContent, true)}
                          <span className="inline-block w-1.5 h-4 bg-violet-500 animate-pulse ml-0.5 align-middle"></span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 py-1">
                          <span className="text-surface-500 text-sm">Thinking</span>
                          <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} className="h-4" />
              </>
            )}
          </div>
        </div>

        {/* Input Area - Fixed height */}
        <div className="flex-shrink-0 p-4 border-t border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900">
          <div className="relative">
            <textarea
              ref={(el) => {
                textareaRef.current = el
                inputRef.current = el
              }}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your doubt or 'Quiz me on [topic]'..."
              rows={1}
              disabled={isStreaming}
              className="input resize-none pr-12 min-h-[44px] max-h-[150px] py-3 text-sm"
              style={{ height: 'auto' }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              className="absolute right-2 bottom-2 w-8 h-8 rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-violet-500/25 transition-all"
            >
              {isStreaming ? (
                <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
              ) : (
                <Send size={16} />
              )}
            </button>
          </div>
          <div className="flex items-center justify-between mt-1.5 text-xs text-surface-400">
            <p className="flex items-center gap-1"><Lightbulb size={12} /> "Quiz me on [topic]" for practice</p>
            <p className="hidden sm:block">Enter to send • Shift+Enter for new line</p>
          </div>
        </div>
      </div>

      {/* Fullscreen Sidebar */}
      <AnimatePresence>
        {isFullscreen && showSidebar && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowSidebar(false)}
            />
            <motion.div
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              className="fixed left-0 top-0 h-full w-72 z-50 bg-white dark:bg-surface-900 shadow-2xl flex flex-col"
            >
              <div className="p-4 border-b border-surface-200 dark:border-surface-700 flex items-center justify-between">
                <h3 className="font-semibold">Chat History</h3>
                <button
                  onClick={() => setShowSidebar(false)}
                  className="btn-icon"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-4 border-b border-surface-200 dark:border-surface-700">
                <button
                  onClick={() => { handleNewChat(); setShowSidebar(false); }}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <Plus size={18} />
                  New Chat
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-2">
                {sessionsList.length === 0 ? (
                  <div className="text-center p-4 text-surface-500">
                    <p className="text-sm">No previous chats</p>
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
                        className={`w-full text-left p-3 rounded-xl transition-all ${activeSession === session.id
                          ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                          : 'hover:bg-surface-100 dark:hover:bg-surface-800'
                          }`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-lg">💬</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{session.title || 'New Chat'}</p>
                            <p className="text-xs text-surface-500 mt-0.5">
                              {session.message_count || 0} messages
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AIDoubtSolver
