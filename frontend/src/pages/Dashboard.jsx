import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../context/authStore'
import { analyticsService } from '../services/analyticsService'
import { contentService } from '../services/contentService'
import { quizService } from '../services/quizService'

// Components
import ProgressRing from '../components/common/ProgressRing'
import StreakFire from '../components/common/StreakFire'
import StatCard from '../components/common/StatCard'
import QuickActionButton from '../components/common/QuickActionButton'
import TopicMasteryChip from '../components/common/TopicMasteryChip'
import Loading from '../components/common/Loading'

const Dashboard = () => {
  const navigate = useNavigate()
  const { profile } = useAuthStore()

  // Fetch dashboard data
  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => analyticsService.getDashboardStats(),
  })

  const { data: studyPlan, isLoading: planLoading } = useQuery({
    queryKey: ['todayStudyPlan'],
    queryFn: () => contentService.getTodayStudyPlan(),
  })

  const { data: weakTopics } = useQuery({
    queryKey: ['weakTopics'],
    queryFn: () => analyticsService.getWeakTopics(),
  })

  const { data: dailyChallenge } = useQuery({
    queryKey: ['dailyChallenge'],
    queryFn: () => quizService.getDailyChallenge(),
  })

  if (statsLoading) return <Loading fullScreen />

  const stats = dashboardStats || {
    current_streak: 0,
    today: { study_time: 0, questions: 0, goal_progress: 0, goal_met: false },
    weekly: { study_time: 0, questions: 0, accuracy: 0, xp_earned: 0 },
    mastery: { total_topics: 0, mastered: 0, weak: 0, weak_topics: [] },
    profile: { total_xp: 0, level: 1, overall_accuracy: 0 }
  }

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">
            {greeting()}, {profile?.user?.first_name || 'Student'}! 👋
          </h1>
          <p className="text-surface-500 mt-1">
            Ready to crush your goals today?
          </p>
        </div>

        {/* Streak & Level */}
        <div className="flex items-center gap-4">
          {stats.current_streak > 0 && (
            <StreakFire streak={stats.current_streak} size="md" />
          )}
          <div className="text-center">
            <p className="text-sm text-surface-500">Level</p>
            <p className="text-2xl font-bold gradient-text">{stats.profile?.level || 1}</p>
          </div>
        </div>
      </div>

      {/* Today's Progress Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`card overflow-hidden relative ${stats.today.goal_met
            ? 'bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500'
            : 'bg-gradient-to-br from-primary-500 via-primary-600 to-accent-600'
          } text-white`}
      >
        {/* Animated Background for Goal Achieved */}
        {stats.today.goal_met ? (
          <>
            {/* Animated gradient overlay */}
            <motion.div
              animate={{
                backgroundPosition: ['0% 0%', '100% 100%'],
              }}
              transition={{ duration: 3, repeat: Infinity, repeatType: 'reverse' }}
              className="absolute inset-0 bg-gradient-to-br from-yellow-400/30 via-transparent to-pink-500/30"
              style={{ backgroundSize: '200% 200%' }}
            />

            {/* Floating particles */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  y: 100,
                  x: Math.random() * 100,
                  opacity: 0,
                  scale: 0
                }}
                animate={{
                  y: -20,
                  opacity: [0, 1, 1, 0],
                  scale: [0, 1, 1, 0.5]
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  delay: i * 0.2,
                  repeat: Infinity,
                  repeatDelay: Math.random() * 2
                }}
                className="absolute text-xl"
                style={{
                  left: `${5 + (i * 8)}%`,
                  bottom: 0
                }}
              >
                {['✨', '⭐', '🎉', '🌟', '💫', '🔥'][i % 6]}
              </motion.div>
            ))}

            {/* Glow effects */}
            <div className="absolute top-0 left-1/4 w-32 h-32 bg-yellow-300/40 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-40 h-40 bg-rose-400/30 rounded-full blur-3xl" />
          </>
        ) : (
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
          </div>
        )}

        <div className="relative z-10 p-6">
          {stats.today.goal_met ? (
            /* Celebration Layout */
            <>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/25 backdrop-blur-sm rounded-full mb-3"
                  >
                    <span className="text-lg">🏆</span>
                    <span className="font-bold text-sm">GOAL ACHIEVED!</span>
                  </motion.div>

                  <motion.h2
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-2xl font-bold mb-1"
                  >
                    Incredible Work! 🎉
                  </motion.h2>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-white/80"
                  >
                    You crushed your daily study goal. Keep this momentum going!
                  </motion.p>
                </div>

                {/* Trophy Animation */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', damping: 10 }}
                  className="relative"
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 bg-yellow-300/50 rounded-full blur-xl"
                  />
                  <div className="relative w-20 h-20 bg-gradient-to-br from-yellow-300 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
                    <span className="text-4xl">🏆</span>
                  </div>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="absolute -top-1 -right-1 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center text-xs font-bold shadow-lg"
                  >
                    ✓
                  </motion.div>
                </motion.div>
              </div>

              {/* Stats with icons */}
              <div className="grid grid-cols-3 gap-3">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/10"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">⏱️</span>
                    <p className="text-white/70 text-sm">Study Time</p>
                  </div>
                  <p className="text-2xl font-bold">{stats.today.study_time}m</p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/10"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">✍️</span>
                    <p className="text-white/70 text-sm">Questions</p>
                  </div>
                  <p className="text-2xl font-bold">{stats.today.questions}</p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/10"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">🎯</span>
                    <p className="text-white/70 text-sm">Accuracy</p>
                  </div>
                  <p className="text-2xl font-bold">{Math.round(stats.today.accuracy || 0)}%</p>
                </motion.div>
              </div>
            </>
          ) : (
            /* Regular Progress Layout */
            <>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-white/90">Today's Progress</h2>
                  <p className="text-white/70 text-sm">
                    {Math.round(stats.today.goal_progress)}% of daily goal
                  </p>
                </div>
                <ProgressRing
                  value={stats.today.goal_progress}
                  size={80}
                  strokeWidth={8}
                  color="#ffffff"
                  trailColor="rgba(255,255,255,0.2)"
                >
                  <span className="text-lg font-bold text-white">{Math.round(stats.today.goal_progress)}%</span>
                </ProgressRing>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <p className="text-white/70 text-sm">Study Time</p>
                  <p className="text-2xl font-bold">{stats.today.study_time}m</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <p className="text-white/70 text-sm">Questions</p>
                  <p className="text-2xl font-bold">{stats.today.questions}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <p className="text-white/70 text-sm">Accuracy</p>
                  <p className="text-2xl font-bold">{Math.round(stats.today.accuracy || 0)}%</p>
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickActionButton
            title="Daily Challenge"
            subtitle={dailyChallenge
              ? `${dailyChallenge.questions_count} questions • +${dailyChallenge.total_marks * 5} XP`
              : 'Take today\'s challenge'}
            icon="🎯"
            to="/quiz"
            variant="primary"
            badge={dailyChallenge ? "NEW" : null}
          />
          <QuickActionButton
            title="Resume Study"
            subtitle={studyPlan?.items?.[0]?.title || 'Start learning'}
            icon="📚"
            to="/study"
          />
          <QuickActionButton
            title="Mock Test"
            subtitle="Practice with full tests"
            icon="📝"
            to="/mock-test"
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Weekly XP"
          value={stats.weekly.xp_earned?.toLocaleString() || 0}
          icon="⚡"
          subtitle={`${stats.weekly.days_active || 0} active days`}
        />
        <StatCard
          title="Questions Done"
          value={stats.weekly.questions || 0}
          icon="✍️"
          subtitle="This week"
        />
        <StatCard
          title="Accuracy"
          value={`${Math.round(stats.weekly.accuracy || 0)}%`}
          icon="🎯"
          subtitle="Weekly average"
          variant={stats.weekly.accuracy >= 70 ? 'success' : stats.weekly.accuracy >= 50 ? 'warning' : 'default'}
        />
        <StatCard
          title="Topics Mastered"
          value={stats.mastery.mastered || 0}
          icon="👑"
          subtitle={`of ${stats.mastery.total_topics || 0} topics`}
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Study Plan */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Today's Study Plan</h3>
            <button
              onClick={() => navigate('/study')}
              className="text-sm text-primary-600 hover:underline"
            >
              View All
            </button>
          </div>

          {studyPlan?.items?.length > 0 ? (
            <div className="space-y-3">
              {studyPlan.items.slice(0, 3).map((item, index) => (
                <div
                  key={item.id || index}
                  onClick={() => navigate(`/study/${item.content_type}/${item.content_id}`)}
                  className="flex items-center gap-3 p-3 rounded-xl bg-surface-50 dark:bg-surface-800 hover:bg-surface-100 dark:hover:bg-surface-700 cursor-pointer transition-colors"
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.is_completed ? 'bg-success-100 dark:bg-success-900/30' : 'bg-primary-100 dark:bg-primary-900/30'
                    }`}>
                    <span className="text-lg">
                      {item.is_completed ? '✓' : item.icon || '📖'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium truncate ${item.is_completed ? 'line-through text-surface-400' : ''}`}>
                      {item.title}
                    </p>
                    <p className="text-xs text-surface-500">
                      {item.estimated_time || '15 min'} • {item.xp || 50} XP
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-surface-500">
              <p>No study plan for today</p>
              <button
                onClick={() => navigate('/study')}
                className="btn-primary mt-4"
              >
                Create Study Plan
              </button>
            </div>
          )}
        </div>

        {/* Weak Topics */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Topics to Revise</h3>
            <button
              onClick={() => navigate('/analytics')}
              className="text-sm text-primary-600 hover:underline"
            >
              View All
            </button>
          </div>

          {stats.mastery.weak_topics?.length > 0 ? (
            <div className="space-y-3">
              {stats.mastery.weak_topics.slice(0, 4).map((topic) => (
                <div
                  key={topic.id}
                  onClick={() => navigate(`/topic/${topic.id}`)}
                  className="flex items-center gap-3 p-3 rounded-xl bg-surface-50 dark:bg-surface-800 hover:bg-surface-100 dark:hover:bg-surface-700 cursor-pointer transition-colors"
                >
                  <div className="w-2 h-2 rounded-full bg-warning-500" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{topic.name}</p>
                    <p className="text-xs text-surface-500">
                      Level {topic.level} • Needs practice
                    </p>
                  </div>
                  <button className="btn-secondary text-xs px-3 py-1.5">
                    Practice
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-surface-500">
              <span className="text-4xl mb-2 block">🎉</span>
              <p>All topics are in good shape!</p>
              <p className="text-sm mt-1">Keep up the great work</p>
            </div>
          )}
        </div>
      </div>

      {/* AI Doubt Solver CTA */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        className="card p-6 bg-gradient-to-r from-accent-500 to-accent-600 text-white cursor-pointer"
        onClick={() => navigate('/doubt-solver')}
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
            <span className="text-3xl">🤖</span>
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold">AI Doubt Solver</h3>
            <p className="text-white/80">
              Stuck on a problem? Ask our AI tutor for instant help!
            </p>
          </div>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </motion.div>
    </div>
  )
}

export default Dashboard
