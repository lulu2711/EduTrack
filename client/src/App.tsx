import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './store/authStore'
import HomePage from './pages/home/HomePage'
import LoginPage from './pages/login/LoginPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import ClassesPage from './pages/admin/ClassesPage'
import TeachersPage from './pages/admin/TeachersPage'
import ExamsPage from './pages/admin/ExamsPage'
import ImportPage from './pages/admin/ImportPage'
import TeacherDashboard from './pages/teacher/TeacherDashboard'
import StudentsPage from './pages/teacher/StudentsPage'
import ProgressPage from './pages/teacher/ProgressPage'
import StudentDashboard from './pages/student/StudentDashboard'
import TrendsPage from './pages/student/TrendsPage'
import GoalsPage from './pages/student/GoalsPage'
import NotFoundPage from './pages/error/NotFoundPage'

// 受保护路由组件
function ProtectedRoute({ children, allowedRole }: { children: React.ReactNode; allowedRole: string }) {
  const { user, isAuthenticated, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F0EB] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />
  }

  if (user.role !== allowedRole) {
    return <Navigate to={`/${user.role}/dashboard`} replace />
  }

  return <>{children}</>
}

function App() {
  const { checkAuth } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/classes"
          element={
            <ProtectedRoute allowedRole="admin">
              <ClassesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/teachers"
          element={
            <ProtectedRoute allowedRole="admin">
              <TeachersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/exams"
          element={
            <ProtectedRoute allowedRole="admin">
              <ExamsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/import"
          element={
            <ProtectedRoute allowedRole="admin">
              <ImportPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/dashboard"
          element={
            <ProtectedRoute allowedRole="teacher">
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/students"
          element={
            <ProtectedRoute allowedRole="teacher">
              <StudentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/progress"
          element={
            <ProtectedRoute allowedRole="teacher">
              <ProgressPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/trends"
          element={
            <ProtectedRoute allowedRole="student">
              <TrendsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/goals"
          element={
            <ProtectedRoute allowedRole="student">
              <GoalsPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
