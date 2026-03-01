import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { analyticsService } from '../services/analyticsService'
import {
    Users,
    GraduationCap,
    Zap,
    BarChart3,
    TrendingUp,
    CheckCircle2
} from 'lucide-react'

const StatCard = ({ title, value, icon: Icon, color, description }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6"
    >
        <div className="flex items-start justify-between">
            <div>
                <p className="text-sm font-medium text-surface-500 mb-1">{title}</p>
                <h3 className="text-3xl font-bold text-surface-900 dark:text-white">{value}</h3>
                {description && (
                    <p className="mt-2 text-sm text-surface-500">{description}</p>
                )}
            </div>
            <div className={`p-3 rounded-xl ${color}`}>
                <Icon className="w-6 h-6 text-white" />
            </div>
        </div>
    </motion.div>
)

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview')

    const { data: stats, isLoading, error } = useQuery({
        queryKey: ['tenantAdminStats'],
        queryFn: () => analyticsService.getTenantAdminStats(),
        refreshInterval: 60000, // Refresh every minute
    })

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="alert alert-error">
                Failed to load admin statistics. Please ensure you have administrator privileges.
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-surface-900 dark:text-white">Admin Dashboard</h1>
                    <p className="text-surface-500 mt-1">Manage your institution and track student performance</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="p-1 px-3 py-1.5 rounded-full bg-primary-50 dark:bg-primary-900/30 border border-primary-100 dark:border-primary-800 text-xs font-medium text-primary-600 dark:text-primary-400">
                        Active Tenant Access
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-surface-100 dark:bg-surface-800 rounded-xl w-fit">
                {['overview', 'students', 'performance'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab
                                ? 'bg-white dark:bg-surface-700 text-primary-600 dark:text-primary-400 shadow-sm'
                                : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
                            }`}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>

            {activeTab === 'overview' && (
                <div className="space-y-8">
                    {/* Main Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            title="Total Students"
                            value={stats?.total_students || 0}
                            icon={Users}
                            color="bg-blue-500"
                            description="Registered in your institution"
                        />
                        <StatCard
                            title="Active Today"
                            value={stats?.active_today || 0}
                            icon={Zap}
                            color="bg-amber-500"
                            description="Daily active users (DAU)"
                        />
                        <StatCard
                            title="Avg. Accuracy"
                            value={`${stats?.avg_accuracy || 0}%`}
                            icon={CheckCircle2}
                            color="bg-emerald-500"
                            description="Across all attempted quizzes"
                        />
                        <StatCard
                            title="Total XP Distributed"
                            value={stats?.total_xp?.toLocaleString() || 0}
                            icon={TrendingUp}
                            color="bg-purple-500"
                            description="Collective student progress"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Level Distribution */}
                        <div className="card p-6">
                            <h3 className="text-lg font-bold mb-6">Student Level Distribution</h3>
                            <div className="space-y-4">
                                {Object.entries(stats?.level_distribution || {}).map(([level, count]) => {
                                    const percentage = stats?.total_students > 0
                                        ? (count / stats.total_students) * 100
                                        : 0

                                    return (
                                        <div key={level} className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="font-medium text-surface-700 dark:text-surface-300">Level {level}</span>
                                                <span className="text-surface-500">{count} students ({Math.round(percentage)}%)</span>
                                            </div>
                                            <div className="h-2 bg-surface-100 dark:bg-surface-800 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${percentage}%` }}
                                                    className="h-full bg-primary-500"
                                                />
                                            </div>
                                        </div>
                                    )
                                })}
                                {Object.keys(stats?.level_distribution || {}).length === 0 && (
                                    <p className="text-center text-surface-500 py-8">No participation data yet.</p>
                                )}
                            </div>
                        </div>

                        {/* Performance Trend */}
                        <div className="card p-6">
                            <h3 className="text-lg font-bold mb-6">30-Day Active Students</h3>
                            <div className="h-64 flex items-end gap-1">
                                {stats?.activity_trend?.map((item, index) => {
                                    const maxUsers = Math.max(...stats.activity_trend.map(i => i.active_users), 1)
                                    const height = (item.active_users / maxUsers) * 100

                                    return (
                                        <div
                                            key={item.date}
                                            className="group relative flex-1"
                                        >
                                            <motion.div
                                                initial={{ height: 0 }}
                                                animate={{ height: `${height}%` }}
                                                className="bg-primary-400/30 group-hover:bg-primary-500 transition-colors rounded-t-sm"
                                            />
                                            {/* Tooltip */}
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-surface-900 text-white text-[10px] p-2 rounded shadow-xl z-10 whitespace-nowrap">
                                                {item.date}: {item.active_users} users
                                            </div>
                                        </div>
                                    )
                                })}
                                {(!stats?.activity_trend || stats.activity_trend.length === 0) && (
                                    <p className="w-full text-center text-surface-500 py-24">No trend data available.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'students' && (
                <div className="card p-8 text-center space-y-4">
                    <div className="w-16 h-16 bg-surface-100 dark:bg-surface-800 rounded-full flex items-center justify-center mx-auto">
                        <Users className="w-8 h-8 text-surface-400" />
                    </div>
                    <h3 className="text-xl font-bold">User Management coming soon</h3>
                    <p className="text-surface-500 max-w-md mx-auto">
                        We're building a powerful tool for you to manage student roles, verify accounts, and resetting progress.
                    </p>
                </div>
            )}

            {activeTab === 'performance' && (
                <div className="card p-8 text-center space-y-4">
                    <div className="w-16 h-16 bg-surface-100 dark:bg-surface-800 rounded-full flex items-center justify-center mx-auto">
                        <BarChart3 className="w-8 h-8 text-surface-400" />
                    </div>
                    <h3 className="text-xl font-bold">In-depth Reports coming soon</h3>
                    <p className="text-surface-500 max-w-md mx-auto">
                        Subject-wise breakdown and comparative analysis tools are under development.
                    </p>
                </div>
            )}
        </div>
    )
}

export default AdminDashboard
