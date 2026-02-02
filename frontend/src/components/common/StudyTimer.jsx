import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence, useDragControls } from 'framer-motion'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { analyticsService } from '../../services/analyticsService'
import toast from 'react-hot-toast'
import confetti from 'canvas-confetti'

// View modes: 'minimal' (tiny dot), 'compact' (small badge), 'expanded' (full panel)
const STORAGE_KEY = 'studyTimerPrefs'

const StudyTimer = () => {
  const queryClient = useQueryClient()
  const dragControls = useDragControls()
  const constraintsRef = useRef(null)
  
  // Load saved preferences
  const getSavedPrefs = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) return JSON.parse(saved)
    } catch (e) {}
    return { mode: 'compact', position: { x: 0, y: 0 } }
  }
  
  const [viewMode, setViewMode] = useState(() => getSavedPrefs().mode)
  const [position, setPosition] = useState(() => getSavedPrefs().position)
  const [showCelebration, setShowCelebration] = useState(false)
  const [localElapsed, setLocalElapsed] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const timerRef = useRef(null)
  const isVisibleRef = useRef(true)
  const accumulatedTimeRef = useRef(0)
  
  // Save preferences when they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ mode: viewMode, position }))
  }, [viewMode, position])
  
  // Fetch initial timer state
  const { data: timerData, isLoading } = useQuery({
    queryKey: ['studyTimer'],
    queryFn: () => analyticsService.getStudyTimer(),
    refetchOnWindowFocus: false,
  })

  // Update timer mutation
  const updateMutation = useMutation({
    mutationFn: (seconds) => analyticsService.updateStudyTimer(seconds),
    onSuccess: (data) => {
      if (data.goal_just_achieved) {
        setShowCelebration(true)
        triggerCelebration(data.xp_awarded)
        queryClient.invalidateQueries(['dashboardStats'])
        queryClient.invalidateQueries(['studyTimer'])
      }
    },
  })

  const startMutation = useMutation({
    mutationFn: () => analyticsService.startStudyTimer(),
  })

  const pauseMutation = useMutation({
    mutationFn: () => analyticsService.pauseStudyTimer(),
  })

  // Format time
  const formatTime = (totalSeconds) => {
    const absSeconds = Math.abs(totalSeconds)
    const hours = Math.floor(absSeconds / 3600)
    const minutes = Math.floor((absSeconds % 3600) / 60)
    const seconds = absSeconds % 60
    
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    }
    return `${minutes}:${String(seconds).padStart(2, '0')}`
  }

  const formatTimeShort = (totalSeconds) => {
    const absSeconds = Math.abs(totalSeconds)
    const hours = Math.floor(absSeconds / 3600)
    const minutes = Math.floor((absSeconds % 3600) / 60)
    if (hours > 0) return `${hours}h${minutes}m`
    return `${minutes}m`
  }

  // Celebration effect
  const triggerCelebration = (xpAwarded) => {
    const duration = 3000
    const end = Date.now() + duration

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#6366f1', '#8b5cf6', '#10b981']
      })
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#6366f1', '#8b5cf6', '#10b981']
      })

      if (Date.now() < end) {
        requestAnimationFrame(frame)
      }
    }
    frame()

    toast.success(`🎉 Daily goal achieved! +${xpAwarded} XP`, {
      duration: 5000,
      icon: '🏆',
    })

    setTimeout(() => setShowCelebration(false), 5000)
  }

  // Visibility handling
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      isVisibleRef.current = false
      if (accumulatedTimeRef.current > 0) {
        updateMutation.mutate(accumulatedTimeRef.current)
        accumulatedTimeRef.current = 0
      }
      pauseMutation.mutate()
    } else {
      isVisibleRef.current = true
      startMutation.mutate()
    }
  }, [])

  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('blur', () => isVisibleRef.current && handleVisibilityChange())
    window.addEventListener('focus', () => {
      if (!isVisibleRef.current) {
        isVisibleRef.current = true
        startMutation.mutate()
      }
    })
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [handleVisibilityChange])

  // Initialize timer
  useEffect(() => {
    if (timerData) {
      setLocalElapsed(timerData.total_seconds_today || 0)
      if (!timerData.is_active) {
        startMutation.mutate()
      }
    }
  }, [timerData])

  // Timer loop
  useEffect(() => {
    if (!timerData) return

    timerRef.current = setInterval(() => {
      if (!isVisibleRef.current) return
      
      setLocalElapsed(prev => {
        accumulatedTimeRef.current += 1
        if (accumulatedTimeRef.current >= 30) {
          updateMutation.mutate(accumulatedTimeRef.current)
          accumulatedTimeRef.current = 0
        }
        return prev + 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (accumulatedTimeRef.current > 0) {
        updateMutation.mutate(accumulatedTimeRef.current)
      }
    }
  }, [timerData])

  // Save on unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (accumulatedTimeRef.current > 0) {
        const data = JSON.stringify({ elapsed_seconds: accumulatedTimeRef.current })
        navigator.sendBeacon('/api/analytics/study-timer/', data)
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  if (isLoading || !timerData) return null

  const goalSeconds = timerData.goal_seconds || 3600
  const remainingSeconds = goalSeconds - localElapsed
  const progressPercent = Math.min((localElapsed / goalSeconds) * 100, 100)
  const exceededGoal = localElapsed > goalSeconds
  const overageSeconds = exceededGoal ? localElapsed - goalSeconds : 0

  // Get status info
  const getStatus = () => {
    if (exceededGoal) return { emoji: '🔥', color: 'success', label: 'Excellent!' }
    if (timerData.goal_achieved) return { emoji: '✅', color: 'success', label: 'Done!' }
    if (remainingSeconds < 300) return { emoji: '⚡', color: 'warning', label: 'Almost!' }
    return { emoji: '⏱️', color: 'primary', label: 'Study' }
  }

  const status = getStatus()
  
  const handleDragEnd = (event, info) => {
    setPosition({ x: info.point.x, y: info.point.y })
  }

  // Color classes based on status
  const getColors = () => {
    if (exceededGoal || timerData.goal_achieved) {
      return {
        bg: 'bg-success-500',
        bgLight: 'bg-success-100 dark:bg-success-900/50',
        text: 'text-white',
        textDark: 'text-success-700 dark:text-success-300',
        border: 'border-success-400',
        ring: 'ring-success-400/50',
      }
    }
    return {
      bg: 'bg-primary-500',
      bgLight: 'bg-white dark:bg-surface-800',
      text: 'text-white',
      textDark: 'text-surface-700 dark:text-surface-300',
      border: 'border-primary-300 dark:border-surface-600',
      ring: 'ring-primary-400/50',
    }
  }

  const colors = getColors()

  return (
    <>
      {/* Drag constraints container (full screen) */}
      <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-30" />
      
      {/* Timer Widget */}
      <motion.div
        drag
        dragMomentum={false}
        dragConstraints={constraintsRef}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed bottom-6 right-6 z-40 cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'none' }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <AnimatePresence mode="wait">
          {/* MINIMAL MODE - Tiny floating dot */}
          {viewMode === 'minimal' && (
            <motion.div
              key="minimal"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="relative group"
            >
              <button
                onClick={() => setViewMode('expanded')}
                className={`w-10 h-10 rounded-full ${colors.bg} shadow-lg flex items-center justify-center text-lg hover:scale-110 transition-transform ring-4 ${colors.ring}`}
              >
                {status.emoji}
              </button>
              
              {/* Progress ring */}
              <svg className="absolute inset-0 w-10 h-10 -rotate-90 pointer-events-none" viewBox="0 0 40 40">
                <circle
                  cx="20"
                  cy="20"
                  r="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-white/30"
                />
                <circle
                  cx="20"
                  cy="20"
                  r="18"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray={`${progressPercent * 1.13} 113`}
                  className="text-white"
                />
              </svg>

              {/* Expand button on hover */}
              <AnimatePresence>
                {isHovered && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={(e) => { e.stopPropagation(); setViewMode('compact'); }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-white dark:bg-surface-800 rounded-full shadow-md flex items-center justify-center text-xs border border-surface-200 dark:border-surface-600 hover:bg-surface-100"
                    title="Compact view"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                    </svg>
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Tooltip on hover */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, y: 5, x: '-50%' }}
                    animate={{ opacity: 1, y: 0, x: '-50%' }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute bottom-full left-1/2 mb-2 px-2 py-1 bg-surface-900 text-white text-xs rounded-lg whitespace-nowrap shadow-lg"
                  >
                    {exceededGoal 
                      ? `+${formatTimeShort(overageSeconds)} extra!` 
                      : timerData.goal_achieved 
                      ? `${formatTimeShort(localElapsed)} studied`
                      : `${formatTimeShort(remainingSeconds)} left`
                    }
                    <span className="ml-1 opacity-60">• Click to expand</span>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-surface-900" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* COMPACT MODE - Small badge */}
          {viewMode === 'compact' && (
            <motion.div
              key="compact"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full shadow-lg border ${colors.bgLight} ${colors.border} hover:shadow-xl transition-shadow`}
            >
              {/* Minimize button */}
              <button
                onClick={() => setViewMode('minimal')}
                className="text-sm hover:scale-110 transition-transform"
                title="Minimize"
              >
                {status.emoji}
              </button>
              
              {/* Time - click to expand */}
              <button
                onClick={() => setViewMode('expanded')}
                className={`font-mono font-semibold text-sm ${colors.textDark} hover:underline`}
                title="Click to expand"
              >
                {exceededGoal 
                  ? `+${formatTimeShort(overageSeconds)}`
                  : timerData.goal_achieved 
                  ? formatTimeShort(localElapsed)
                  : formatTimeShort(remainingSeconds)
                }
              </button>
              
              {/* Tiny progress bar */}
              <div className="w-8 h-1.5 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${exceededGoal || timerData.goal_achieved ? 'bg-success-500' : 'bg-primary-500'}`}
                  style={{ width: `${Math.min(progressPercent, 100)}%` }}
                />
              </div>
              
              {/* Expand button */}
              <button
                onClick={() => setViewMode('expanded')}
                className="p-0.5 hover:bg-surface-200 dark:hover:bg-surface-700 rounded transition-colors"
                title="Expand"
              >
                <svg className="w-3.5 h-3.5 text-surface-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
            </motion.div>
          )}

          {/* EXPANDED MODE - Full panel */}
          {viewMode === 'expanded' && (
            <motion.div
              key="expanded"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-64 bg-white dark:bg-surface-900 rounded-2xl shadow-2xl border border-surface-200 dark:border-surface-700 overflow-hidden"
            >
              {/* Header */}
              <div 
                className={`px-4 py-3 ${exceededGoal ? 'bg-success-500' : timerData.goal_achieved ? 'bg-success-100 dark:bg-success-900/50' : 'bg-primary-50 dark:bg-primary-900/20'} flex items-center justify-between`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{status.emoji}</span>
                  <span className={`font-semibold text-sm ${exceededGoal ? 'text-white' : colors.textDark}`}>
                    {status.label}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {/* Compact button */}
                  <button 
                    onClick={() => setViewMode('compact')}
                    className={`p-1.5 rounded hover:bg-black/10 transition-colors ${exceededGoal ? 'text-white' : 'text-surface-600'}`}
                    title="Compact view"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {/* Minimize button */}
                  <button 
                    onClick={() => setViewMode('minimal')}
                    className={`p-1.5 rounded hover:bg-black/10 transition-colors ${exceededGoal ? 'text-white' : 'text-surface-600'}`}
                    title="Minimize to dot"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                {/* Time display */}
                <div className="text-center">
                  <div className="text-xs text-surface-500 mb-1">
                    {exceededGoal ? 'Beyond goal' : timerData.goal_achieved ? 'Total studied' : 'Remaining'}
                  </div>
                  <div className={`text-2xl font-bold font-mono ${
                    exceededGoal || timerData.goal_achieved ? 'text-success-600' : ''
                  }`}>
                    {exceededGoal 
                      ? `+${formatTime(overageSeconds)}`
                      : timerData.goal_achieved 
                      ? formatTime(localElapsed)
                      : formatTime(Math.max(0, remainingSeconds))
                    }
                  </div>
                </div>

                {/* Progress */}
                <div>
                  <div className="flex justify-between text-xs text-surface-500 mb-1">
                    <span>{formatTimeShort(localElapsed)}</span>
                    <span>{formatTimeShort(goalSeconds)} goal</span>
                  </div>
                  <div className="h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${
                        exceededGoal || timerData.goal_achieved ? 'bg-success-500' : 'bg-primary-500'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(progressPercent, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center justify-center gap-2 text-xs text-surface-500">
                  <span className={`w-1.5 h-1.5 rounded-full ${isVisibleRef.current ? 'bg-success-500 animate-pulse' : 'bg-surface-400'}`} />
                  <span>{isVisibleRef.current ? 'Active' : 'Paused'}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Celebration */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="text-center"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: 3 }}
                className="text-7xl mb-4"
              >
                🎉
              </motion.div>
              <h2 className="text-3xl font-bold text-white drop-shadow-lg">
                Goal Achieved!
              </h2>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default StudyTimer
