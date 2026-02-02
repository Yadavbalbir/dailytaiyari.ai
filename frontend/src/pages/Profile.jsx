import { useState } from 'react'
import { motion } from 'framer-motion'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../context/authStore'
import { useAppStore } from '../context/appStore'
import { analyticsService } from '../services/analyticsService'
import toast from 'react-hot-toast'

const Profile = () => {
  const { user, profile, updateProfile, logout } = useAuthStore()
  const { darkMode, toggleDarkMode } = useAppStore()
  const queryClient = useQueryClient()
  
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    daily_study_goal_minutes: profile?.daily_study_goal_minutes || 60,
    preferred_study_time: profile?.preferred_study_time || 'evening',
  })

  const updateGoalMutation = useMutation({
    mutationFn: (goalMinutes) => analyticsService.updateStudyGoal(goalMinutes),
    onSuccess: () => {
      queryClient.invalidateQueries(['studyTimer'])
    },
  })

  const handleSave = async () => {
    // Update study goal separately
    if (formData.daily_study_goal_minutes !== profile?.daily_study_goal_minutes) {
      await updateGoalMutation.mutateAsync(formData.daily_study_goal_minutes)
    }
    
    const result = await updateProfile(formData)
    if (result.success) {
      toast.success('Profile updated!')
      setIsEditing(false)
    } else {
      toast.error('Failed to update profile')
    }
  }

  const studyTimes = [
    { value: 'morning', label: 'Morning', icon: '🌅' },
    { value: 'afternoon', label: 'Afternoon', icon: '☀️' },
    { value: 'evening', label: 'Evening', icon: '🌆' },
    { value: 'night', label: 'Night', icon: '🌙' },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile Card */}
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white text-3xl font-bold">
            {user?.first_name?.charAt(0) || 'U'}
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold">{user?.full_name || 'Student'}</h1>
            <p className="text-surface-500">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="badge-primary">Level {profile?.current_level || 1}</span>
              <span className="badge-success">{profile?.total_xp?.toLocaleString() || 0} XP</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800">
            <p className="text-2xl font-bold">{profile?.total_questions_attempted || 0}</p>
            <p className="text-sm text-surface-500">Questions</p>
          </div>
          <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800">
            <p className="text-2xl font-bold">{Math.round(profile?.overall_accuracy || 0)}%</p>
            <p className="text-sm text-surface-500">Accuracy</p>
          </div>
          <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800">
            <p className="text-2xl font-bold">{Math.round((profile?.total_study_time_minutes || 0) / 60)}h</p>
            <p className="text-sm text-surface-500">Study Time</p>
          </div>
        </div>
      </div>

      {/* Study Preferences */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Study Preferences</h2>
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className="btn-secondary text-sm">
              Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setIsEditing(false)} className="btn-secondary text-sm">
                Cancel
              </button>
              <button onClick={handleSave} className="btn-primary text-sm">
                Save
              </button>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Daily Study Goal */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Daily Study Goal
            </label>
            <div className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">⏱️</span>
                  <div>
                    <p className="text-2xl font-bold">{formData.daily_study_goal_minutes} min</p>
                    <p className="text-sm text-surface-500">
                      {Math.floor(formData.daily_study_goal_minutes / 60)}h {formData.daily_study_goal_minutes % 60}m per day
                    </p>
                  </div>
                </div>
                {!isEditing && (
                  <span className={`badge ${
                    formData.daily_study_goal_minutes >= 120 ? 'badge-success' :
                    formData.daily_study_goal_minutes >= 60 ? 'badge-primary' : 'badge-warning'
                  }`}>
                    {formData.daily_study_goal_minutes >= 120 ? '🔥 Intense' :
                     formData.daily_study_goal_minutes >= 60 ? '💪 Committed' : '📚 Beginner'}
                  </span>
                )}
              </div>
              
              {isEditing ? (
                <div className="space-y-3">
                  <input
                    type="range"
                    min="15"
                    max="240"
                    step="15"
                    value={formData.daily_study_goal_minutes}
                    onChange={(e) => setFormData({ ...formData, daily_study_goal_minutes: parseInt(e.target.value) })}
                    className="w-full accent-primary-500 h-3 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-surface-500">
                    <span>15 min</span>
                    <span>1 hour</span>
                    <span>2 hours</span>
                    <span>3 hours</span>
                    <span>4 hours</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 mt-3">
                    {[30, 60, 90, 120].map((mins) => (
                      <button
                        key={mins}
                        onClick={() => setFormData({ ...formData, daily_study_goal_minutes: mins })}
                        className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                          formData.daily_study_goal_minutes === mins
                            ? 'bg-primary-500 text-white'
                            : 'bg-surface-200 dark:bg-surface-700 hover:bg-primary-100 dark:hover:bg-primary-900/30'
                        }`}
                      >
                        {mins} min
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-3 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full"
                    style={{ width: `${(formData.daily_study_goal_minutes / 240) * 100}%` }}
                  />
                </div>
              )}
            </div>
            <p className="text-xs text-surface-500 mt-2">
              💡 Tip: Start with a smaller goal and gradually increase it. Consistency is key!
            </p>
          </div>

          {/* Preferred Study Time */}
          <div>
            <label className="block text-sm font-medium mb-3">Preferred Study Time</label>
            <div className="grid grid-cols-2 gap-3">
              {studyTimes.map((time) => (
                <button
                  key={time.value}
                  onClick={() => isEditing && setFormData({ ...formData, preferred_study_time: time.value })}
                  disabled={!isEditing}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    formData.preferred_study_time === time.value
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-surface-200 dark:border-surface-700'
                  } ${isEditing ? 'cursor-pointer hover:border-primary-300' : 'cursor-default'}`}
                >
                  <span className="mr-2">{time.icon}</span>
                  {time.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* App Settings */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-6">App Settings</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Dark Mode</p>
              <p className="text-sm text-surface-500">Toggle dark theme</p>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`w-14 h-8 rounded-full transition-colors ${
                darkMode ? 'bg-primary-500' : 'bg-surface-300'
              }`}
            >
              <motion.div
                className="w-6 h-6 bg-white rounded-full shadow"
                animate={{ x: darkMode ? 28 : 4 }}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Notifications</p>
              <p className="text-sm text-surface-500">Study reminders & updates</p>
            </div>
            <button className="w-14 h-8 rounded-full bg-primary-500">
              <motion.div className="w-6 h-6 bg-white rounded-full shadow ml-7" />
            </button>
          </div>
        </div>
      </div>

      {/* Account Actions */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-6">Account</h2>
        
        <div className="space-y-3">
          <button className="w-full text-left p-4 rounded-xl border border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors">
            <p className="font-medium">Change Password</p>
            <p className="text-sm text-surface-500">Update your password</p>
          </button>
          
          <button className="w-full text-left p-4 rounded-xl border border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors">
            <p className="font-medium">Manage Subscription</p>
            <p className="text-sm text-surface-500">View plan details</p>
          </button>
          
          <button 
            onClick={() => {
              logout()
              window.location.href = '/login'
            }}
            className="w-full text-left p-4 rounded-xl border border-error-200 dark:border-error-800 hover:bg-error-50 dark:hover:bg-error-900/20 text-error-600 transition-colors"
          >
            <p className="font-medium">Sign Out</p>
            <p className="text-sm text-error-400">Log out of your account</p>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Profile

