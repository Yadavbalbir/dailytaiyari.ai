import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './context/authStore'
import { useTenantStore } from './context/tenantStore'
// Layouts
import MainLayout from './components/layout/MainLayout'
import AuthLayout from './components/layout/AuthLayout'
import SuspensionOverlay from './components/layout/SuspensionOverlay'
import VerificationGate from './components/layout/VerificationGate'

// Auth Pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import VerifyEmail from './pages/auth/VerifyEmail'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import Onboarding from './pages/auth/Onboarding'

// Main Pages
import Dashboard from './pages/Dashboard'
import Study from './pages/Study'
import StudyCourse from './pages/StudyCourse'
import Courses from './pages/Courses'
import CourseDetail from './pages/CourseDetail'
import StudyChapters from './pages/StudyChapters'
import StudyChapterTopics from './pages/StudyChapterTopics'
import StudyTopicContent from './pages/StudyTopicContent'
import TopicView from './pages/TopicView'
import ContentViewer from './pages/ContentViewer'
import AssignmentView from './pages/AssignmentView'
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
import AILearning from './pages/AILearning'
import AIQuizReview from './pages/AIQuizReview'
import Community from './pages/Community'
import CommunityPost from './pages/CommunityPost'
import PreviousYearPapers from './pages/PreviousYearPapers'
import AdminDashboard from './pages/AdminDashboard'
import CourseManager from './pages/CourseManager'
import AssignmentGrading from './pages/AssignmentGrading'
import SubmissionReview from './pages/SubmissionReview'
import CodingProblem from './pages/CodingProblem'
import CodingGrading from './pages/CodingGrading'
import CodingSubmissionReview from './pages/CodingSubmissionReview'
import MockTestManager from './pages/MockTestManager'
import MockTestBuilder from './pages/MockTestBuilder'
import RichMockAttempt from './pages/RichMockAttempt'
import MockTestGrading from './pages/MockTestGrading'
import MockTestSubmissions from './pages/MockTestSubmissions'
import MockTestSubmissionReview from './pages/MockTestSubmissionReview'
import RichMockReview from './pages/RichMockReview'


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

// Admin-only Route Component
const AdminRoute = ({ children }) => {
  const { user, profile } = useAuthStore()
  const role = user?.role || profile?.user?.role
  if (role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }
  return children
}

