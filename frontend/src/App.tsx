import { Routes, Route, Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useEffect } from 'react'
import { RootState } from './store'
import { connectWebSocket, disconnectWebSocket } from './lib/websocket'

// Auth
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'

// Portals
import StudentPortal from './pages/student/StudentPortal'
import FacultyPortal from './pages/faculty/FacultyPortal'
import AdminPortal from './pages/admin/AdminPortal'
import IndustryPortal from './pages/industry/IndustryPortal'

// Protected Route
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  const { user, isAuthenticated } = useSelector((s: RootState) => s.auth)

  // Connect WebSocket when logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      connectWebSocket(user.userId)
      return () => disconnectWebSocket()
    }
  }, [isAuthenticated, user?.userId])

  const getPortalForRole = () => {
    switch (user?.role) {
      case 'STUDENT':   return <Navigate to="/student/dashboard" replace />
      case 'FACULTY':   return <Navigate to="/faculty/dashboard" replace />
      case 'ADMIN':     return <Navigate to="/admin/dashboard" replace />
      case 'INDUSTRY':  return <Navigate to="/industry/dashboard" replace />
      default:          return <Navigate to="/login" replace />
    }
  }

  return (
    <Routes>
      {/* Public */}
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Role redirect */}
      <Route path="/" element={isAuthenticated ? getPortalForRole() : <Navigate to="/login" replace />} />

      {/* Student Portal */}
      <Route path="/student/*" element={
        <ProtectedRoute allowedRoles={['STUDENT']}>
          <StudentPortal />
        </ProtectedRoute>
      } />

      {/* Faculty Portal */}
      <Route path="/faculty/*" element={
        <ProtectedRoute allowedRoles={['FACULTY']}>
          <FacultyPortal />
        </ProtectedRoute>
      } />

      {/* Admin Portal */}
      <Route path="/admin/*" element={
        <ProtectedRoute allowedRoles={['ADMIN']}>
          <AdminPortal />
        </ProtectedRoute>
      } />

      {/* Industry Portal */}
      <Route path="/industry/*" element={
        <ProtectedRoute allowedRoles={['INDUSTRY']}>
          <IndustryPortal />
        </ProtectedRoute>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
