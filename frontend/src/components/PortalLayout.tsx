import { ReactNode, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap, Bell, ChevronRight, LogOut, Menu, X,
  User, Settings
} from 'lucide-react'
import { RootState } from '../store'
import { logout } from '../store/authSlice'
import { markAllRead } from '../store/notificationSlice'
import toast from 'react-hot-toast'
import api from '../lib/api'

interface NavItem {
  label: string
  href: string
  icon: ReactNode
}

interface Props {
  navItems: NavItem[]
  children: ReactNode
  portalTitle: string
  portalColor: string
}

export default function PortalLayout({ navItems, children, portalTitle, portalColor }: Props) {
  const { user } = useSelector((s: RootState) => s.auth)
  const { notifications, unreadCount } = useSelector((s: RootState) => s.notifications)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [notifOpen, setNotifOpen] = useState(false)

  const handleLogout = () => {
    dispatch(logout())
    toast.success('Signed out successfully')
    navigate('/login')
  }

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/mark-all-read')
      dispatch(markAllRead())
    } catch {}
  }

  const getRoleColor = (role: string) => ({
    STUDENT: 'from-primary-600 to-violet-600',
    FACULTY: 'from-emerald-600 to-teal-600',
    ADMIN: 'from-amber-600 to-orange-600',
    INDUSTRY: 'from-pink-600 to-rose-600',
  }[role] || 'from-primary-600 to-violet-600')

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      {/* ─── Sidebar ──────────────────────────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 256, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0 h-full border-r border-white/5 bg-surface-50/50 backdrop-blur-sm overflow-hidden"
          >
            <div className="flex flex-col h-full w-64">
              {/* Logo */}
              <div className="p-6 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center shadow-glow flex-shrink-0">
                    <Zap size={18} className="text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">CapstoneHub</div>
                    <div className={`text-xs bg-gradient-to-r ${portalColor} bg-clip-text text-transparent font-medium`}>
                      {portalTitle}
                    </div>
                  </div>
                </div>
              </div>

              {/* Nav Links */}
              <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    className={({ isActive }) =>
                      `sidebar-link ${isActive ? 'active' : ''}`
                    }
                  >
                    {item.icon}
                    <span className="text-sm">{item.label}</span>
                  </NavLink>
                ))}
              </nav>

              {/* User section */}
              <div className="p-4 border-t border-white/5">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${getRoleColor(user?.role || '')} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                    {user?.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{user?.name}</div>
                    <div className="text-xs text-white/40 truncate">{user?.department}</div>
                  </div>
                  <button onClick={handleLogout} className="text-white/30 hover:text-danger transition-colors p-1" title="Sign out">
                    <LogOut size={15} />
                  </button>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ─── Main Content ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-surface-50/30 backdrop-blur-sm flex-shrink-0">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white/50 hover:text-white transition-colors">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="flex items-center gap-3">
            {/* Notifications bell */}
            <div className="relative">
              <button
                id="notification-bell"
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 text-white/50 hover:text-white transition-colors glass-card"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="notif-dot">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </button>

              {/* Notification Dropdown */}
              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="absolute right-0 top-12 w-80 glass-card z-50 max-h-96 overflow-y-auto"
                  >
                    <div className="flex items-center justify-between p-4 border-b border-white/5">
                      <span className="font-semibold text-white text-sm">Notifications</span>
                      {unreadCount > 0 && (
                        <button onClick={handleMarkAllRead} className="text-xs text-primary-400 hover:text-primary-300">
                          Mark all read
                        </button>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <p className="p-4 text-white/40 text-sm text-center">No notifications</p>
                    ) : (
                      notifications.slice(0, 15).map(n => (
                        <div key={n.id} className={`p-3 border-b border-white/5 last:border-0 ${!n.isRead ? 'bg-primary-500/5' : ''}`}>
                          <p className="text-sm text-white/80">{n.message}</p>
                          <p className="text-xs text-white/30 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                        </div>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getRoleColor(user?.role || '')} flex items-center justify-center text-white font-bold text-xs`}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