// Course editor route: admins and instructors (backend scopes instructors to
// their assigned courses).
const EditorRoute = ({ children }) => {
  const { user, profile } = useAuthStore()
  const role = user?.role || profile?.user?.role
  if (role !== 'admin' && role !== 'instructor') {
    return <Navigate to="/dashboard" replace />
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

// Feature-gated route: redirect to dashboard when the tenant admin has disabled
// the feature. Defaults to enabled so nothing breaks before the config loads.
const FeatureRoute = ({ feature, children }) => {
  const isFeatureEnabled = useTenantStore((s) => s.isFeatureEnabled)
  if (feature && !isFeatureEnabled(feature)) {
    return <Navigate to="/dashboard" replace />
  }
  return children
}

function App() {
  const { fetchTenantConfig, isLoading } = useTenantStore()

  useEffect(() => {
    fetchTenantConfig()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <>
      <SuspensionOverlay />
      <VerificationGate />
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
          <Route
            path="/verify-email"
            element={
              <PublicRoute>
                <VerifyEmail />
              </PublicRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PublicRoute>
                <ForgotPassword />
              </PublicRoute>
            }
          />
          <Route
            path="/reset-password"
            element={
              <PublicRoute>
                <ResetPassword />
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
          <Route path="/courses" element={<FeatureRoute feature="courses"><Courses /></FeatureRoute>} />
          <Route path="/courses/:courseId" element={<FeatureRoute feature="courses"><CourseDetail /></FeatureRoute>} />
          <Route path="/courses/:courseId/manage" element={<EditorRoute><CourseManager /></EditorRoute>} />
          <Route path="/courses/:courseId/manage/assignments/:assignmentId" element={<EditorRoute><AssignmentGrading /></EditorRoute>} />
          <Route path="/courses/:courseId/manage/assignments/:assignmentId/submissions/:submissionId" element={<EditorRoute><SubmissionReview /></EditorRoute>} />
          <Route path="/courses/:courseId/manage/coding/:problemId" element={<EditorRoute><CodingGrading /></EditorRoute>} />
          <Route path="/courses/:courseId/manage/coding/:problemId/submissions/:submissionId" element={<EditorRoute><CodingSubmissionReview /></EditorRoute>} />
          <Route path="/study" element={<FeatureRoute feature="study"><Study /></FeatureRoute>} />
          <Route path="/study/course/:courseId" element={<FeatureRoute feature="study"><StudyCourse /></FeatureRoute>} />
          <Route path="/study/:subjectId" element={<FeatureRoute feature="study"><StudyChapters /></FeatureRoute>} />
          <Route path="/study/chapter/:chapterId" element={<FeatureRoute feature="study"><StudyChapterTopics /></FeatureRoute>} />
          <Route path="/study/chapter/:chapterId/topic/:topicId" element={<FeatureRoute feature="study"><StudyTopicContent /></FeatureRoute>} />
          <Route path="/topic/:topicId" element={<FeatureRoute feature="study"><TopicView /></FeatureRoute>} />
          <Route path="/content/:contentId" element={<FeatureRoute feature="study"><ContentViewer /></FeatureRoute>} />
          <Route path="/assignment/:assignmentId" element={<AssignmentView />} />
          <Route path="/coding/:problemId" element={<CodingProblem />} />
          <Route path="/quiz" element={<FeatureRoute feature="quiz"><Quiz /></FeatureRoute>} />
          <Route path="/quiz/:quizId" element={<FeatureRoute feature="quiz"><QuizAttempt /></FeatureRoute>} />
          <Route path="/quiz/review/:attemptId" element={<FeatureRoute feature="quiz"><QuizReview /></FeatureRoute>} />
          <Route path="/mock-test" element={<FeatureRoute feature="mock_tests"><MockTest /></FeatureRoute>} />
          <Route path="/mock-test/live/:testId" element={<FeatureRoute feature="mock_tests"><RichMockAttempt /></FeatureRoute>} />
          <Route path="/mock-test/live-review/:attemptId" element={<FeatureRoute feature="mock_tests"><RichMockReview /></FeatureRoute>} />
          <Route path="/mock-test/:testId" element={<FeatureRoute feature="mock_tests"><MockTestAttempt /></FeatureRoute>} />
          <Route path="/mock-test/review/:attemptId" element={<FeatureRoute feature="mock_tests"><MockTestReview /></FeatureRoute>} />
          <Route path="/pyp" element={<FeatureRoute feature="pyq"><PreviousYearPapers /></FeatureRoute>} />
          <Route path="/analytics" element={<FeatureRoute feature="analytics"><Analytics /></FeatureRoute>} />
          <Route path="/leaderboard" element={<FeatureRoute feature="leaderboard"><Leaderboard /></FeatureRoute>} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/doubt-solver" element={<FeatureRoute feature="ai"><AIDoubtSolver /></FeatureRoute>} />
          <Route path="/ai-doubt-solver" element={<FeatureRoute feature="ai"><AIDoubtSolver /></FeatureRoute>} />
          <Route path="/ai-learning" element={<FeatureRoute feature="ai"><AILearning /></FeatureRoute>} />
          <Route path="/ai-quiz-review/:attemptId" element={<FeatureRoute feature="ai"><AIQuizReview /></FeatureRoute>} />
          <Route path="/community" element={<FeatureRoute feature="community"><Community /></FeatureRoute>} />
          <Route path="/community/:id" element={<FeatureRoute feature="community"><CommunityPost /></FeatureRoute>} />

          {/* Admin Dashboard */}
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/admin/mock-tests" element={<AdminRoute><MockTestManager /></AdminRoute>} />
          <Route path="/admin/mock-tests/grading" element={<AdminRoute><MockTestGrading /></AdminRoute>} />
          <Route path="/admin/mock-tests/:testId/submissions" element={<AdminRoute><MockTestSubmissions /></AdminRoute>} />
          <Route path="/admin/mock-tests/:testId/submissions/:attemptId" element={<AdminRoute><MockTestSubmissionReview /></AdminRoute>} />
          <Route path="/admin/mock-tests/:testId" element={<AdminRoute><MockTestBuilder /></AdminRoute>} />
        </Route>


        {/* Redirects */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  )
}

export default App

