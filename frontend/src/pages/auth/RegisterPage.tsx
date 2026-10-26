import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Mail, Lock, GraduationCap, BookOpen, Building2,
  ArrowLeft, CheckCircle2, ChevronRight,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'
import { setUser } from '../../store/authSlice'
import { clearTeam } from '../../store/teamSlice'
import CustomSelect from '../../components/CustomSelect'

const ROLES = [
  {
    id:    'STUDENT',
    label: 'Student',
    icon:  GraduationCap,
    desc:  'Join teams, find mentors',
    color: 'from-blue-600 to-blue-700',
    accent: '#eff6ff',
    border: '#bfdbfe',
  },
  {
    id:    'FACULTY',
    label: 'Faculty Mentor',
    icon:  BookOpen,
    desc:  'Guide student projects',
    color: 'from-teal-600 to-teal-700',
    accent: '#f0fdfa',
    border: '#99f6e4',
  },
  {
    id:    'ADMIN',
    label: 'Coordinator',
    icon:  Building2,
    desc:  'Manage the ecosystem',
    color: 'from-amber-600 to-amber-700',
    accent: '#fffbeb',
    border: '#fde68a',
  },
]

const DEPARTMENTS = [
  'Aerospace Engineering',
  'Agricultural Engineering',
  'Artificial Intelligence & Data Science (AI & DS)',
  'Artificial Intelligence & Machine Learning (AI & ML)',
  'Biomedical Engineering',
  'Chemical Engineering',
  'Civil Engineering',
  'Computer Science and Engineering (CSE)',
  'Electrical and Electronics Engineering (EEE)',
  'Electronics and Communication Engineering (ECE)',
  'Information Technology (IT)',
  'Mechanical Engineering',
  'Mechatronics Engineering',
  'Robotics and Automation',
]

const YEARS = [
  { value: '1', label: 'I Year' },
  { value: '2', label: 'II Year' },
  { value: '3', label: 'III Year' },
  { value: '4', label: 'IV Year' },
]

const INITIAL_FORM = { name: '', email: '', password: '', department: '', rollNumber: '', yearOfStudy: '', designation: '' }

