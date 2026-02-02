import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './context/authStore'

// Layouts
import MainLayout from './components/layout/MainLayout'
import AuthLayout from './components/layout/AuthLayout'

// Auth Pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Onboarding from './pages/auth/Onboarding'

// Main Pages
import Dashboard from './pages/Dashboard'
import Study from './pages/Study'
import TopicView from './pages/TopicView'
import ContentViewer from './pages/ContentViewer'
import Quiz from './pages/Quiz'
import QuizAttempt from './pages/QuizAttempt'
import QuizReview from './pages/QuizReview'
import MockTest from './pages/MockTest'
import MockTestAttempt from './pages/MockTestAttempt'
import MockTestReview from './pages/MockTestReview'
import Analytics from './pages/Analytics'
import Leaderboard from './pages/Leaderboard'
import Profile from './pages/Profile'
import AIDoubtSolver from './pages/AIDoubtSolver'

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isOnboarded } = useAuthStore()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  if (!isOnboarded) {
    return <Navigate to="/onboarding" replace />
  }
  
  return children
}

// Public Route (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isOnboarded } = useAuthStore()
  
  if (isAuthenticated && isOnboarded) {
    return <Navigate to="/dashboard" replace />
  }
  
  return children
}

function App() {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        <Route 
          path="/register" 
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } 
        />
        <Route path="/onboarding" element={<Onboarding />} />
      </Route>

      {/* Main App Routes */}
      <Route 
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/study" element={<Study />} />
        <Route path="/study/:subjectId" element={<Study />} />
        <Route path="/topic/:topicId" element={<TopicView />} />
        <Route path="/content/:contentId" element={<ContentViewer />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/quiz/:quizId" element={<QuizAttempt />} />
        <Route path="/quiz/review/:attemptId" element={<QuizReview />} />
        <Route path="/mock-test" element={<MockTest />} />
        <Route path="/mock-test/:testId" element={<MockTestAttempt />} />
        <Route path="/mock-test/review/:attemptId" element={<MockTestReview />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/doubt-solver" element={<AIDoubtSolver />} />
      </Route>

      {/* Redirects */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App

