import { useState, useEffect } from 'react'
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
  const [activeSection, setActiveSection] = useState(null) // Track which section is being edited
  const [formData, setFormData] = useState({
    // Personal info
    date_of_birth: profile?.date_of_birth || '',
    bio: profile?.bio || '',
    instagram_handle: profile?.instagram_handle || '',
    parent_phone: profile?.parent_phone || '',
    // Academic info
    grade: profile?.grade || '',
    school: profile?.school || '',
    coaching: profile?.coaching || '',
    board: profile?.board || '',
    medium: profile?.medium || 'english',
    target_year: profile?.target_year || '',
    // Location
    city: profile?.city || '',
    state: profile?.state || '',
    // Study preferences
    daily_study_goal_minutes: profile?.daily_study_goal_minutes || 60,
    preferred_study_time: profile?.preferred_study_time || 'evening',
  })

  // Sync form data when profile updates
  useEffect(() => {
    if (profile) {
      setFormData({
        date_of_birth: profile.date_of_birth || '',
        bio: profile.bio || '',
        instagram_handle: profile.instagram_handle || '',
        parent_phone: profile.parent_phone || '',
        grade: profile.grade || '',
        school: profile.school || '',
        coaching: profile.coaching || '',
        board: profile.board || '',
        medium: profile.medium || 'english',
        target_year: profile.target_year || '',
        city: profile.city || '',
        state: profile.state || '',
        daily_study_goal_minutes: profile.daily_study_goal_minutes || 60,
        preferred_study_time: profile.preferred_study_time || 'evening',
      })
    }
  }, [profile])

  const updateGoalMutation = useMutation({
    mutationFn: (goalMinutes) => analyticsService.updateStudyGoal(goalMinutes),
    onSuccess: () => {
      queryClient.invalidateQueries(['studyTimer'])
    },
  })

  const handleSave = async () => {
    // Update study goal separately if changed
    if (formData.daily_study_goal_minutes !== profile?.daily_study_goal_minutes) {
      await updateGoalMutation.mutateAsync(formData.daily_study_goal_minutes)
    }

    const result = await updateProfile(formData)
    if (result.success) {
      toast.success('Profile updated!')
      setIsEditing(false)
      setActiveSection(null)
    } else {
      toast.error('Failed to update profile')
    }
  }

  const handleCancel = () => {
    // Reset form data to current profile
    setFormData({
      date_of_birth: profile?.date_of_birth || '',
      bio: profile?.bio || '',
      instagram_handle: profile?.instagram_handle || '',
      parent_phone: profile?.parent_phone || '',
      grade: profile?.grade || '',
      school: profile?.school || '',
      coaching: profile?.coaching || '',
      board: profile?.board || '',
      medium: profile?.medium || 'english',
      target_year: profile?.target_year || '',
      city: profile?.city || '',
      state: profile?.state || '',
      daily_study_goal_minutes: profile?.daily_study_goal_minutes || 60,
      preferred_study_time: profile?.preferred_study_time || 'evening',
    })
    setIsEditing(false)
    setActiveSection(null)
  }

  const startEditing = (section) => {
    setIsEditing(true)
    setActiveSection(section)
  }

  const studyTimes = [
    { value: 'morning', label: 'Morning', icon: '🌅', desc: '6AM-12PM' },
    { value: 'afternoon', label: 'Afternoon', icon: '☀️', desc: '12PM-6PM' },
    { value: 'evening', label: 'Evening', icon: '🌆', desc: '6PM-10PM' },
    { value: 'night', label: 'Night', icon: '🌙', desc: '10PM-6AM' },
  ]

  const gradeOptions = [
    { value: '6', label: 'Class 6' },
    { value: '7', label: 'Class 7' },
    { value: '8', label: 'Class 8' },
    { value: '9', label: 'Class 9' },
    { value: '10', label: 'Class 10' },
    { value: '11', label: 'Class 11' },
    { value: '12', label: 'Class 12' },
    { value: 'graduate', label: 'Graduate' },
    { value: 'other', label: 'Other' },
  ]

  const boardOptions = [
    { value: 'cbse', label: 'CBSE' },
    { value: 'icse', label: 'ICSE' },
    { value: 'state', label: 'State Board' },
    { value: 'ib', label: 'IB' },
    { value: 'igcse', label: 'IGCSE' },
    { value: 'other', label: 'Other' },
  ]

  const mediumOptions = [
    { value: 'english', label: 'English' },
    { value: 'hindi', label: 'Hindi' },
    { value: 'bilingual', label: 'Bilingual' },
    { value: 'other', label: 'Other' },
  ]

  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Chandigarh', 'Puducherry'
  ]

  // Section edit button component
  const EditButton = ({ section }) => (
    <button
      onClick={() => isEditing && activeSection === section ? handleSave() : startEditing(section)}
      className={`text-sm px-3 py-1.5 rounded-lg transition-all ${isEditing && activeSection === section
          ? 'bg-primary-500 text-white'
          : 'bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700'
        }`}
    >
      {isEditing && activeSection === section ? 'Save' : 'Edit'}
    </button>
  )

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-8">
      {/* Header Card with Avatar */}
      <div className="card p-6">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-400 via-accent-400 to-primary-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg shadow-primary-500/25">
              {user?.first_name?.charAt(0) || 'U'}
            </div>
            <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-surface-100 dark:bg-surface-800 border-2 border-white dark:border-surface-900 rounded-full flex items-center justify-center hover:bg-surface-200 transition-colors">
              <span className="text-sm">📷</span>
            </button>
          </div>

          {/* User Info */}
          <div className="flex-1">
            <h1 className="text-2xl font-display font-bold">{user?.full_name || 'Student'}</h1>
            <p className="text-surface-500">{user?.email}</p>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="badge-primary">Level {profile?.current_level || 1}</span>
              <span className="badge-success">{profile?.total_xp?.toLocaleString() || 0} XP</span>
              {profile?.grade && (
                <span className="badge-secondary">Class {profile.grade}</span>
              )}
              {profile?.primary_exam_name && (
                <span className="px-2 py-1 text-xs rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">
                  {profile.primary_exam_name}
                </span>
              )}
            </div>
            {formData.bio && (
              <p className="text-sm text-surface-600 dark:text-surface-400 mt-3 italic">"{formData.bio}"</p>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-surface-200 dark:border-surface-700">
          <div className="text-center">
            <p className="text-2xl font-bold">{profile?.total_questions_attempted || 0}</p>
            <p className="text-sm text-surface-500">Questions</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{Math.round(profile?.overall_accuracy || 0)}%</p>
            <p className="text-sm text-surface-500">Accuracy</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{Math.round((profile?.total_study_time_minutes || 0) / 60)}h</p>
            <p className="text-sm text-surface-500">Study Time</p>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="text-xl">👤</span>
            <h2 className="text-lg font-semibold">Personal Information</h2>
          </div>
          <div className="flex gap-2">
            {isEditing && activeSection === 'personal' && (
              <button onClick={handleCancel} className="text-sm px-3 py-1.5 rounded-lg bg-surface-100 dark:bg-surface-800">
                Cancel
              </button>
            )}
            <EditButton section="personal" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-surface-500 mb-1">Phone Number</label>
            {isEditing && activeSection === 'personal' ? (
              <input
                type="tel"
                value={user?.phone || ''}
                disabled
                className="input bg-surface-100 cursor-not-allowed"
                placeholder="Set in account settings"
              />
            ) : (
              <p className="text-base py-2">{user?.phone || '—'}</p>
            )}
          </div>

          {/* Parent Phone */}
          <div>
            <label className="block text-sm font-medium text-surface-500 mb-1">Parent's Phone</label>
            {isEditing && activeSection === 'personal' ? (
              <input
                type="tel"
                value={formData.parent_phone}
                onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                className="input"
                placeholder="Enter parent's phone"
              />
            ) : (
              <p className="text-base py-2">{formData.parent_phone || '—'}</p>
            )}
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-sm font-medium text-surface-500 mb-1">Date of Birth</label>
            {isEditing && activeSection === 'personal' ? (
              <input
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                className="input"
              />
            ) : (
              <p className="text-base py-2">
                {formData.date_of_birth
                  ? new Date(formData.date_of_birth).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                  : '—'
                }
              </p>
            )}
          </div>

          {/* Instagram */}
          <div>
            <label className="block text-sm font-medium text-surface-500 mb-1">Instagram Handle</label>
            {isEditing && activeSection === 'personal' ? (
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400">@</span>
                <input
                  type="text"
                  value={formData.instagram_handle}
                  onChange={(e) => setFormData({ ...formData, instagram_handle: e.target.value.replace('@', '') })}
                  className="input pl-8"
                  placeholder="username"
                />
              </div>
            ) : (
              <p className="text-base py-2">
                {formData.instagram_handle ? `@${formData.instagram_handle}` : '—'}
              </p>
            )}
          </div>

          {/* Bio */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-surface-500 mb-1">Bio</label>
            {isEditing && activeSection === 'personal' ? (
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="input resize-none"
                rows={2}
                maxLength={500}
                placeholder="Tell us about yourself..."
              />
            ) : (
              <p className="text-base py-2 text-surface-600 dark:text-surface-400">
                {formData.bio || '—'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Academic Information */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="text-xl">📚</span>
            <h2 className="text-lg font-semibold">Academic Information</h2>
          </div>
          <div className="flex gap-2">
            {isEditing && activeSection === 'academic' && (
              <button onClick={handleCancel} className="text-sm px-3 py-1.5 rounded-lg bg-surface-100 dark:bg-surface-800">
                Cancel
              </button>
            )}
            <EditButton section="academic" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Grade */}
          <div>
            <label className="block text-sm font-medium text-surface-500 mb-1">Current Grade</label>
            {isEditing && activeSection === 'academic' ? (
              <select
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                className="input"
              >
                <option value="">Select grade</option>
                {gradeOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : (
              <p className="text-base py-2">
                {gradeOptions.find(o => o.value === formData.grade)?.label || '—'}
              </p>
            )}
          </div>

          {/* Target Year */}
          <div>
            <label className="block text-sm font-medium text-surface-500 mb-1">Target Exam Year</label>
            {isEditing && activeSection === 'academic' ? (
              <input
                type="number"
                value={formData.target_year}
                onChange={(e) => setFormData({ ...formData, target_year: e.target.value })}
                className="input"
                placeholder="e.g. 2027"
                min={new Date().getFullYear()}
                max={new Date().getFullYear() + 5}
              />
            ) : (
              <p className="text-base py-2">{formData.target_year || '—'}</p>
            )}
          </div>

          {/* School */}
          <div>
            <label className="block text-sm font-medium text-surface-500 mb-1">School Name</label>
            {isEditing && activeSection === 'academic' ? (
              <input
                type="text"
                value={formData.school}
                onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                className="input"
                placeholder="Enter your school name"
              />
            ) : (
              <p className="text-base py-2">{formData.school || '—'}</p>
            )}
          </div>

          {/* Coaching */}
          <div>
            <label className="block text-sm font-medium text-surface-500 mb-1">Coaching Institute</label>
            {isEditing && activeSection === 'academic' ? (
              <input
                type="text"
                value={formData.coaching}
                onChange={(e) => setFormData({ ...formData, coaching: e.target.value })}
                className="input"
                placeholder="e.g. Allen, FIITJEE, Aakash..."
              />
            ) : (
              <p className="text-base py-2">{formData.coaching || '—'}</p>
            )}
          </div>

          {/* Board */}
          <div>
            <label className="block text-sm font-medium text-surface-500 mb-1">Education Board</label>
            {isEditing && activeSection === 'academic' ? (
              <select
                value={formData.board}
                onChange={(e) => setFormData({ ...formData, board: e.target.value })}
                className="input"
              >
                <option value="">Select board</option>
                {boardOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : (
              <p className="text-base py-2">
                {boardOptions.find(o => o.value === formData.board)?.label || '—'}
              </p>
            )}
          </div>

          {/* Medium */}
          <div>
            <label className="block text-sm font-medium text-surface-500 mb-1">Study Medium</label>
            {isEditing && activeSection === 'academic' ? (
              <select
                value={formData.medium}
                onChange={(e) => setFormData({ ...formData, medium: e.target.value })}
                className="input"
              >
                {mediumOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : (
              <p className="text-base py-2">
                {mediumOptions.find(o => o.value === formData.medium)?.label || 'English'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="text-xl">📍</span>
            <h2 className="text-lg font-semibold">Location</h2>
          </div>
          <div className="flex gap-2">
            {isEditing && activeSection === 'location' && (
              <button onClick={handleCancel} className="text-sm px-3 py-1.5 rounded-lg bg-surface-100 dark:bg-surface-800">
                Cancel
              </button>
            )}
            <EditButton section="location" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* City */}
          <div>
            <label className="block text-sm font-medium text-surface-500 mb-1">City</label>
            {isEditing && activeSection === 'location' ? (
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="input"
                placeholder="Enter your city"
              />
            ) : (
              <p className="text-base py-2">{formData.city || '—'}</p>
            )}
          </div>

          {/* State */}
          <div>
            <label className="block text-sm font-medium text-surface-500 mb-1">State</label>
            {isEditing && activeSection === 'location' ? (
              <select
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="input"
              >
                <option value="">Select state</option>
                {indianStates.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            ) : (
              <p className="text-base py-2">{formData.state || '—'}</p>
            )}
          </div>
        </div>
      </div>

      {/* Study Preferences */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="text-xl">⏰</span>
            <h2 className="text-lg font-semibold">Study Preferences</h2>
          </div>
          <div className="flex gap-2">
            {isEditing && activeSection === 'study' && (
              <button onClick={handleCancel} className="text-sm px-3 py-1.5 rounded-lg bg-surface-100 dark:bg-surface-800">
                Cancel
              </button>
            )}
            <EditButton section="study" />
          </div>
        </div>

        <div className="space-y-6">
          {/* Daily Study Goal */}
          <div>
            <label className="block text-sm font-medium text-surface-500 mb-3">Daily Study Goal</label>
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
                <span className={`badge ${formData.daily_study_goal_minutes >= 120 ? 'badge-success' :
                    formData.daily_study_goal_minutes >= 60 ? 'badge-primary' : 'badge-warning'
                  }`}>
                  {formData.daily_study_goal_minutes >= 120 ? '🔥 Intense' :
                    formData.daily_study_goal_minutes >= 60 ? '💪 Committed' : '📚 Beginner'}
                </span>
              </div>

              {isEditing && activeSection === 'study' ? (
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
                        className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${formData.daily_study_goal_minutes === mins
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
          </div>

          {/* Preferred Study Time */}
          <div>
            <label className="block text-sm font-medium text-surface-500 mb-3">Preferred Study Time</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {studyTimes.map((time) => (
                <button
                  key={time.value}
                  onClick={() => isEditing && activeSection === 'study' && setFormData({ ...formData, preferred_study_time: time.value })}
                  disabled={!isEditing || activeSection !== 'study'}
                  className={`p-3 rounded-xl border-2 transition-all text-center ${formData.preferred_study_time === time.value
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-surface-200 dark:border-surface-700'
                    } ${isEditing && activeSection === 'study' ? 'cursor-pointer hover:border-primary-300' : 'cursor-default'}`}
                >
                  <span className="text-2xl block mb-1">{time.icon}</span>
                  <span className="font-medium block">{time.label}</span>
                  <span className="text-xs text-surface-500">{time.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* App Settings */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <span className="text-xl">⚙️</span>
          <h2 className="text-lg font-semibold">App Settings</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-surface-50 dark:bg-surface-800">
            <div>
              <p className="font-medium">Dark Mode</p>
              <p className="text-sm text-surface-500">Toggle dark theme</p>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`w-14 h-8 rounded-full transition-colors ${darkMode ? 'bg-primary-500' : 'bg-surface-300'
                }`}
            >
              <motion.div
                className="w-6 h-6 bg-white rounded-full shadow"
                animate={{ x: darkMode ? 28 : 4 }}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-surface-50 dark:bg-surface-800">
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
        <div className="flex items-center gap-2 mb-5">
          <span className="text-xl">🔐</span>
          <h2 className="text-lg font-semibold">Account</h2>
        </div>

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
