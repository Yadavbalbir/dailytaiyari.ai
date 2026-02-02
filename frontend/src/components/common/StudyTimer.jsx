import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { analyticsService } from '../../services/analyticsService'
import toast from 'react-hot-toast'
import confetti from 'canvas-confetti'

const StudyTimer = () => {
  const queryClient = useQueryClient()
  const [isExpanded, setIsExpanded] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [localElapsed, setLocalElapsed] = useState(0)
  const timerRef = useRef(null)
  const lastSaveRef = useRef(0)
  const isVisibleRef = useRef(true)
  const accumulatedTimeRef = useRef(0)
  
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
        // Trigger celebration!
        setShowCelebration(true)
        triggerCelebration(data.xp_awarded)
        
        // Invalidate queries to refresh dashboard
        queryClient.invalidateQueries(['dashboardStats'])
        queryClient.invalidateQueries(['studyTimer'])
      }
    },
  })

  // Start timer mutation  
  const startMutation = useMutation({
    mutationFn: () => analyticsService.startStudyTimer(),
  })

  // Pause timer mutation
  const pauseMutation = useMutation({
    mutationFn: () => analyticsService.pauseStudyTimer(),
  })

  // Format time display
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

  // Compact time format for minimized view
  const formatTimeCompact = (totalSeconds) => {
    const absSeconds = Math.abs(totalSeconds)
    const hours = Math.floor(absSeconds / 3600)
    const minutes = Math.floor((absSeconds % 3600) / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  // Trigger celebration effects
  const triggerCelebration = (xpAwarded) => {
    // Fire confetti
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

    // Hide celebration after animation
    setTimeout(() => setShowCelebration(false), 5000)
  }

  // Handle visibility change
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      // Page is hidden - pause timer
      isVisibleRef.current = false
      
      // Save accumulated time
      if (accumulatedTimeRef.current > 0) {
        updateMutation.mutate(accumulatedTimeRef.current)
        accumulatedTimeRef.current = 0
      }
      
      pauseMutation.mutate()
    } else {
      // Page is visible - resume timer
      isVisibleRef.current = true
      startMutation.mutate()
    }
  }, [])

  // Setup visibility listener
  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Also handle window blur/focus for when switching windows
    const handleBlur = () => {
      if (isVisibleRef.current) {
        handleVisibilityChange()
      }
    }
    
    const handleFocus = () => {
      if (!isVisibleRef.current) {
        isVisibleRef.current = true
        startMutation.mutate()
      }
    }
    
    window.addEventListener('blur', handleBlur)
    window.addEventListener('focus', handleFocus)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('blur', handleBlur)
      window.removeEventListener('focus', handleFocus)
    }
  }, [handleVisibilityChange])

  // Initialize timer when data loads
  useEffect(() => {
    if (timerData) {
      setLocalElapsed(timerData.total_seconds_today || 0)
      lastSaveRef.current = timerData.total_seconds_today || 0
      
      // Start session if not already active
      if (!timerData.is_active) {
        startMutation.mutate()
      }
    }
  }, [timerData])

  // Main timer loop
  useEffect(() => {
    if (!timerData) return

    timerRef.current = setInterval(() => {
      if (!isVisibleRef.current) return
      
      setLocalElapsed(prev => {
        const newValue = prev + 1
        accumulatedTimeRef.current += 1
        
        // Save to backend every 30 seconds
        if (accumulatedTimeRef.current >= 30) {
          updateMutation.mutate(accumulatedTimeRef.current)
          accumulatedTimeRef.current = 0
        }
        
        return newValue
      })
    }, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      // Save any remaining time on unmount
      if (accumulatedTimeRef.current > 0) {
        updateMutation.mutate(accumulatedTimeRef.current)
      }
    }
  }, [timerData])

  // Save on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (accumulatedTimeRef.current > 0) {
        // Use sendBeacon for reliable delivery
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

  // Determine color scheme based on state
  const getColorScheme = () => {
    if (exceededGoal) return {
      bg: 'bg-success-500',
      text: 'text-white',
      border: 'border-success-600',
      progressBg: 'bg-success-300',
      progressFill: 'bg-white',
    }
    if (timerData.goal_achieved) return {
      bg: 'bg-success-100 dark:bg-success-900/50',
      text: 'text-success-700 dark:text-success-300',
      border: 'border-success-300 dark:border-success-700',
      progressBg: 'bg-success-200 dark:bg-success-800',
      progressFill: 'bg-success-500',
    }
    return {
      bg: 'bg-white dark:bg-surface-800',
      text: 'text-surface-800 dark:text-surface-200',
      border: 'border-surface-200 dark:border-surface-700',
      progressBg: 'bg-surface-200 dark:bg-surface-700',
      progressFill: 'bg-primary-500',
    }
  }

  const colors = getColorScheme()

  return (
    <>
      {/* Collapsed Timer Badge - positioned to not obstruct content */}
      <AnimatePresence>
        {!isExpanded && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsExpanded(true)}
            className={`fixed bottom-4 right-4 z-40 flex items-center gap-2 px-3 py-2 rounded-full shadow-lg border-2 transition-colors ${colors.bg} ${colors.text} ${colors.border}`}
          >
            <span className={exceededGoal ? 'animate-pulse' : ''}>
              {exceededGoal ? '🔥' : timerData.goal_achieved ? '✅' : '⏱️'}
            </span>
            <span className="font-semibold text-sm font-mono">
              {exceededGoal 
                ? `+${formatTimeCompact(overageSeconds)}`
                : timerData.goal_achieved 
                ? formatTimeCompact(localElapsed)
                : formatTimeCompact(remainingSeconds)
              }
            </span>
            {/* Mini progress arc/indicator */}
            <div className={`w-6 h-6 rounded-full ${colors.progressBg} relative overflow-hidden`}>
              <div 
                className={`absolute bottom-0 left-0 right-0 ${colors.progressFill} transition-all duration-500`}
                style={{ height: `${Math.min(progressPercent, 100)}%` }}
              />
            </div>
            <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Expanded Timer Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-4 right-4 z-40 w-72"
          >
            <div className={`card shadow-xl border-2 ${
              exceededGoal 
                ? 'border-success-500 bg-gradient-to-br from-success-50 to-white dark:from-success-900/20 dark:to-surface-900' 
                : timerData.goal_achieved
                ? 'border-success-400 bg-white dark:bg-surface-900'
                : 'border-primary-200 bg-white dark:bg-surface-900'
            }`}>
              {/* Header with collapse button */}
              <div className="flex items-center justify-between p-3 border-b border-surface-100 dark:border-surface-800">
                <div className="flex items-center gap-2">
                  <span className={`text-lg ${exceededGoal ? 'animate-pulse' : ''}`}>
                    {exceededGoal ? '🔥' : timerData.goal_achieved ? '✅' : '⏱️'}
                  </span>
                  <span className="font-semibold text-sm">
                    {exceededGoal ? 'Excellent Progress!' : timerData.goal_achieved ? 'Goal Achieved!' : 'Study Timer'}
                  </span>
                </div>
                <button 
                  onClick={() => setIsExpanded(false)}
                  className="p-1.5 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors"
                  aria-label="Minimize timer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="p-4 space-y-4">
                {/* Main Timer Display */}
                <div className="text-center">
                  {exceededGoal ? (
                    <>
                      <div className="text-xs text-success-600 font-medium mb-1">
                        +{formatTime(overageSeconds)} beyond goal!
                      </div>
                      <div className="text-3xl font-bold font-mono text-success-600">
                        {formatTime(localElapsed)}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-xs text-surface-500 mb-1">
                        {timerData.goal_achieved ? 'Time studied' : 'Time remaining'}
                      </div>
                      <div className={`text-3xl font-bold font-mono ${
                        remainingSeconds < 300 && !timerData.goal_achieved
                          ? 'text-warning-500 animate-pulse' 
                          : timerData.goal_achieved 
                          ? 'text-success-500'
                          : 'text-surface-900 dark:text-white'
                      }`}>
                        {timerData.goal_achieved 
                          ? formatTime(localElapsed)
                          : formatTime(Math.max(0, remainingSeconds))
                        }
                      </div>
                    </>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-surface-500">
                    <span>{formatTime(localElapsed)}</span>
                    <span>Goal: {formatTime(goalSeconds)}</span>
                  </div>
                  <div className="h-2.5 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${
                        exceededGoal 
                          ? 'bg-gradient-to-r from-success-500 to-success-400'
                          : timerData.goal_achieved
                          ? 'bg-success-500'
                          : progressPercent > 75
                          ? 'bg-gradient-to-r from-warning-500 to-primary-500'
                          : 'bg-gradient-to-r from-primary-500 to-accent-500'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(progressPercent, 100)}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <div className="text-center text-xs font-medium">
                    {exceededGoal ? (
                      <span className="text-success-600">
                        {Math.round((localElapsed / goalSeconds) * 100)}% of goal!
                      </span>
                    ) : (
                      <span className={timerData.goal_achieved ? 'text-success-600' : 'text-surface-600'}>
                        {Math.round(progressPercent)}% complete
                      </span>
                    )}
                  </div>
                </div>

                {/* Motivational Message */}
                <div className={`text-center text-xs py-2 px-3 rounded-lg ${
                  exceededGoal 
                    ? 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400'
                    : timerData.goal_achieved
                    ? 'bg-success-50 dark:bg-success-900/20 text-success-600'
                    : 'bg-primary-50 dark:bg-primary-900/20 text-primary-600'
                }`}>
                  {exceededGoal ? (
                    <span>🌟 You're on fire! Keep going!</span>
                  ) : timerData.goal_achieved ? (
                    <span>🎉 Great job! Keep going to exceed your target.</span>
                  ) : remainingSeconds < 300 ? (
                    <span>💪 Almost there! Just {formatTime(remainingSeconds)} to go!</span>
                  ) : (
                    <span>📚 Stay focused! You're making progress.</span>
                  )}
                </div>

                {/* Status Indicator */}
                <div className="flex items-center justify-center gap-2 text-xs">
                  <span className={`w-2 h-2 rounded-full ${
                    isVisibleRef.current ? 'bg-success-500 animate-pulse' : 'bg-surface-400'
                  }`}></span>
                  <span className="text-surface-500">
                    {isVisibleRef.current ? 'Timer running' : 'Timer paused'}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Celebration Overlay */}
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
              className="text-center pointer-events-auto"
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0]
                }}
                transition={{ 
                  duration: 0.5,
                  repeat: 3
                }}
                className="text-8xl mb-4"
              >
                🎉
              </motion.div>
              <h2 className="text-4xl font-bold text-white drop-shadow-lg mb-2">
                Goal Achieved!
              </h2>
              <p className="text-xl text-white/90 drop-shadow">
                Keep up the amazing work!
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default StudyTimer
