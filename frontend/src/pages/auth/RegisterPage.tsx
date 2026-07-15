import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, User, Mail, Lock, GraduationCap, BookOpen, Building2, Briefcase } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'
import { setUser } from '../../store/authSlice'

const ROLES = [
  { id: 'STUDENT',  label: 'Student',         icon: GraduationCap, color: 'from-primary-600 to-violet-600', desc: 'Join teams, find mentors' },
  { id: 'FACULTY',  label: 'Faculty Mentor',   icon: BookOpen,       color: 'from-emerald-600 to-teal-600',   desc: 'Guide student projects' },
  { id: 'ADMIN',    label: 'Coordinator',      icon: Building2,      color: 'from-amber-600 to-orange-600',   desc: 'Manage the ecosystem' },
  { id: 'INDUSTRY', label: 'Industry Partner', icon: Briefcase,      color: 'from-pink-600 to-rose-600',      desc: 'Post real-world problems' },
]

const DEPARTMENTS = ['CSE', 'ECE', 'Mechanical', 'Civil', 'Design', 'MBA', 'Physics', 'Mathematics', 'Biotechnology', 'Chemical']

export default function RegisterPage() {
  const [step, setStep] = useState(1)
  const [role, setRole] = useState('')
  const [form, setForm] = useState({
    name: '', email: '', password: '', department: '',
    yearOfStudy: '', designation: '',
  })
  const [loading, setLoading] = useState(false)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload: any = {
        name: form.name,
        email: form.email,
        password: form.password,
        role,
        department: form.department || undefined,
      }
      if (role === 'STUDENT') payload.yearOfStudy = parseInt(form.yearOfStudy)
      if (role === 'FACULTY') payload.designation = form.designation

      const res = await api.post('/auth/register', payload)
      const data = res.data
      dispatch(setUser({
        userId: data.userId,
        name: data.name,
        email: data.email,
        role: data.role,
        department: data.department,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      }))
      toast.success(`Account created! Welcome, ${data.name}!`)
      const routes: Record<string, string> = {
        STUDENT: '/student/dashboard', FACULTY: '/faculty/dashboard',
        ADMIN: '/admin/dashboard',     INDUSTRY: '/industry/dashboard',
      }
      navigate(routes[data.role] || '/')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-hero-gradient flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl animate-pulse-slow" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-glow">
              <Zap size={20} className="text-white" />
            </div>
            <span className="text-2xl font-bold gradient-text">CapstoneHub</span>
          </div>
        </div>

        <div className="glass-card p-8">
          {/* Progress indicator */}
          <div className="flex items-center gap-2 mb-6">
            {[1, 2].map(s => (
              <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-300 ${s <= step ? 'bg-primary-500' : 'bg-white/10'}`} />
            ))}
          </div>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h1 className="text-2xl font-bold text-white mb-1">Choose your role</h1>
                <p className="text-white/50 text-sm mb-6">Select how you'll use CapstoneHub</p>
                <div className="grid grid-cols-2 gap-3">
                  {ROLES.map(r => {
                    const Icon = r.icon
                    return (
                      <button
                        key={r.id}
                        id={`role-${r.id.toLowerCase()}`}
                        onClick={() => setRole(r.id)}
                        className={`p-4 rounded-xl border text-left transition-all duration-200 ${
                          role === r.id
                            ? 'border-primary-500/50 bg-primary-500/10 shadow-glow'
                            : 'border-white/10 bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${r.color} flex items-center justify-center mb-2`}>
                          <Icon size={16} className="text-white" />
                        </div>
                        <div className="font-semibold text-white text-sm">{r.label}</div>
                        <div className="text-white/40 text-xs mt-0.5">{r.desc}</div>
                      </button>
                    )
                  })}
                </div>
                <button
                  onClick={() => role && setStep(2)}
                  disabled={!role}
                  className="btn-primary w-full mt-6 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h1 className="text-2xl font-bold text-white mb-1">Create your account</h1>
                <p className="text-white/50 text-sm mb-6">
                  Registering as{' '}
                  <span className="text-primary-400 font-medium">
                    {ROLES.find(r => r.id === role)?.label}
                  </span>
                </p>

                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="text-white/70 text-sm font-medium block mb-1.5">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                      <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                        placeholder="Your full name" required className="input-dark pl-9" />
                    </div>
                  </div>
                  <div>
                    <label className="text-white/70 text-sm font-medium block mb-1.5">University Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                      <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                        placeholder="you@university.edu" required className="input-dark pl-9" />
                    </div>
                  </div>
                  <div>
                    <label className="text-white/70 text-sm font-medium block mb-1.5">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                      <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})}
                        placeholder="Min 8 characters" required minLength={8} className="input-dark pl-9" />
                    </div>
                  </div>

                  {/* Department */}
                  <div>
                    <label className="text-white/70 text-sm font-medium block mb-1.5">Department</label>
                    <select value={form.department} onChange={e => setForm({...form, department: e.target.value})}
                      className="input-dark" required={role !== 'ADMIN'}>
                      <option value="">Select department</option>
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>

                  {/* Role-specific fields */}
                  {role === 'STUDENT' && (
                    <div>
                      <label className="text-white/70 text-sm font-medium block mb-1.5">Year of Study</label>
                      <select value={form.yearOfStudy} onChange={e => setForm({...form, yearOfStudy: e.target.value})}
                        className="input-dark" required>
                        <option value="">Select year</option>
                        {[1,2,3,4].map(y => <option key={y} value={y}>Year {y}</option>)}
                      </select>
                    </div>
                  )}
                  {role === 'FACULTY' && (
                    <div>
                      <label className="text-white/70 text-sm font-medium block mb-1.5">Designation</label>
                      <input type="text" value={form.designation} onChange={e => setForm({...form, designation: e.target.value})}
                        placeholder="e.g. Associate Professor" required className="input-dark" />
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1">Back</button>
                    <button type="submit" disabled={loading} id="register-submit" className="btn-primary flex-1 flex items-center justify-center gap-2">
                      {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Create Account'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-center text-white/50 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
