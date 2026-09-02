import { ReactNode, useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, LogOut, Menu, X, BookOpen, Check,
  ChevronLeft, ChevronRight, User, Settings, Lock
} from 'lucide-react'
import { RootState } from '../store'
import { logout } from '../store/authSlice'
import { clearTeam } from '../store/teamSlice'
import { markAllRead, setNotifications } from '../store/notificationSlice'
import toast from 'react-hot-toast'
import api from '../lib/api'

export interface NavItem {
  label: string
  href:  string
  icon:  ReactNode
  section?: string
  badge?: string
  badgeVariant?: 'default' | 'locked' | 'success' | 'muted'
  locked?: boolean
  lockTooltip?: string
}

interface Props {
  navItems:    NavItem[]
  children:    ReactNode
  portalTitle: string
  portalColor: string
}

const ROLE_COLORS: Record<string, { bg: string; text: string; badge: string }> = {
  STUDENT:  { bg: 'linear-gradient(135deg, #1a5fb4, #0e3d80)', text: '#1a5fb4', badge: 'bg-blue-50 text-blue-700 border border-blue-200' },
  FACULTY:  { bg: 'linear-gradient(135deg, #0d9488, #0f766e)', text: '#0d9488', badge: 'bg-teal-50 text-teal-700 border border-teal-200' },
  ADMIN:    { bg: 'linear-gradient(135deg, #d97706, #b45309)', text: '#d97706', badge: 'bg-amber-50 text-amber-800 border border-amber-200' },
}

