import { useState } from 'react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { analyticsService } from '../services/analyticsService'
import ProgressRing from '../components/common/ProgressRing'
import StatCard from '../components/common/StatCard'
import Loading from '../components/common/Loading'

const Analytics = () => {
  const [timeRange, setTimeRange] = useState(7)

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => analyticsService.getDashboardStats(),
  })

  const { data: chartData, isLoading: chartLoading } = useQuery({
    queryKey: ['chartData', timeRange],
    queryFn: () => analyticsService.getChartData(timeRange),
  })

  const { data: weakTopics } = useQuery({
    queryKey: ['weakTopics'],
    queryFn: () => analyticsService.getWeakTopics(),
  })

  const { data: strongTopics } = useQuery({
    queryKey: ['strongTopics'],
    queryFn: () => analyticsService.getStrongTopics(),
  })

  const { data: weeklyReport } = useQuery({
    queryKey: ['weeklyReport'],
    queryFn: () => analyticsService.getLatestReport(),
  })

  if (statsLoading) return <Loading fullScreen />

  const COLORS = ['#f97316', '#d946ef', '#10b981', '#3b82f6', '#f59e0b']

  // Mastery distribution data for pie chart
  const masteryData = [
    { name: 'Master', value: stats?.mastery?.mastered || 0, color: '#a855f7' },
    { name: 'Expert', value: 3, color: '#10b981' },
    { name: 'Proficient', value: 5, color: '#f59e0b' },
    { name: 'Developing', value: stats?.mastery?.weak || 0, color: '#f97316' },
    { name: 'Beginner', value: 2, color: '#ef4444' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold">Performance Analytics</h1>
          <p className="text-surface-500 mt-1">Track your progress and identify areas to improve</p>
        </div>
        
        {/* Time Range Selector */}
        <div className="flex gap-2">
          {[7, 14, 30].map((days) => (
            <button
              key={days}
              onClick={() => setTimeRange(days)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                timeRange === days
                  ? 'bg-primary-500 text-white'
                  : 'bg-surface-100 dark:bg-surface-800 hover:bg-surface-200'
              }`}
            >
              {days} Days
            </button>
          ))}
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Overall Accuracy"
          value={`${Math.round(stats?.profile?.overall_accuracy || 0)}%`}
          icon="🎯"
          variant={stats?.profile?.overall_accuracy >= 70 ? 'success' : 'default'}
        />
        <StatCard
          title="Questions Attempted"
          value={(stats?.profile?.total_questions || 0).toLocaleString()}
          icon="✍️"
        />
        <StatCard
          title="Study Time"
          value={`${Math.round((stats?.weekly?.study_time || 0) / 60)}h`}
          icon="⏱️"
          subtitle="This week"
        />
        <StatCard
          title="Topics Mastered"
          value={`${stats?.mastery?.mastered || 0}/${stats?.mastery?.total_topics || 0}`}
          icon="👑"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Accuracy Trend */}
        <div className="card p-5">
          <h3 className="font-semibold mb-4">Accuracy Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData || []}>
                <defs>
                  <linearGradient id="colorAccuracy" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis dataKey="labels" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: 'none', 
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="accuracy" 
                  stroke="#f97316" 
                  strokeWidth={3}
                  fill="url(#colorAccuracy)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Questions Per Day */}
        <div className="card p-5">
          <h3 className="font-semibold mb-4">Questions Per Day</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis dataKey="labels" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: 'none', 
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                />
                <Bar 
                  dataKey="questions" 
                  fill="#d946ef" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Topic Mastery Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mastery Distribution */}
        <div className="card p-5">
          <h3 className="font-semibold mb-4">Topic Mastery</h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={masteryData.filter(d => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {masteryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            {masteryData.filter(d => d.value > 0).map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-surface-500">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Weak Topics */}
        <div className="card p-5">
          <h3 className="font-semibold mb-4">Topics to Improve</h3>
          <div className="space-y-3">
            {(weakTopics || []).slice(0, 5).map((topic) => (
              <div key={topic.id} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-warning-500" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{topic.topic_name}</p>
                  <p className="text-xs text-surface-500">{topic.subject_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{Math.round(topic.accuracy_percentage)}%</p>
                  <p className="text-xs text-surface-500">Level {topic.mastery_level}</p>
                </div>
              </div>
            ))}
            {(!weakTopics || weakTopics.length === 0) && (
              <p className="text-center text-surface-500 py-4">🎉 No weak topics!</p>
            )}
          </div>
        </div>

        {/* Strong Topics */}
        <div className="card p-5">
          <h3 className="font-semibold mb-4">Your Strong Topics</h3>
          <div className="space-y-3">
            {(strongTopics || []).slice(0, 5).map((topic) => (
              <div key={topic.id} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-success-500" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{topic.topic_name}</p>
                  <p className="text-xs text-surface-500">{topic.subject_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-success-600">{Math.round(topic.accuracy_percentage)}%</p>
                  <p className="text-xs text-surface-500">Level {topic.mastery_level}</p>
                </div>
              </div>
            ))}
            {(!strongTopics || strongTopics.length === 0) && (
              <p className="text-center text-surface-500 py-4">Keep practicing!</p>
            )}
          </div>
        </div>
      </div>

      {/* Weekly Report */}
      {weeklyReport && (
        <div className="card p-6 bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20">
          <h3 className="font-semibold mb-4">📊 Weekly Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-surface-500">Study Time</p>
              <p className="text-2xl font-bold">{Math.round(weeklyReport.total_study_minutes / 60)}h</p>
            </div>
            <div>
              <p className="text-sm text-surface-500">Questions</p>
              <p className="text-2xl font-bold">{weeklyReport.questions_attempted}</p>
            </div>
            <div>
              <p className="text-sm text-surface-500">Accuracy</p>
              <p className="text-2xl font-bold">{Math.round(weeklyReport.accuracy)}%</p>
            </div>
            <div>
              <p className="text-sm text-surface-500">XP Earned</p>
              <p className="text-2xl font-bold text-primary-600">{weeklyReport.xp_earned}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Analytics

