import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { RootState } from '../store'

interface Props {
  children: ReactNode
  allowedRoles: string[]
}

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const { user, isAuthenticated } = useSelector((s: RootState) => s.auth)

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles.includes(user.role)) {
    // Redirect to their own portal instead of 403
    const roleRoutes: Record<string, string> = {
      STUDENT: '/student/dashboard',
      FACULTY: '/faculty/dashboard',
      ADMIN: '/admin/dashboard',
      INDUSTRY: '/industry/dashboard',
    }
    return <Navigate to={roleRoutes[user.role] || '/login'} replace />
  }

  return <>{children}</>
}