export default function RegisterPage() {
  const [step,    setStep]    = useState(1)
  const [role,    setRole]    = useState('')
  const [forms,   setForms]   = useState<Record<string, typeof INITIAL_FORM>>({
    STUDENT: { ...INITIAL_FORM }, FACULTY: { ...INITIAL_FORM },
    ADMIN:   { ...INITIAL_FORM },
  })
  const [loading, setLoading] = useState(false)
  const dispatch  = useDispatch()
  const navigate  = useNavigate()

  const currentForm  = (role && forms[role]) ? forms[role] : INITIAL_FORM
  const selectedRole = ROLES.find(r => r.id === role)

  const updateForm = (fields: Partial<typeof INITIAL_FORM>) => {
    if (!role) return
    setForms(prev => ({ ...prev, [role]: { ...prev[role], ...fields } }))
  }

  const handleRoleSelect = (selectedRole: string) => {
    setRole(selectedRole)
    setForms(prev => ({ ...prev, [selectedRole]: { ...INITIAL_FORM } }))
    setStep(2)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const form           = currentForm
      const showDepartment = role === 'STUDENT' || role === 'FACULTY'
      const payload: any   = {
        name: form.name, email: form.email, password: form.password, role,
        department: showDepartment ? (form.department || undefined) : undefined,
      }
      if (role === 'STUDENT') {
        if (form.rollNumber?.trim()) payload.rollNumber = form.rollNumber.trim()
        payload.yearOfStudy = parseInt(form.yearOfStudy)
      }
      if (role === 'FACULTY') payload.designation = form.designation

      const res  = await api.post('/auth/register', payload)
      const data = res.data
      dispatch(clearTeam())
      dispatch(setUser({
        userId: data.userId, name: data.name, email: data.email, role: data.role,
        department: data.department, tenantId: data.tenantId, institutionName: data.institutionName,
        accessToken: data.accessToken, refreshToken: data.refreshToken,
      }))
      toast.success(`Account created! Welcome, ${data.name}!`)
      const routes: Record<string, string> = {
        STUDENT: '/student/dashboard', FACULTY: '/faculty/dashboard',
        ADMIN:   '/admin/dashboard',
      }
      navigate(routes[data.role] || '/')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  const showDepartment = role === 'STUDENT' || role === 'FACULTY'

  return (
    <div className="auth-split bg-surface">

      {/* ── Left decorative panel ─────────────────────────────────────────── */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden"
           style={{ background: 'linear-gradient(160deg, #04111f 0%, #07192d 40%, #0d2640 75%, #163557 100%)' }}>

        {/* Floating accent circles (soft ambient glow) */}
        <div className="absolute top-1/4 right-8 w-72 h-72 rounded-full opacity-5 pointer-events-none blur-2xl animate-pulse-slow"
             style={{ background: 'radial-gradient(circle, #1a5fb4, transparent 70%)' }} />
        <div className="absolute bottom-1/3 left-12 w-48 h-48 rounded-full opacity-5 pointer-events-none blur-2xl animate-pulse-slow"
             style={{ background: 'radial-gradient(circle, #0ba5a5, transparent 70%)', animationDelay: '2s' }} />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-glow"
                 style={{ background: 'linear-gradient(135deg, #1a5fb4, #0ba5a5)' }}>
              <BookOpen size={20} className="text-white" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight"
                  style={{ fontFamily: 'Outfit, sans-serif' }}>
              Skill Sync
            </span>
          </div>
          <p className="text-white/35 text-xs pl-13">Engineering College Portal</p>
        </div>

        {/* Step indicator */}
        <div className="relative z-10 space-y-8">
          <div>
            <p className="section-subhead mb-3">Getting Started</p>
            <h2 className="text-3xl font-bold text-white leading-tight mb-3"
                style={{ fontFamily: 'Outfit, sans-serif' }}>
              Join the <span className="gradient-text-primary">Skill Sync</span><br />community today
            </h2>
            <p className="text-white/45 text-sm leading-relaxed max-w-sm">
              Create your account and begin collaborating on engineering projects that shape the future.
            </p>
          </div>

          {/* Progress steps */}
          <div className="space-y-3">
            {[
              { n: 1, label: 'Choose your role', done: step > 1 },
              { n: 2, label: 'Fill in your details', done: false },
            ].map(s => (
              <div key={s.n} className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all duration-300 ${
                  s.done
                    ? 'bg-teal text-white'
                    : step === s.n
                    ? 'bg-primary-500 text-white shadow-glow'
                    : 'bg-slate-700 text-white/40'
                }`}>
                  {s.done ? <CheckCircle2 size={14} /> : s.n}
                </div>
                <span className={`text-sm transition-colors duration-300 ${
                  step === s.n ? 'text-white font-medium' : s.done ? 'text-teal-300' : 'text-white/35'
                }`} style={{ fontFamily: 'Outfit, sans-serif' }}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          {/* Role pill (step 2) */}
          {step === 2 && selectedRole && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${selectedRole.color} flex items-center justify-center`}>
                  <selectedRole.icon size={16} className="text-white" />
                </div>
                <div>
                  <div className="text-xs text-white/40 uppercase tracking-wider" style={{ fontFamily: 'Outfit, sans-serif' }}>Registering as</div>
                  <div className="text-white font-semibold text-sm" style={{ fontFamily: 'Outfit, sans-serif' }}>{selectedRole.label}</div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Bottom sign-in prompt */}
        <div className="relative z-10">
          <p className="text-white/40 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-300 hover:text-primary-200 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* ── Right form panel ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-center p-4 sm:p-6 lg:p-12 min-h-screen lg:min-h-0 overflow-y-auto overflow-x-hidden w-full max-w-full bg-white">
        <div className="w-full max-w-md py-6">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
                 style={{ background: 'linear-gradient(135deg, #1a5fb4, #0d9488)' }}>
              <BookOpen size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold text-slate-800" style={{ fontFamily: 'Outfit, sans-serif' }}>Skill Sync</span>
          </div>

          {/* Progress bar (mobile) */}
          <div className="flex gap-2 mb-8 lg:hidden">
            {[1, 2].map(s => (
              <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-400 ${s <= step ? 'bg-primary-500' : 'bg-slate-200'}`} />
            ))}
          </div>

          <AnimatePresence mode="wait">

            {/* ── Step 1: Role Selection ────────────────────────────────── */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
              >
                <p className="section-subhead mb-2">Step 1 of 2</p>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  Choose your role
                </h1>
                <p className="text-slate-500 text-sm mb-8">
                  Select how you'll use Skill Sync to get a tailored experience.
                </p>

                <div className="grid grid-cols-1 gap-3">
                  {ROLES.map(r => {
                    const Icon = r.icon
                    return (
                      <button
                        key={r.id}
                        id={`role-${r.id.toLowerCase()}`}
                        onClick={() => handleRoleSelect(r.id)}
                        className="group relative flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-white hover:border-primary-400 hover:bg-slate-50 text-left transition-all duration-200 cursor-pointer shadow-xs"
                      >
                        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${r.color} flex items-center justify-center flex-shrink-0 shadow-xs`}>
                          <Icon size={20} className="text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-slate-800 text-sm" style={{ fontFamily: 'Outfit, sans-serif' }}>{r.label}</div>
                          <div className="text-slate-500 text-xs mt-0.5">{r.desc}</div>
                        </div>
                        <ChevronRight size={16} className="text-slate-400 group-hover:text-slate-700 transition-colors flex-shrink-0" />
                      </button>
                    )
                  })}
                </div>

                <p className="text-center text-slate-500 text-sm mt-8 lg:hidden">
                  Already have an account?{' '}
                  <Link to="/login" className="text-primary-600 hover:text-primary-700 font-semibold transition-colors">Sign in</Link>
                </p>
              </motion.div>
            )}

            {/* ── Step 2: Registration Form ────────────────────────────── */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
              >
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors text-sm mb-6 font-medium"
                >
                  <ArrowLeft size={15} />
                  <span style={{ fontFamily: 'Outfit, sans-serif' }}>Back to role selection</span>
                </button>

                <p className="section-subhead mb-2">Step 2 of 2</p>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  Create your account
                </h1>
                <p className="text-slate-500 text-sm mb-7">
                  Registering as{' '}
                  <span className="text-primary-600 font-semibold">
                    {selectedRole?.label}
                  </span>
                </p>

                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                      <input type="text" value={currentForm.name} onChange={e => updateForm({ name: e.target.value })}
                        placeholder="Your full name" required className="input-dark pl-10" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">University Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                      <input type="email" value={currentForm.email} onChange={e => updateForm({ email: e.target.value })}
                        placeholder="you@university.edu" required className="input-dark pl-10" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                      <input type="password" value={currentForm.password} onChange={e => updateForm({ password: e.target.value })}
                        placeholder="Min. 8 characters" required minLength={8} className="input-dark pl-10" />
                    </div>
                  </div>

                  {showDepartment && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Department</label>
                      <CustomSelect
                        value={currentForm.department}
                        onChange={val => updateForm({ department: val })}
                        options={DEPARTMENTS}
                        placeholder="Select department"
                        required
                        className="w-full"
                      />
                    </div>
                  )}

                  {role === 'STUDENT' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Roll / Register Number <span className="text-slate-400 text-xs font-normal">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={currentForm.rollNumber}
                          onChange={e => updateForm({ rollNumber: e.target.value })}
                          placeholder="e.g. 22ME233 or 22CS101"
                          className="input-dark"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Year of Study</label>
                        <CustomSelect
                          value={currentForm.yearOfStudy}
                          onChange={val => updateForm({ yearOfStudy: val })}
                          options={YEARS}
                          placeholder="Select year"
                          required
                          className="w-full"
                        />
                      </div>
                    </>
                  )}

                  {role === 'FACULTY' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Designation</label>
                      <input type="text" value={currentForm.designation} onChange={e => updateForm({ designation: e.target.value })}
                        placeholder="e.g. Associate Professor" required className="input-dark" />
                    </div>
                  )}

                  <button type="submit" disabled={loading} id="register-submit"
                    className="btn-primary w-full flex items-center justify-center gap-2 h-12 text-base mt-2">
                    {loading
                      ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : 'Create Account'}
                  </button>
                </form>

                <p className="text-center text-slate-500 text-sm mt-6 lg:hidden">
                  Already have an account?{' '}
                  <Link to="/login" className="text-primary-600 hover:text-primary-700 font-semibold transition-colors">Sign in</Link>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
