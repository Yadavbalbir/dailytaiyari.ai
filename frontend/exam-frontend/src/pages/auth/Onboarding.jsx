import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../../context/authStore'
import { examService } from '../../services/examService'
import Loading from '../../components/common/Loading'
import toast from 'react-hot-toast'
import {
  Target,
  Rocket,
  Sunrise,
  Sun,
  Sunset,
  Moon,
  ChevronRight,
  Check
} from 'lucide-react'

const steps = [
  { id: 1, title: 'Choose Your Exam', icon: <Target size={20} /> },
  { id: 2, title: 'Set Your Goals', icon: <Rocket size={20} /> },
]

const studyTimes = [
  { value: 'morning', label: 'Morning (6AM-12PM)', icon: <Sunrise size={20} /> },
  { value: 'afternoon', label: 'Afternoon (12PM-6PM)', icon: <Sun size={20} /> },
  { value: 'evening', label: 'Evening (6PM-10PM)', icon: <Sunset size={20} /> },
  { value: 'night', label: 'Night (10PM-6AM)', icon: <Moon size={20} /> },
]

const Onboarding = () => {
  const navigate = useNavigate()
  const { isAuthenticated, isOnboarded, completeOnboarding, isLoading } = useAuthStore()

  const [currentStep, setCurrentStep] = useState(1)
  const [exams, setExams] = useState([])
  const [formData, setFormData] = useState({
    primary_exam_id: '',
    additional_exam_ids: [],
    target_year: new Date().getFullYear() + 1,
    daily_study_goal_minutes: 60,
    preferred_study_time: 'evening',
  })

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
    } else if (isOnboarded) {
      navigate('/dashboard')
    }
  }, [isAuthenticated, isOnboarded, navigate])

  useEffect(() => {
    loadExams()
  }, [])

  const loadExams = async () => {
    try {
      const data = await examService.getExams()
      setExams(data.results || data)
    } catch (error) {
      console.error('Failed to load exams:', error)
    }
  }

  const handleNext = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    if (!formData.primary_exam_id) {
      toast.error('Please select your target exam')
      return
    }

    const result = await completeOnboarding(formData)
    if (result.success) {
      toast.success('Welcome to DailyTaiyari! 🎉')
      navigate('/dashboard')
    } else {
      toast.error(result.error || 'Something went wrong')
    }
  }

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${currentStep >= step.id
                  ? 'bg-primary-500 text-white'
                  : 'bg-surface-200 dark:bg-surface-700 text-surface-500'
                  }`}
              >
                {currentStep > step.id ? <Check size={20} /> : step.icon}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-20 h-1 mx-2 rounded-full transition-colors ${currentStep > step.id
                    ? 'bg-primary-500'
                    : 'bg-surface-200 dark:bg-surface-700'
                    }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="card p-8"
        >
          <h2 className="text-2xl font-display font-bold mb-2 text-center">
            {steps[currentStep - 1].title}
          </h2>
          <p className="text-surface-500 text-center mb-8">
            {currentStep === 1 && 'Which exam are you preparing for?'}
            {currentStep === 2 && 'Set your daily study goals'}
          </p>

          {/* Step 1: Exam Selection */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-surface-500 mb-4">Select your primary exam:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {exams.map((exam) => (
                  <button
                    key={exam.id}
                    onClick={() => setFormData({ ...formData, primary_exam_id: exam.id })}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${formData.primary_exam_id === exam.id
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-surface-200 dark:border-surface-700 hover:border-primary-300'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: exam.color }}
                      >
                        {exam.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-semibold">{exam.name}</h4>
                        <p className="text-xs text-surface-500">{exam.description?.slice(0, 60) || exam.exam_type}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Goals */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Daily Study Goal */}
              <div>
                <label className="block text-sm font-medium mb-3">
                  Daily Study Goal (minutes)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="30"
                    max="180"
                    step="15"
                    value={formData.daily_study_goal_minutes}
                    onChange={(e) =>
                      setFormData({ ...formData, daily_study_goal_minutes: parseInt(e.target.value) })
                    }
                    className="flex-1"
                  />
                  <span className="w-20 text-center font-semibold text-primary-600">
                    {formData.daily_study_goal_minutes} min
                  </span>
                </div>
              </div>

              {/* Preferred Study Time */}
              <div>
                <label className="block text-sm font-medium mb-3">
                  Preferred Study Time
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {studyTimes.map((time) => (
                    <button
                      key={time.value}
                      onClick={() =>
                        setFormData({ ...formData, preferred_study_time: time.value })
                      }
                      className={`p-3 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${formData.preferred_study_time === time.value
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-surface-200 dark:border-surface-700 hover:border-primary-300'
                        }`}
                    >
                      <span className={`${formData.preferred_study_time === time.value ? 'text-primary-500' : 'text-surface-400'}`}>
                        {time.icon}
                      </span>
                      <span className="text-sm font-medium">{time.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Year */}
              <div>
                <label className="block text-sm font-medium mb-2">Target Exam Year</label>
                <select
                  value={formData.target_year}
                  onChange={(e) =>
                    setFormData({ ...formData, target_year: parseInt(e.target.value) })
                  }
                  className="input"
                >
                  {[0, 1, 2, 3].map((offset) => {
                    const year = new Date().getFullYear() + offset
                    return (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    )
                  })}
                </select>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={handleBack}
              className={`btn-secondary ${currentStep === 1 ? 'invisible' : ''}`}
            >
              Back
            </button>

            {currentStep < 2 ? (
              <button
                onClick={handleNext}
                disabled={currentStep === 1 && !formData.primary_exam_id}
                className="btn-primary"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="btn-primary flex items-center gap-2"
              >
                {isLoading ? 'Setting up...' : <>{'Start Learning'} <ChevronRight size={18} /></>}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Onboarding

