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
          <StreakFire streak={stats.current_streak} size="md" />
          <div className="text-center">
            <p className="text-sm text-surface-500">Level</p>
            <p className="text-2xl font-bold gradient-text">{stats.profile.level}</p>
          </div>
        </div>
      </div>

      {/* Today's Progress Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6 bg-gradient-to-br from-primary-500 via-primary-600 to-accent-600 text-white overflow-hidden relative"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-white/90">Today's Progress</h2>
              <p className="text-white/70 text-sm">
                {stats.today.goal_met ? '🎉 Daily goal achieved!' : `${Math.round(stats.today.goal_progress)}% of daily goal`}
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
        </div>
      </motion.div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickActionButton
            title="Daily Challenge"
            subtitle="5 questions • +50 XP"
            icon="🎯"
            to="/quiz"
            variant="primary"
            badge="NEW"
          />
          <QuickActionButton
            title="Resume Study"
            subtitle={studyPlan?.items?.[0]?.title || 'Continue where you left off'}
            icon="📚"
            to="/study"
          />
          <QuickActionButton
            title="Mock Test"
            subtitle="Full-length practice test"
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
          subtitle="Keep it up!"
          trend="up"
          trendValue="+12%"
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
          trend={stats.weekly.accuracy >= 70 ? 'up' : 'down'}
          trendValue={stats.weekly.accuracy >= 70 ? 'Great!' : 'Improve'}
        />
        <StatCard
          title="Topics Mastered"
          value={stats.mastery.mastered || 0}
          icon="👑"
          subtitle={`of ${stats.mastery.total_topics} topics`}
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
          
          {planLoading ? (
            <Loading />
          ) : studyPlan?.items?.length > 0 ? (
            <div className="space-y-3">
              {studyPlan.items.slice(0, 4).map((item, index) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                    item.status === 'completed'
                      ? 'bg-success-50 dark:bg-success-900/20'
                      : item.status === 'in_progress'
                      ? 'bg-primary-50 dark:bg-primary-900/20'
                      : 'bg-surface-50 dark:bg-surface-800 hover:bg-surface-100 dark:hover:bg-surface-700 cursor-pointer'
                  }`}
                  onClick={() => item.status !== 'completed' && navigate('/study')}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    item.status === 'completed'
                      ? 'bg-success-500 text-white'
                      : 'bg-surface-200 dark:bg-surface-700'
                  }`}>
                    {item.status === 'completed' ? '✓' : index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium truncate ${
                      item.status === 'completed' ? 'line-through text-surface-400' : ''
                    }`}>
                      {item.title}
                    </p>
                    <p className="text-xs text-surface-500">
                      {item.estimated_minutes} min • {item.item_type}
                    </p>
                  </div>
                  {item.is_priority && (
                    <span className="badge-warning text-[10px]">Priority</span>
                  )}
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

