import { ReactNode, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, LogOut, Menu, X, BookOpen, Check,
  ChevronLeft, ChevronRight, User, Settings
} from 'lucide-react'
import { RootState } from '../store'
import { logout } from '../store/authSlice'
import { clearTeam } from '../store/teamSlice'
import { markAllRead } from '../store/notificationSlice'
import toast from 'react-hot-toast'
import api from '../lib/api'

interface NavItem {
  label: string
  href:  string
  icon:  ReactNode
}

interface Props {
  navItems:    NavItem[]
  children:    ReactNode
  portalTitle: string
  portalColor: string
}

const ROLE_COLORS: Record<string, { bg: string; text: string; badge: string }> = {
  STUDENT:  { bg: 'linear-gradient(135deg, #1a5fb4, #0e3d80)', text: '#6fa0d9', badge: 'bg-primary-500/15 text-primary-300 border border-primary-500/20' },
  FACULTY:  { bg: 'linear-gradient(135deg, #0ba5a5, #077878)', text: '#14c4c4', badge: 'bg-teal/15 text-teal-300 border border-teal/20' },
  ADMIN:    { bg: 'linear-gradient(135deg, #e8a020, #b87c10)', text: '#f4c45a', badge: 'bg-gold/15 text-yellow-300 border border-gold/20' },
  INDUSTRY: { bg: 'linear-gradient(135deg, #7c3aed, #5b21b6)', text: '#a78bfa', badge: 'bg-violet-500/15 text-violet-300 border border-violet-500/20' },
}

