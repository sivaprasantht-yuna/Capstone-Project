import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Lock, Mail, BookOpen, Award, Users, Lightbulb } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'
import { setUser } from '../../store/authSlice'
import { clearTeam } from '../../store/teamSlice'

const FEATURES = [
  { icon: BookOpen,   label: 'Project Discovery',   desc: 'Browse and join capstone projects across every department' },
  { icon: Users,      label: 'Team Formation',       desc: 'Build the perfect team with AI-powered matching' },
  { icon: Award,      label: 'Mentor Connect',       desc: 'Get guided by experienced faculty mentors' },
  { icon: Lightbulb,  label: 'Industry Problems',    desc: 'Solve real-world challenges from top companies' },
]

export default function LoginPage() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [loading,  setLoading]  = useState(false)
  const dispatch  = useDispatch()
  const navigate  = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res  = await api.post('/auth/login', { email, password })
      const data = res.data
      dispatch(clearTeam())
      dispatch(setUser({
        userId: data.userId, name: data.name, email: data.email,
        role: data.role, department: data.department,
        accessToken: data.accessToken, refreshToken: data.refreshToken,
      }))
      toast.success(`Welcome back, ${data.name}!`)
      const routes: Record<string, string> = {
        STUDENT: '/student/dashboard', FACULTY: '/faculty/dashboard',
        ADMIN:   '/admin/dashboard',   INDUSTRY: '/industry/dashboard',
      }
      navigate(routes[data.role] || '/')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
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
              Connect students, mentors, coordinators and industry partners on a single collaborative platform.
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
      <div className="flex items-center justify-center p-6 lg:p-12"
           style={{ background: '#04111f' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-glow"
                 style={{ background: 'linear-gradient(135deg, #1a5fb4, #0ba5a5)' }}>
              <BookOpen size={18} className="text-white" />
            </div>
            <span className="text-xl font-display font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Skill Sync
            </span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <p className="section-subhead mb-2">Welcome Back</p>
            <h1 className="text-3xl font-display font-bold text-white mb-2"
                style={{ fontFamily: 'Outfit, sans-serif' }}>
              Sign in to your account
            </h1>
            <p className="text-white/40 text-sm">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-300 hover:text-primary-200 font-medium transition-colors">
                Register here
              </Link>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">University Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" size={16} />
                <input
                  id="email" type="email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@university.edu" required
                  className="input-dark pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" size={16} />
                <input
                  id="password" type={showPwd ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required
                  className="input-dark pl-10 pr-11"
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors">
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

          {/* Demo hint */}
          <div className="mt-6 p-3.5 rounded-xl text-center"
               style={{ background: 'rgba(26,95,180,0.07)', border: '1px solid rgba(26,95,180,0.15)' }}>
            <p className="text-white/35 text-xs">
              Demo credentials: <span className="text-white/55">admin@capstone.edu</span>
              {' / '}<span className="text-white/55">Admin@123</span>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
