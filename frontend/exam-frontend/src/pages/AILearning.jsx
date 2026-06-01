import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { chatService } from '../services/chatService'
import Loading from '../components/common/Loading'
import {
  Bot,
  MessageSquare,
  Zap,
  FileText,
  Target,
  Flame,
  BarChart3,
  BookOpen,
  RefreshCw,
  TrendingUp,
  Book,
  PartyPopper,
  ThumbsUp,
  Trophy,
  CheckCircle2,
  XCircle,
  Lightbulb,
  ChevronRight
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'

const AILearning = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedTopic, setSelectedTopic] = useState(null)

  // Fetch AI learning stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['aiLearningStats'],
    queryFn: () => chatService.getAILearningStats(),
  })

  // Fetch AI quiz history
  const { data: quizHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['aiQuizHistory'],
    queryFn: () => chatService.getAIQuizzes(),
  })

  // Fetch wrong questions for revision
  const { data: wrongQuestions, isLoading: wrongLoading } = useQuery({
    queryKey: ['wrongQuestions', selectedTopic],
    queryFn: () => chatService.getWrongQuestions(selectedTopic),
  })

  if (statsLoading) return <Loading fullScreen />

  const quizzes = quizHistory?.results || quizHistory || []
  const topicData = Object.entries(stats?.topic_performance || {}).map(([topic, data]) => ({
    topic,
    accuracy: data.attempted > 0 ? Math.round((data.correct / data.attempted) * 100) : 0,
    quizzes: data.quizzes || 0,
    questions: data.attempted || 0
  }))

  const accuracyDistribution = [
    { name: 'Perfect (100%)', value: stats?.perfect_quizzes || 0, color: '#a855f7' },
    { name: 'Great (80%+)', value: (stats?.quizzes_above_80 || 0) - (stats?.perfect_quizzes || 0), color: '#10b981' },
    { name: 'Good (60-79%)', value: Math.max(0, (stats?.total_quizzes_attempted || 0) - (stats?.quizzes_above_80 || 0)), color: '#f59e0b' },
  ].filter(d => d.value > 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-3">
            <Bot size={28} className="text-primary-500" />
            AI Learning Progress
          </h1>
          <p className="text-surface-500 mt-1">Track your AI-assisted learning journey</p>
        </div>
        <button
          onClick={() => navigate('/ai-doubt-solver')}
          className="btn-primary flex items-center gap-2"
        >
          <MessageSquare size={18} />
          Start AI Quiz
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-4 text-center"
        >
          <div className="text-3xl font-bold text-primary-600">{stats?.total_xp_earned || 0}</div>
          <div className="text-sm text-surface-500 mt-1">AI XP Earned</div>
          <div className="text-xs text-primary-500 mt-1 flex items-center justify-center gap-1">
            <Zap size={12} /> From AI quizzes
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-4 text-center"
        >
          <div className="text-3xl font-bold text-success-600">{stats?.total_quizzes_attempted || 0}</div>
          <div className="text-sm text-surface-500 mt-1">Quizzes Taken</div>
          <div className="text-xs text-success-500 mt-1 flex items-center justify-center gap-1">
            <FileText size={12} /> AI-generated
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-4 text-center"
        >
          <div className="text-3xl font-bold text-warning-600">{Math.round(stats?.average_accuracy || 0)}%</div>
          <div className="text-sm text-surface-500 mt-1">Avg Accuracy</div>
          <div className="text-xs text-warning-500 mt-1 flex items-center justify-center gap-1">
            <Target size={12} /> Overall
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-4 text-center"
        >
          <div className="text-3xl font-bold text-violet-600">{stats?.current_quiz_streak || 0}</div>
          <div className="text-sm text-surface-500 mt-1">Day Streak</div>
          <div className="text-xs text-violet-500 mt-1 flex items-center justify-center gap-1">
            <Flame size={12} /> Best: {stats?.longest_quiz_streak || 0}
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-surface-200 dark:border-surface-700">
        {[
          { id: 'overview', label: 'Overview', icon: <BarChart3 size={18} /> },
          { id: 'history', label: 'Quiz History', icon: <FileText size={18} /> },
          { id: 'topics', label: 'Topics', icon: <BookOpen size={18} /> },
          { id: 'revision', label: 'Revision', icon: <RefreshCw size={18} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium transition-colors relative ${activeTab === tab.id
                ? 'text-primary-600'
                : 'text-surface-500 hover:text-surface-900'
              }`}
          >
            <span className="flex items-center gap-2">
              <span>{tab.icon}</span>
              {tab.label}
            </span>
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500"
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid md:grid-cols-2 gap-6"
          >
            {/* Accuracy Distribution */}
            <div className="card p-6">
              <h3 className="font-semibold mb-4">Quiz Performance</h3>
              {accuracyDistribution.length > 0 ? (
                <div className="flex items-center gap-6">
                  <div className="w-40 h-40">
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={accuracyDistribution}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={60}
                        >
                          {accuracyDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    {accuracyDistribution.map((item) => (
                      <div key={item.name} className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span>{item.name}</span>
                        <span className="font-semibold ml-auto">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-surface-500">
                  <div className="flex justify-center mb-2 text-surface-300">
                    <FileText size={48} />
                  </div>
                  <p>No quizzes taken yet</p>
                  <p className="text-sm mt-1">Ask the AI for a quiz to get started!</p>
                </div>
              )}
            </div>

            {/* Strong & Weak Topics */}
            <div className="card p-6">
              <h3 className="font-semibold mb-4">Topic Insights</h3>
              <div className="space-y-4">
                {stats?.strong_topics?.length > 0 && (
                  <div>
                    <h4 className="text-sm text-success-600 font-medium mb-2 flex items-center gap-1.5">
                      <TrendingUp size={16} /> Strong Topics
                    </h4>
                    <div className="space-y-2">
                      {stats.strong_topics.slice(0, 3).map((t) => (
                        <div key={t.topic} className="flex items-center justify-between p-2 bg-success-50 dark:bg-success-900/20 rounded-lg">
                          <span className="text-sm">{t.topic}</span>
                          <span className="text-sm font-semibold text-success-600">{t.accuracy}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {stats?.weak_topics?.length > 0 && (
                  <div>
                    <h4 className="text-sm text-error-600 font-medium mb-2 flex items-center gap-1.5">
                      <Book size={16} /> Need Practice
                    </h4>
                    <div className="space-y-2">
                      {stats.weak_topics.slice(0, 3).map((t) => (
                        <div key={t.topic} className="flex items-center justify-between p-2 bg-error-50 dark:bg-error-900/20 rounded-lg">
                          <span className="text-sm">{t.topic}</span>
                          <span className="text-sm font-semibold text-error-600">{t.accuracy}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!stats?.strong_topics?.length && !stats?.weak_topics?.length && (
                  <div className="text-center py-4 text-surface-500">
                    <p className="text-sm">Complete more quizzes to see topic insights</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="card p-6 md:col-span-2">
              <h3 className="font-semibold mb-4">Recent AI Quizzes</h3>
              {stats?.recent_activity?.length > 0 ? (
                <div className="space-y-3">
                  {stats.recent_activity.slice(0, 5).map((quiz) => (
                    <div
                      key={quiz.id}
                      className="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-800 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${quiz.percentage >= 80 ? 'bg-success-100 text-success-600' :
                            quiz.percentage >= 60 ? 'bg-warning-100 text-warning-600' :
                              'bg-error-100 text-error-600'
                          }`}>
                          {quiz.percentage >= 80 ? <PartyPopper size={20} /> : quiz.percentage >= 60 ? <ThumbsUp size={20} /> : <BookOpen size={20} />}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{quiz.quiz_topic || 'General Quiz'}</p>
                          <p className="text-xs text-surface-500">
                            {quiz.correct_answers}/{quiz.total_questions} correct • {new Date(quiz.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${quiz.percentage >= 80 ? 'text-success-600' :
                            quiz.percentage >= 60 ? 'text-warning-600' :
                              'text-error-600'
                          }`}>
                          {Math.round(quiz.percentage)}%
                        </p>
                        <p className="text-xs text-violet-600">+{quiz.xp_earned} XP</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-surface-500">
                  <p>No recent quizzes</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {historyLoading ? (
              <Loading />
            ) : quizzes.length > 0 ? (
              quizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="card p-4 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/ai-quiz-review/${quiz.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${quiz.percentage >= 80 ? 'bg-success-100 text-success-600' :
                          quiz.percentage >= 60 ? 'bg-warning-100 text-warning-600' :
                            'bg-error-100 text-error-600'
                        }`}>
                        {quiz.percentage >= 80 ? <Trophy size={24} /> : quiz.percentage >= 60 ? <CheckCircle2 size={24} /> : <Book size={24} />}
                      </div>
                      <div>
                        <h3 className="font-semibold">{quiz.quiz_topic || 'AI Quiz'}</h3>
                        <p className="text-sm text-surface-500">
                          {quiz.quiz_subject && `${quiz.quiz_subject} • `}
                          {quiz.total_questions} questions • {Math.floor(quiz.time_taken_seconds / 60)}m {quiz.time_taken_seconds % 60}s
                        </p>
                        <p className="text-xs text-surface-400 mt-1">
                          {new Date(quiz.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${quiz.percentage >= 80 ? 'text-success-600' :
                          quiz.percentage >= 60 ? 'text-warning-600' :
                            'text-error-600'
                        }`}>
                        {Math.round(quiz.percentage)}%
                      </p>
                      <p className="text-sm text-surface-500">
                        {quiz.correct_answers}/{quiz.total_questions}
                      </p>
                      <p className="text-xs text-violet-600 font-semibold">+{quiz.xp_earned} XP</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="flex justify-center mb-4 text-surface-300">
                  <FileText size={64} />
                </div>
                <h3 className="text-xl font-semibold mb-2">No AI Quizzes Yet</h3>
                <p className="text-surface-500 mb-4">
                  Ask the AI doubt solver to "quiz me on [topic]" to get started!
                </p>
                <button
                  onClick={() => navigate('/ai-doubt-solver')}
                  className="btn-primary"
                >
                  Start AI Quiz
                </button>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'topics' && (
          <motion.div
            key="topics"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {topicData.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {topicData.sort((a, b) => b.quizzes - a.quizzes).map((topic) => (
                  <div
                    key={topic.topic}
                    className="card p-4 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => setSelectedTopic(topic.topic)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">{topic.topic}</h3>
                      <span className={`text-lg font-bold ${topic.accuracy >= 80 ? 'text-success-600' :
                          topic.accuracy >= 60 ? 'text-warning-600' :
                            'text-error-600'
                        }`}>
                        {topic.accuracy}%
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${topic.accuracy >= 80 ? 'bg-success-500' :
                              topic.accuracy >= 60 ? 'bg-warning-500' :
                                'bg-error-500'
                            }`}
                          style={{ width: `${topic.accuracy}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-surface-500">
                        <span>{topic.quizzes} quizzes</span>
                        <span>{topic.questions} questions</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="flex justify-center mb-4 text-surface-300">
                  <BookOpen size={64} />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Topics Yet</h3>
                <p className="text-surface-500">
                  Complete AI quizzes on different topics to see your progress here.
                </p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'revision' && (
          <motion.div
            key="revision"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="card p-4 bg-gradient-to-r from-violet-500 to-purple-600 text-white">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <RefreshCw size={20} /> Smart Revision
              </h3>
              <p className="text-sm text-white/80">
                Review questions you got wrong. Practice makes perfect!
              </p>
            </div>

            {wrongLoading ? (
              <Loading />
            ) : wrongQuestions?.length > 0 ? (
              <div className="space-y-4">
                {wrongQuestions.map((q, idx) => (
                  <div key={q.id} className="card p-4">
                    <div className="flex items-start justify-between mb-3">
                      <span className="px-2 py-1 bg-error-100 text-error-700 rounded-lg text-xs font-medium">
                        {q.quiz_topic || 'General'}
                      </span>
                      <span className="text-xs text-surface-500">
                        {new Date(q.attempted_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="font-medium mb-3">{q.question_text}</p>
                    <div className="space-y-2">
                      {q.options.map((opt, optIdx) => (
                        <div
                          key={optIdx}
                          className={`p-2 rounded-lg text-sm ${optIdx === q.correct_option
                              ? 'bg-success-100 border border-success-300 text-success-800'
                              : optIdx === q.user_answer
                                ? 'bg-error-100 border border-error-300 text-error-800'
                                : 'bg-surface-50 dark:bg-surface-800'
                            }`}
                        >
                          <span className="font-semibold mr-2">
                            {String.fromCharCode(65 + optIdx)}.
                          </span>
                          {opt}
                          {optIdx === q.correct_option && (
                            <span className="ml-2 text-success-600 flex items-center gap-1 inline-flex">
                              <CheckCircle2 size={14} /> Correct
                            </span>
                          )}
                          {optIdx === q.user_answer && optIdx !== q.correct_option && (
                            <span className="ml-2 text-error-600 flex items-center gap-1 inline-flex">
                              <XCircle size={14} /> Your answer
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                    {q.explanation && (
                      <div className="mt-3 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                        <p className="text-sm text-primary-800 dark:text-primary-200 flex items-start gap-2">
                          <Lightbulb size={16} className="mt-0.5 shrink-0" />
                          <span><span className="font-semibold">Explanation:</span> {q.explanation}</span>
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="flex justify-center mb-4 text-success-400">
                  <PartyPopper size={64} />
                </div>
                <h3 className="text-xl font-semibold mb-2">All Caught Up!</h3>
                <p className="text-surface-500">
                  No wrong answers to revise. Keep up the great work!
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AILearning