export default function PortalLayout({ navItems, children, portalTitle, portalColor }: Props) {
  const { user }                       = useSelector((s: RootState) => s.auth)
  const { notifications, unreadCount } = useSelector((s: RootState) => s.notifications)
  const dispatch  = useDispatch()
  const navigate  = useNavigate()

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen,  setMobileOpen]  = useState(false)
  const [notifOpen,   setNotifOpen]   = useState(false)

  const handleLogout = () => {
    dispatch(logout())
    dispatch(clearTeam())
    toast.success('Signed out successfully')
    navigate('/login')
  }

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/mark-all-read')
      dispatch(markAllRead())
    } catch {}
  }

  const roleColors = ROLE_COLORS[user?.role || ''] || ROLE_COLORS['STUDENT']

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#04111f' }}>

      {/* ── Desktop Left Sidebar ────────────────────────────────────────────── */}
      <aside
        className={`hidden md:flex flex-col h-full border-r transition-all duration-300 z-30 flex-shrink-0 relative ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
        style={{ background: '#07192d', borderColor: 'rgba(26,95,180,0.15)' }}
      >
        {/* Top: CapstoneHub Logo & Toggle */}
        <div
          className={`border-b h-16 flex items-center flex-shrink-0 transition-all ${
            sidebarOpen ? 'px-4 justify-between' : 'justify-center px-0'
          }`}
          style={{ borderColor: 'rgba(26,95,180,0.12)' }}
        >
          {sidebarOpen ? (
            <>
              <NavLink to="/" className="flex items-center gap-3 overflow-hidden min-w-0">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-glow flex-shrink-0"
                     style={{ background: 'linear-gradient(135deg, #1a5fb4, #0ba5a5)' }}>
                  <BookOpen size={18} className="text-white" />
                </div>
                <div className="whitespace-nowrap overflow-hidden">
                  <div className="font-bold text-white text-base leading-tight"
                       style={{ fontFamily: 'Outfit, sans-serif' }}>
                    Skill Sync
                  </div>
                  <div className="text-xs leading-none mt-0.5" style={{ color: roleColors.text }}>
                    {portalTitle}
                  </div>
                </div>
              </NavLink>

              <div className="relative group flex items-center">
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="absolute right-0 top-full mt-1.5 px-2.5 py-1 bg-surface-100 text-white text-xs rounded-lg shadow-card whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 border border-white/10" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  Collapse Sidebar
                </div>
              </div>
            </>
          ) : (
            <div className="relative group flex items-center justify-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-glow transition-all hover:scale-105 cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #1a5fb4, #0ba5a5)' }}
              >
                <BookOpen size={20} className="text-white group-hover:hidden transition-all" />
                <ChevronRight size={20} className="text-white hidden group-hover:block transition-all" />
              </button>
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-surface-100 text-white text-xs rounded-lg shadow-card whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 border border-white/10" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Expand Sidebar
              </div>
            </div>
          )}
        </div>

        {/* Middle: Vertical Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto overflow-x-hidden no-scrollbar">
          {navItems.map(item => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-3.5 py-3 rounded-xl transition-all duration-200 group relative ${
                  isActive
                    ? 'text-white bg-primary-600/20 border border-primary-500/30 shadow-glow font-semibold'
                    : 'text-white/60 hover:text-white hover:bg-white/5 font-medium'
                } ${!sidebarOpen ? 'justify-center px-0' : ''}`
              }
            >
              <span className="w-5 h-5 flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110">
                {item.icon}
              </span>

              {sidebarOpen && (
                <span className="text-sm truncate" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {item.label}
                </span>
              )}

              {/* Tooltip on collapsed state */}
              {!sidebarOpen && (
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-surface-100 text-white text-xs rounded-lg shadow-card whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 border border-white/10"
                     style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {item.label}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom: User Profile & Actions */}
        <div className="p-3 border-t flex flex-col gap-2 flex-shrink-0"
             style={{ borderColor: 'rgba(26,95,180,0.12)' }}>
          {sidebarOpen ? (
            <div className="p-3 rounded-xl bg-surface-50/50 border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm"
                     style={{ background: roleColors.bg }}>
                  {user?.name?.[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white truncate" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    {user?.name}
                  </div>
                  <div className="text-xs text-white/40 truncate">
                    {user?.department || user?.role}
                  </div>
                </div>
              </div>
              <div className="relative group">
                <button
                  onClick={handleLogout}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-danger hover:bg-danger/10 transition-colors flex-shrink-0 ml-1 cursor-pointer"
                >
                  <LogOut size={16} />
                </button>
                <div className="absolute right-0 bottom-full mb-1.5 px-2.5 py-1 bg-surface-100 text-white text-xs rounded-lg shadow-card whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 border border-white/10" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  Sign out
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-2">
              <div className="relative group">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm cursor-pointer"
                     style={{ background: roleColors.bg }}>
                  {user?.name?.[0]?.toUpperCase()}
                </div>
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-surface-100 text-white text-xs rounded-lg shadow-card whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 border border-white/10" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {user?.name} ({user?.role})
                </div>
              </div>

              <div className="relative group">
                <button
                  onClick={handleLogout}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-white/40 hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                >
                  <LogOut size={17} />
                </button>
                <div className="absolute left-full ml-3 bottom-0 px-2.5 py-1 bg-surface-100 text-white text-xs rounded-lg shadow-card whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 border border-white/10" style={{ fontFamily: 'Outfit, sans-serif' }}>
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
              className="md:hidden fixed inset-0 bg-transparent z-40"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="md:hidden fixed inset-y-0 left-0 w-72 bg-surface-50 border-r border-white/10 z-50 flex flex-col justify-between"
              style={{ background: 'rgba(10, 25, 45, 0.95)' }}
            >
              {/* Header */}
              <div className="p-4 border-b border-white/10 flex items-center justify-between h-16">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-glow"
                       style={{ background: 'linear-gradient(135deg, #1a5fb4, #0ba5a5)' }}>
                    <BookOpen size={18} className="text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-base leading-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      Skill Sync
                    </div>
                    <div className="text-xs leading-none mt-0.5" style={{ color: roleColors.text }}>
                      {portalTitle}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white/50 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Nav */}
              <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
                {navItems.map(item => (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-200 ${
                        isActive
                          ? 'text-white bg-primary-600/20 border border-primary-500/30 shadow-glow font-semibold'
                          : 'text-white/60 hover:text-white hover:bg-white/5 font-medium'
                      }`
                    }
                  >
                    <span className="w-5 h-5 flex items-center justify-center">{item.icon}</span>
                    <span className="text-sm" style={{ fontFamily: 'Outfit, sans-serif' }}>{item.label}</span>
                  </NavLink>
                ))}
              </nav>

              {/* User */}
              <div className="p-4 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm"
                       style={{ background: roleColors.bg }}>
                    {user?.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white truncate" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      {user?.name}
                    </div>
                    <div className="text-xs text-white/40 truncate">{user?.role}</div>
                  </div>
                </div>
                <button onClick={handleLogout} className="text-white/40 hover:text-danger p-2">
                  <LogOut size={18} />
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main Content Area ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">

        {/* Minimal Top Header Bar */}
        <header
          className="flex-shrink-0 flex items-center justify-between px-4 lg:px-6 h-16 border-b z-20"
          style={{ background: '#07192d', borderColor: 'rgba(26,95,180,0.15)' }}
        >
          {/* Left: Mobile Drawer Trigger & Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/6 transition-all"
            >
              <Menu size={20} />
            </button>

            {/* Portal Badge / Title */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {portalTitle}
              </span>
              <span className={`hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors.badge}`}
                    style={{ fontFamily: 'Outfit, sans-serif' }}>
                {user?.role}
              </span>
            </div>
          </div>

          {/* Right: Notifications & User Quick Menu */}
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <div className="relative">
              <button
                id="notification-bell"
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative w-9 h-9 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/6 transition-all border border-white/5"
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
                    className="absolute right-0 top-12 w-80 z-50 max-h-96 overflow-y-auto rounded-2xl border shadow-card"
                    style={{ background: '#07192d', borderColor: 'rgba(26,95,180,0.2)' }}
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b"
                         style={{ borderColor: 'rgba(26,95,180,0.12)' }}>
                      <span className="font-semibold text-white text-sm" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        Notifications
                      </span>
                      {unreadCount > 0 && (
                        <button onClick={handleMarkAllRead}
                          className="flex items-center gap-1 text-xs text-primary-300 hover:text-primary-200 transition-colors">
                          <Check size={12} /> Mark all read
                        </button>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <p className="p-5 text-white/35 text-sm text-center">No notifications</p>
                    ) : (
                      notifications.slice(0, 15).map(n => (
                        <div key={n.id}
                             className={`px-4 py-3 border-b last:border-0 transition-colors ${!n.isRead ? 'bg-primary-500/5' : ''}`}
                             style={{ borderColor: 'rgba(26,95,180,0.08)' }}>
                          <p className="text-sm text-white/75 leading-snug">{n.message}</p>
                          <p className="text-xs text-white/25 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                        </div>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Quick User Avatar */}
            <div className="relative group">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm cursor-pointer"
                   style={{ background: roleColors.bg }}>
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div className="absolute right-0 top-full mt-2 px-2.5 py-1 bg-surface-100 text-white text-xs rounded-lg shadow-card whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 border border-white/10" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {user?.name}
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto" style={{ background: '#04111f' }}>
          <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(26,95,180,0.4), transparent)' }} />
          <div className="p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
