import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Lock, Mail, BookOpen, Award, Users, Shield, GraduationCap, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'
import { setUser } from '../../store/authSlice'
import { clearTeam } from '../../store/teamSlice'

const FEATURES = [
  { icon: BookOpen,   label: 'Project Discovery',   desc: 'Browse and join capstone projects across every department' },
  { icon: Users,      label: 'Team Formation',       desc: 'Build the perfect team with AI-powered matching' },
  { icon: Award,      label: 'Mentor Connect',       desc: 'Get guided by experienced faculty mentors' },
  { icon: Sparkles,   label: 'Smart Evaluation',     desc: 'Track milestones, submit deliverables, and get graded in real time' },
]

const DEMO_ACCOUNTS = [
  { role: 'Admin',    icon: Shield,        email: 'admin@capstonehub.app',                        password: 'Admin@123',    color: '#ef4444' },
  { role: 'Faculty',  icon: Award,         email: 'sasikala.d@demo.capstonehub.app',               password: 'Faculty@123',  color: '#f59e0b' },
  { role: 'Student',  icon: GraduationCap, email: 'siva.prasanth@student.demo.capstonehub.app',    password: 'Student@123',  color: '#1a5fb4' },
]

export default function LoginPage() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [loading,  setLoading]  = useState(false)
  const dispatch  = useDispatch()
  const navigate  = useNavigate()

  const doLogin = async (loginEmail: string, loginPassword: string) => {
    setLoading(true)
    try {
      const res  = await api.post('/auth/login', { email: loginEmail, password: loginPassword })
      const data = res.data
      dispatch(clearTeam())
      dispatch(setUser({
        userId: data.userId, name: data.name, email: data.email,
        role: data.role, department: data.department,
        tenantId: data.tenantId, institutionName: data.institutionName,
        accessToken: data.accessToken, refreshToken: data.refreshToken,
      }))
      toast.success(`Welcome back, ${data.name}!`)
      const routes: Record<string, string> = {
        STUDENT: '/student/dashboard', FACULTY: '/faculty/dashboard',
        ADMIN:   '/admin/dashboard',
      }
      navigate(routes[data.role] || '/')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    await doLogin(email, password)
  }

  const handleDemoLogin = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail)
    setPassword(demoPassword)
    doLogin(demoEmail, demoPassword)
  }

  return (
    <div className="auth-split bg-surface">

      {/* ── Left decorative panel ─────────────────────────────────────────── */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden"
           style={{ background: 'linear-gradient(160deg, #04111f 0%, #07192d 40%, #0d2640 75%, #163557 100%)' }}>

        {/* Dot grid background */}
        <div className="absolute inset-0 dot-grid opacity-60" />

        {/* Floating accent circles (soft ambient glow) */}
        <div className="absolute top-1/4 right-8 w-72 h-72 rounded-full opacity-5 pointer-events-none blur-2xl animate-pulse-slow"
             style={{ background: 'radial-gradient(circle, #1a5fb4, transparent 70%)' }} />
        <div className="absolute bottom-1/3 left-12 w-48 h-48 rounded-full opacity-5 pointer-events-none blur-2xl animate-pulse-slow"
             style={{ background: 'radial-gradient(circle, #0ba5a5, transparent 70%)', animationDelay: '2s' }} />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-glow"
                 style={{ background: 'linear-gradient(135deg, #1a5fb4, #0ba5a5)' }}>
              <BookOpen size={20} className="text-white" />
            </div>
            <span className="text-2xl font-display font-bold text-white tracking-tight"
                  style={{ fontFamily: 'Outfit, sans-serif' }}>
              Skill Sync
            </span>
          </div>
          <p className="text-white/40 text-xs ml-13 pl-1">Engineering College Portal</p>
        </div>

        {/* Centre headline */}
        <div className="relative z-10 space-y-6">
          <div>
            <h2 className="text-4xl font-display font-bold text-white leading-tight mb-3"
                style={{ fontFamily: 'Outfit, sans-serif' }}>
              Where Engineering<br />
              <span className="gradient-text-primary">Projects Come Alive</span>
            </h2>
            <p className="text-white/50 text-base leading-relaxed max-w-sm">
              Connect students, mentors, and coordinators on a single collaborative platform.
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-4">
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center mt-0.5"
                     style={{ background: 'rgba(26,95,180,0.2)', border: '1px solid rgba(26,95,180,0.3)' }}>
                  <Icon size={15} className="text-primary-300" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white/90" style={{ fontFamily: 'Outfit, sans-serif' }}>{label}</div>
                  <div className="text-xs text-white/40">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom quote */}
        <div className="relative z-10">
          <div className="p-4 rounded-xl" style={{ background: 'rgba(26,95,180,0.08)', border: '1px solid rgba(26,95,180,0.15)' }}>
            <p className="text-white/60 text-sm italic">
              "The best way to predict the future is to invent it."
            </p>
            <p className="text-white/30 text-xs mt-1">— Alan Kay</p>
          </div>
        </div>
      </div>

      {/* ── Right form panel ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-center p-6 lg:p-12 bg-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
                 style={{ background: 'linear-gradient(135deg, #1a5fb4, #0d9488)' }}>
              <BookOpen size={18} className="text-white" />
            </div>
            <span className="text-xl font-display font-bold text-slate-800" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Skill Sync
            </span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <p className="section-subhead mb-2">Welcome Back</p>
            <h1 className="text-3xl font-display font-bold text-slate-800 mb-2"
                style={{ fontFamily: 'Outfit, sans-serif' }}>
              Sign in to your account
            </h1>
            <p className="text-slate-500 text-sm">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-600 hover:text-primary-700 font-semibold transition-colors">
                Register here
              </Link>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">University Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  id="email" type="email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@university.edu" required
                  className="input-dark pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  id="password" type={showPwd ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required
                  className="input-dark pl-10 pr-11"
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} id="login-submit"
              className="btn-primary w-full flex items-center justify-center gap-2 h-12 text-base mt-2">
              {loading
                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : 'Sign In'}
            </button>
          </form>

          {/* Demo quick-login buttons */}
          <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <p className="text-slate-500 text-xs text-center mb-3 font-medium uppercase tracking-wider">
              Quick Demo Login
            </p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map(({ role, icon: Icon, email: demoEmail, password: demoPwd, color }) => (
                <button
                  key={role}
                  type="button"
                  disabled={loading}
                  onClick={() => handleDemoLogin(demoEmail, demoPwd)}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] disabled:opacity-50"
                  style={{
                    background: `${color}10`,
                    border: `1px solid ${color}30`,
                    color: color,
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = `${color}20`
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = `${color}10`
                  }}
                >
                  <Icon size={14} />
                  {role}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