export default function PortalLayout({ navItems, children, portalTitle, portalColor }: Props) {
  const { user }                       = useSelector((s: RootState) => s.auth)
  const { notifications, unreadCount } = useSelector((s: RootState) => s.notifications)
  const dispatch  = useDispatch()
  const navigate  = useNavigate()

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen,  setMobileOpen]  = useState(false)
  const [notifOpen,   setNotifOpen]   = useState(false)

  const profileRoute = user?.role === 'FACULTY' ? '/faculty/profile' : user?.role === 'STUDENT' ? '/student/profile' : null

  const handleLogout = () => {
    dispatch(logout())
    dispatch(clearTeam())
    toast.success('Signed out successfully')
    navigate('/login')
  }

  const handleNavigateProfile = () => {
    if (profileRoute) {
      navigate(profileRoute)
    }
  }

  // ── Sync notifications from backend API ──────────────────────────────────────
  useEffect(() => {
    if (!user) return

    const fetchNotifications = () => {
      api.get('/notifications')
        .then(res => {
          if (Array.isArray(res.data)) {
            dispatch(setNotifications(res.data))
          }
        })
        .catch(() => {})
    }

    fetchNotifications()
    const interval = setInterval(fetchNotifications, 8000)
    return () => clearInterval(interval)
  }, [user, dispatch])

  // Also refetch immediately when opening notification drawer
  useEffect(() => {
    if (notifOpen) {
      api.get('/notifications')
        .then(res => {
          if (Array.isArray(res.data)) {
            dispatch(setNotifications(res.data))
          }
        })
        .catch(() => {})
    }
  }, [notifOpen, dispatch])

  const [respondingNotifId, setRespondingNotifId] = useState<number | null>(null)

  const handleRespondInvite = async (notif: any, accept: boolean) => {
    if (!notif.referenceId) return
    setRespondingNotifId(notif.id)
    try {
      await api.patch(`/teams/${notif.referenceId}/invite/respond?accept=${accept}`)
      await api.patch(`/notifications/${notif.id}/read`).catch(() => {})
      if (accept) {
        toast.success('You joined the team! 🎉')
        window.location.href = '/student/team-portal'
      } else {
        toast.success('Invitation declined.')
      }
      setNotifOpen(false)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to respond to invite.')
    } finally {
      setRespondingNotifId(null)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/mark-all-read')
      dispatch(markAllRead())
    } catch {}
  }

  const roleColors = ROLE_COLORS[user?.role || ''] || ROLE_COLORS['STUDENT']

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">

      {/* ── Desktop Left Sidebar ────────────────────────────────────────────── */}
      <aside
        className={`hidden md:flex flex-col h-full border-r transition-all duration-300 z-30 flex-shrink-0 relative bg-white border-slate-200/80 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Top: Skill Sync Logo & Toggle */}
        <div
          className={`border-b border-slate-100 h-16 flex items-center flex-shrink-0 transition-all ${
            sidebarOpen ? 'px-4 justify-between' : 'justify-center px-0'
          }`}
        >
          {sidebarOpen ? (
            <>
              <NavLink to="/" className="flex items-center gap-3 overflow-hidden min-w-0">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0"
                     style={{ background: 'linear-gradient(135deg, #1a5fb4, #0d9488)' }}>
                  <BookOpen size={18} className="text-white" />
                </div>
                <div className="whitespace-nowrap overflow-hidden">
                  <div className="font-bold text-slate-800 text-base leading-tight"
                       style={{ fontFamily: 'Outfit, sans-serif' }}>
                    Skill Sync
                  </div>
                  <div className="text-xs font-medium leading-none mt-0.5" style={{ color: roleColors.text }}>
                    {portalTitle}
                  </div>
                </div>
              </NavLink>

              <div className="relative group flex items-center">
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex-shrink-0"
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="absolute right-0 top-full mt-1.5 px-2.5 py-1 bg-slate-800 text-white text-xs rounded-lg shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  Collapse Sidebar
                </div>
              </div>
            </>
          ) : (
            <div className="relative group flex items-center justify-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-all hover:scale-105 cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #1a5fb4, #0d9488)' }}
              >
                <BookOpen size={20} className="text-white group-hover:hidden transition-all" />
                <ChevronRight size={20} className="text-white hidden group-hover:block transition-all" />
              </button>
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-800 text-white text-xs rounded-lg shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Expand Sidebar
              </div>
            </div>
          )}
        </div>

        {/* Middle: Vertical Navigation Items */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto overflow-x-hidden no-scrollbar">
          {navItems.map((item, idx) => {
            const isFirstInSection = item.section && (idx === 0 || navItems[idx - 1]?.section !== item.section)

            return (
              <div key={item.href || idx}>
                {/* Section Header */}
                {isFirstInSection && (
                  <div className={`transition-all ${sidebarOpen ? 'px-3.5 pt-4 pb-1.5' : 'py-2 flex justify-center'}`}>
                    {sidebarOpen ? (
                      <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400 select-none" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        {item.section}
                      </span>
                    ) : (
                      <div className="w-8 border-t border-slate-200/80" />
                    )}
                  </div>
                )}

                {/* Nav Link / Locked Button */}
                {item.locked ? (
                  <button
                    type="button"
                    onClick={() => toast(item.lockTooltip || 'This section unlocks once previous phase is complete', { icon: '🔒' })}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-400 bg-slate-50/50 hover:bg-slate-100/60 transition-all cursor-not-allowed group relative border border-transparent ${
                      !sidebarOpen ? 'justify-center px-0' : ''
                    }`}
                  >
                    <span className="w-5 h-5 flex items-center justify-center flex-shrink-0 opacity-60">
                      <Lock size={16} className="text-slate-400" />
                    </span>

                    {sidebarOpen && (
                      <span className="text-sm font-normal truncate text-slate-400" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        {item.label}
                      </span>
                    )}

                    {sidebarOpen && (
                      <span className="ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-400 border border-slate-200/60 uppercase tracking-tight">
                        {item.badge || 'locked'}
                      </span>
                    )}

                    {/* Tooltip on collapsed state */}
                    {!sidebarOpen && (
                      <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-800 text-white text-xs rounded-lg shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50"
                           style={{ fontFamily: 'Outfit, sans-serif' }}>
                        🔒 {item.label} ({item.badge || 'Locked'})
                      </div>
                    )}
                  </button>
                ) : (
                  <NavLink
                    to={item.href}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-150 group relative ${
                        isActive
                          ? 'text-primary-700 bg-primary-50/90 border border-primary-200/80 font-semibold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 font-medium'
                      } ${!sidebarOpen ? 'justify-center px-0' : ''}`
                    }
                  >
                    <span className="w-5 h-5 flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105">
                      {item.icon}
                    </span>

                    {sidebarOpen && (
                      <span className="text-sm truncate" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        {item.label}
                      </span>
                    )}

                    {sidebarOpen && item.badge && (
                      <span className="ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200/60">
                        {item.badge}
                      </span>
                    )}

                    {/* Tooltip on collapsed state */}
                    {!sidebarOpen && (
                      <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-800 text-white text-xs rounded-lg shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50"
                           style={{ fontFamily: 'Outfit, sans-serif' }}>
                        {item.label} {item.badge ? `(${item.badge})` : ''}
                      </div>
                    )}
                  </NavLink>
                )}
              </div>
            )
          })}
        </nav>

        {/* Bottom: User Profile & Actions */}
        <div className="p-3 border-t border-slate-100 flex flex-col gap-2 flex-shrink-0">
          {sidebarOpen ? (
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
              <div
                onClick={handleNavigateProfile}
                className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer hover:opacity-85 transition-opacity"
                title="View Profile"
              >
                <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm"
                     style={{ background: roleColors.bg }}>
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name || 'User'} className="w-full h-full object-cover" />
                  ) : (
                    <span>{user?.name?.[0]?.toUpperCase() || 'U'}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-800 truncate hover:text-primary-600 transition-colors" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    {user?.name}
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    {user?.department || user?.role}
                  </div>
                </div>
              </div>
              <div className="relative group">
                <button
                  onClick={handleLogout}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-danger hover:bg-red-50 transition-colors flex-shrink-0 ml-1 cursor-pointer"
                >
                  <LogOut size={16} />
                </button>
                <div className="absolute right-0 bottom-full mb-1.5 px-2.5 py-1 bg-slate-800 text-white text-xs rounded-lg shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  Sign out
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-2">
              <div className="relative group">
                <div
                  onClick={handleNavigateProfile}
                  className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center text-white text-sm font-bold shadow-sm cursor-pointer hover:ring-2 hover:ring-primary-400"
                  style={{ background: roleColors.bg }}
                  title="View Profile"
                >
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name || 'User'} className="w-full h-full object-cover" />
                  ) : (
                    <span>{user?.name?.[0]?.toUpperCase() || 'U'}</span>
                  )}
                </div>
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-800 text-white text-xs rounded-lg shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {user?.name} ({user?.role})
                </div>
              </div>

              <div className="relative group">
                <button
                  onClick={handleLogout}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-danger hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <LogOut size={17} />
                </button>
                <div className="absolute left-full ml-3 bottom-0 px-2.5 py-1 bg-slate-800 text-white text-xs rounded-lg shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  Sign out
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ── Mobile Sidebar Drawer ────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="md:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="md:hidden fixed inset-y-0 left-0 w-72 bg-white border-r border-slate-200 z-50 flex flex-col justify-between"
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between h-16">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
                       style={{ background: 'linear-gradient(135deg, #1a5fb4, #0d9488)' }}>
                    <BookOpen size={18} className="text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 text-base leading-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      Skill Sync
                    </div>
                    <div className="text-xs font-medium leading-none mt-0.5" style={{ color: roleColors.text }}>
                      {portalTitle}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Nav */}
              <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
                {navItems.map((item, idx) => {
                  const isFirstInSection = item.section && (idx === 0 || navItems[idx - 1]?.section !== item.section)

                  return (
                    <div key={item.href || idx}>
                      {isFirstInSection && (
                        <div className="px-3.5 pt-4 pb-1.5">
                          <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400 select-none" style={{ fontFamily: 'Outfit, sans-serif' }}>
                            {item.section}
                          </span>
                        </div>
                      )}

                      {item.locked ? (
                        <button
                          type="button"
                          onClick={() => toast(item.lockTooltip || 'This section unlocks once previous phase is complete', { icon: '🔒' })}
                          className="w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-slate-400 bg-slate-50/60 font-normal cursor-not-allowed"
                        >
                          <span className="w-5 h-5 flex items-center justify-center opacity-60">
                            <Lock size={16} />
                          </span>
                          <span className="text-sm" style={{ fontFamily: 'Outfit, sans-serif' }}>{item.label}</span>
                          <span className="ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-400 border border-slate-200 uppercase">
                            {item.badge || 'locked'}
                          </span>
                        </button>
                      ) : (
                        <NavLink
                          to={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={({ isActive }) =>
                            `flex items-center gap-3.5 px-4 py-2.5 rounded-xl transition-all duration-150 ${
                              isActive
                                ? 'text-primary-700 bg-primary-50 border border-primary-200 font-semibold shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium'
                            }`
                          }
                        >
                          <span className="w-5 h-5 flex items-center justify-center">{item.icon}</span>
                          <span className="text-sm" style={{ fontFamily: 'Outfit, sans-serif' }}>{item.label}</span>
                          {item.badge && (
                            <span className="ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200/60">
                              {item.badge}
                            </span>
                          )}
                        </NavLink>
                      )}
                    </div>
                  )
                })}
              </nav>

              {/* User */}
              <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm"
                       style={{ background: roleColors.bg }}>
                    {user?.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-800 truncate" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      {user?.name}
                    </div>
                    <div className="text-xs text-slate-500 truncate">{user?.role}</div>
                  </div>
                </div>
                <button onClick={handleLogout} className="text-slate-400 hover:text-danger p-2">
                  <LogOut size={18} />
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main Content Area ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-slate-50">

        {/* Minimal Top Header Bar */}
        <header className="flex-shrink-0 flex items-center justify-between px-4 lg:px-6 h-16 border-b border-slate-200/80 bg-white z-20">
          {/* Left: Mobile Drawer Trigger & Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all"
            >
              <Menu size={20} />
            </button>

            {/* Portal Badge / Title */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-800" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {portalTitle}
              </span>
              <span className={`hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors.badge}`}
                    style={{ fontFamily: 'Outfit, sans-serif' }}>
                {user?.role}
              </span>
            </div>
          </div>

          {/* Right: Notifications */}
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <div className="relative">
              <button
                id="notification-bell"
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative w-9 h-9 flex items-center justify-center rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all border border-slate-200"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="notif-dot">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </button>

              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-12 w-80 z-50 max-h-96 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl"
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                      <span className="font-semibold text-slate-800 text-sm" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        Notifications
                      </span>
                      {unreadCount > 0 && (
                        <button onClick={handleMarkAllRead}
                          className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors">
                          <Check size={12} /> Mark all read
                        </button>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <p className="p-5 text-slate-400 text-sm text-center">No notifications</p>
                    ) : (
                      notifications.slice(0, 15).map(n => (
                        <div key={n.id}
                             className={`px-4 py-3 border-b border-slate-100 last:border-0 transition-colors ${!n.isRead ? 'bg-primary-50/40' : 'hover:bg-slate-50'}`}>
                          <p className="text-sm text-slate-700 leading-snug">{n.message}</p>
                          <p className="text-xs text-slate-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>

                          {/* Interactive Action for Team Invitations */}
                          {n.notificationType === 'TEAM_INVITE' && n.referenceType === 'TEAM' && n.referenceId && n.message.toLowerCase().includes('invited') && (
                            <div className="flex gap-2 mt-2.5 pt-2 border-t border-slate-100">
                              <button
                                disabled={respondingNotifId === n.id}
                                onClick={() => handleRespondInvite(n, false)}
                                className="flex-1 py-1 px-2.5 rounded-lg text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                              >
                                Decline
                              </button>
                              <button
                                disabled={respondingNotifId === n.id}
                                onClick={() => handleRespondInvite(n, true)}
                                className="flex-1 py-1 px-2.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs transition-colors"
                              >
                                {respondingNotifId === n.id ? 'Joining...' : 'Accept'}
                              </button>
                            </div>
                          )}

                          {/* Deep Link for Team Join Requests */}
                          {n.referenceType === 'TEAM' && n.referenceId && n.message.toLowerCase().includes('requested to join') && (
                            <button
                              onClick={() => {
                                setNotifOpen(false)
                                navigate('/student/team-portal')
                              }}
                              className="mt-2 text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1"
                            >
                              <span>Open Team Mailbox</span>
                              <ChevronRight size={12} />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto bg-slate-50">
          <div className="p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
