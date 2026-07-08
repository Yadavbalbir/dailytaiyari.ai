import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './context/authStore'
import { useTenantStore } from './context/tenantStore'

// Layouts
import MainLayout from './components/layout/MainLayout'
import AuthLayout from './components/layout/AuthLayout'
import SuspensionOverlay from './components/layout/SuspensionOverlay'

// Auth Pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Onboarding from './pages/auth/Onboarding'

// Main Pages
import Dashboard from './pages/Dashboard'
import Study from './pages/Study'
import StudyCourse from './pages/StudyCourse'
import Courses from './pages/Courses'
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
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:courseId/manage" element={<EditorRoute><CourseManager /></EditorRoute>} />
          <Route path="/courses/:courseId/manage/assignments/:assignmentId" element={<EditorRoute><AssignmentGrading /></EditorRoute>} />
          <Route path="/courses/:courseId/manage/assignments/:assignmentId/submissions/:submissionId" element={<EditorRoute><SubmissionReview /></EditorRoute>} />
          <Route path="/courses/:courseId/manage/coding/:problemId" element={<EditorRoute><CodingGrading /></EditorRoute>} />
          <Route path="/courses/:courseId/manage/coding/:problemId/submissions/:submissionId" element={<EditorRoute><CodingSubmissionReview /></EditorRoute>} />
          <Route path="/study" element={<Study />} />
          <Route path="/study/course/:courseId" element={<StudyCourse />} />
          <Route path="/study/:subjectId" element={<StudyChapters />} />
          <Route path="/study/chapter/:chapterId" element={<StudyChapterTopics />} />
          <Route path="/study/chapter/:chapterId/topic/:topicId" element={<StudyTopicContent />} />
          <Route path="/topic/:topicId" element={<TopicView />} />
          <Route path="/content/:contentId" element={<ContentViewer />} />
          <Route path="/assignment/:assignmentId" element={<AssignmentView />} />
          <Route path="/coding/:problemId" element={<CodingProblem />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/quiz/:quizId" element={<QuizAttempt />} />
          <Route path="/quiz/review/:attemptId" element={<QuizReview />} />
          <Route path="/mock-test" element={<MockTest />} />
          <Route path="/mock-test/live/:testId" element={<RichMockAttempt />} />
          <Route path="/mock-test/:testId" element={<MockTestAttempt />} />
          <Route path="/mock-test/review/:attemptId" element={<MockTestReview />} />
          <Route path="/pyp" element={<PreviousYearPapers />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/doubt-solver" element={<AIDoubtSolver />} />
          <Route path="/ai-doubt-solver" element={<AIDoubtSolver />} />
          <Route path="/ai-learning" element={<AILearning />} />
          <Route path="/ai-quiz-review/:attemptId" element={<AIQuizReview />} />
          <Route path="/community" element={<Community />} />
          <Route path="/community/:id" element={<CommunityPost />} />

          {/* Admin Dashboard */}
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/admin/mock-tests" element={<AdminRoute><MockTestManager /></AdminRoute>} />
          <Route path="/admin/mock-tests/grading" element={<AdminRoute><MockTestGrading /></AdminRoute>} />
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

