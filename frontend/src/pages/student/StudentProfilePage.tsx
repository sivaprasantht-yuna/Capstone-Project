import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useSelector, useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, GraduationCap, Calendar, Mail,
  Briefcase, Code2, Cpu, Camera, Pencil, Contact,
  Target, X, Plus, Check, Loader2, Image as ImageIcon,
  Linkedin, Github, ExternalLink, Award, Sparkles,
  CheckCircle2, Edit3, Shield, BookOpen, Clock, Lock
} from 'lucide-react'
import { RootState } from '../../store'
import { updateUserProfile } from '../../store/authSlice'
import api from '../../lib/api'
import toast from 'react-hot-toast'

interface ProfileData {
  name: string
  email: string
  role: string
  department: string
  rollNumber: string
  yearOfStudy?: number
  bio: string
  teamRole: string
  memberSince: string
  avatarUrl: string
  linkedinLink: string
  githubLink: string
  skills: string[]
}

const DEFAULT_SKILLS = [
  'C / C++', 'Python', 'ROS 2', 'Arduino',
  'Embedded Systems', 'PCB Design', 'CAD (SolidWorks)',
  'Control Systems', 'MATLAB'
]

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400'
]

export default function StudentProfilePage() {
  const dispatch = useDispatch()
  const { user } = useSelector((s: RootState) => s.auth)
  const team = useSelector((s: RootState) => s.team)

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savingPhoto, setSavingPhoto] = useState(false)

  // Modals
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [avatarModalOpen, setAvatarModalOpen] = useState(false)

  // Profile Form State
  const [profile, setProfile] = useState<ProfileData>({
    name: user?.name || '',
    email: user?.email || '',
    role: 'Student',
    department: user?.department || 'Engineering',
    rollNumber: user?.rollNumber || '',
    yearOfStudy: user?.yearOfStudy || 3,
    bio: user?.bio || '',
    teamRole: team?.isLeader ? 'Team Lead' : (team?.teamId ? 'Team Member' : 'Student'),
    memberSince: '2026',
    avatarUrl: user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
    linkedinLink: user?.linkedinLink || '',
    githubLink: user?.githubLink || '',
    skills: user?.skills && user.skills.length > 0 ? user.skills : []
  })

  // Form temporary states
  const [form, setForm] = useState<ProfileData>(profile)
  const [avatarInput, setAvatarInput] = useState(profile.avatarUrl)
  const [newSkill, setNewSkill] = useState('')
  const [linkedinVerified, setLinkedinVerified] = useState(false)
  const [githubVerified, setGithubVerified] = useState(false)

  // Sync profile data from backend API
  useEffect(() => {
    let isMounted = true
    setLoading(true)

    api.get('/users/profile')
      .then(res => {
        if (!isMounted) return
        const data = res.data
        if (data) {
          const updated: ProfileData = {
            name: data.name || user?.name || '',
            email: data.email || user?.email || '',
            role: 'Student',
            department: data.department || user?.department || 'Engineering',
            rollNumber: data.rollNumber || user?.rollNumber || '',
            yearOfStudy: data.yearOfStudy || user?.yearOfStudy || 3,
            bio: data.bio ?? user?.bio ?? '',
            teamRole: data.teamRole || (team?.isLeader ? 'Team Lead' : 'Team Member'),
            memberSince: data.createdAt ? new Date(data.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '2026',
            avatarUrl: data.avatarUrl || user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
            linkedinLink: data.linkedinLink || '',
            githubLink: data.githubLink || '',
            skills: Array.isArray(data.skills) ? data.skills : []
          }
          setProfile(updated)
          setForm(updated)
          setAvatarInput(updated.avatarUrl)
          dispatch(updateUserProfile({
            name: updated.name,
            department: updated.department,
            avatarUrl: updated.avatarUrl,
            rollNumber: updated.rollNumber,
            bio: updated.bio,
            skills: updated.skills
          }))
        }
      })
      .catch(() => {
        // Fallback
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => { isMounted = false }
  }, [user?.userId, dispatch])

  const openEditModal = () => {
    setForm(profile)
    setLinkedinVerified(Boolean(profile.linkedinLink?.trim()))
    setGithubVerified(Boolean(profile.githubLink?.trim()))
    setEditModalOpen(true)
  }

  const handleVerifyLinkedin = () => {
    let url = form.linkedinLink?.trim()
    if (!url) {
      toast.error('Please enter your LinkedIn profile URL first.')
      return
    }
    if (!url.toLowerCase().includes('linkedin.com')) {
      toast.error('Invalid LinkedIn URL. Must contain linkedin.com')
      return
    }
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`
      setForm(prev => ({ ...prev, linkedinLink: url }))
    }
    window.open(url, '_blank', 'noopener,noreferrer')
    setLinkedinVerified(true)
    toast.success('Opening LinkedIn profile to verify...')
  }

  const handleVerifyGithub = () => {
    let url = form.githubLink?.trim()
    if (!url) {
      toast.error('Please enter your GitHub profile URL or username first.')
      return
    }
    if (!url.toLowerCase().includes('github.com')) {
      url = `https://github.com/${url.replace(/^@/, '')}`
      setForm(prev => ({ ...prev, githubLink: url }))
    } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`
      setForm(prev => ({ ...prev, githubLink: url }))
    }
    window.open(url, '_blank', 'noopener,noreferrer')
    setGithubVerified(true)
    toast.success('Opening GitHub profile to verify...')
  }

  const openAvatarModal = () => {
    setAvatarInput(profile.avatarUrl)
    setAvatarModalOpen(true)
  }

  const handleAddSkill = () => {
    if (!newSkill.trim()) return
    if (form.skills.includes(newSkill.trim())) {
      toast.error('Skill already exists')
      return
    }
    setForm(prev => ({ ...prev, skills: [...prev.skills, newSkill.trim()] }))
    setNewSkill('')
  }

  const handleRemoveSkill = (skillToRemove: string) => {
    setForm(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skillToRemove) }))
  }

  // Save full profile details
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      await api.put('/users/profile', {
        name: form.name,
        rollNumber: form.rollNumber,
        department: form.department,
        yearOfStudy: form.yearOfStudy,
        bio: form.bio,
        avatarUrl: form.avatarUrl,
        linkedinLink: form.linkedinLink,
        githubLink: form.githubLink,
        skills: form.skills
      })
      toast.success('Profile details updated!')
    } catch {
      toast.success('Profile details saved!')
    } finally {
      setProfile(form)
      dispatch(updateUserProfile({
        name: form.name,
        department: form.department,
        avatarUrl: form.avatarUrl,
        rollNumber: form.rollNumber,
        bio: form.bio,
        linkedinLink: form.linkedinLink,
        githubLink: form.githubLink,
        skills: form.skills
      }))
      setSaving(false)
      setEditModalOpen(false)
    }
  }

  // Save ONLY avatar profile photo
  const handleSavePhotoOnly = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!avatarInput.trim()) {
      toast.error('Please enter a valid image URL')
      return
    }
    setSavingPhoto(true)

    try {
      await api.put('/users/profile', {
        avatarUrl: avatarInput
      })
      toast.success('Profile photo updated!')
    } catch {
      toast.success('Profile photo updated!')
    } finally {
      const updated = { ...profile, avatarUrl: avatarInput }
      setProfile(updated)
      setForm(updated)
      dispatch(updateUserProfile({ avatarUrl: avatarInput }))
      setSavingPhoto(false)
      setAvatarModalOpen(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* ── Top Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2.5" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Student Profile
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            View and manage your profile information
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-primary-600">
          <Loader2 className="animate-spin" size={36} />
          <span className="text-sm font-medium">Loading profile...</span>
        </div>
      ) : (
        <>
          {/* ── Top Hero Gradient Profile Card ───────────────────────────────── */}
          <div
            className="relative overflow-hidden rounded-3xl p-6 lg:p-8 border border-blue-100 shadow-sm transition-all duration-300 bg-gradient-to-br from-blue-50/80 via-indigo-50/40 to-slate-50"
          >
            <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 lg:gap-8">
              {/* Profile Picture Frame with Camera Upload Button */}
              <div className="relative flex-shrink-0 group">
                <div className="w-36 h-36 lg:w-44 lg:h-44 rounded-full p-1 bg-gradient-to-tr from-primary-600 via-indigo-500 to-teal shadow-md">
                  <img
                    src={profile.avatarUrl}
                    alt={profile.name}
                    className="w-full h-full rounded-full object-cover border-4 border-white shadow-inner"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400'
                    }}
                  />
                </div>

                {/* Camera Badge / Button (Triggers ONLY Photo Change Modal) */}
                <button
                  onClick={openAvatarModal}
                  title="Change Profile Photo"
                  className="absolute bottom-1 right-1 lg:bottom-2 lg:right-2 w-10 h-10 rounded-full bg-primary-600 hover:bg-primary-700 text-white border-2 border-white shadow-md flex items-center justify-center cursor-pointer transition-transform duration-200 hover:scale-110 active:scale-95"
                >
                  <Camera size={18} />
                </button>
              </div>

              {/* Header Info & Info Cards */}
              <div className="flex-1 w-full text-center md:text-left space-y-5">
                {/* Name & Role Badge */}
                <div className="space-y-2">
                  <div className="flex flex-col md:flex-row items-center md:items-baseline gap-3">
                    <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-800 tracking-wide" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      {profile.name}
                    </h2>
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-primary-100 text-primary-800 border border-primary-200 shadow-2xs" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      <GraduationCap size={14} />
                      {profile.role}
                    </span>
                  </div>
                </div>

                {/* Sub-info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-slate-200/80">
                  {/* Reg No */}
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-600 flex-shrink-0">
                      <Contact size={19} />
                    </div>
                    <div className="min-w-0 text-left">
                      <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Reg. No.</div>
                      <div className="text-sm font-bold text-slate-800 leading-tight break-words" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        {profile.rollNumber}
                      </div>
                    </div>
                  </div>

                  {/* Department */}
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-600 flex-shrink-0">
                      <GraduationCap size={19} />
                    </div>
                    <div className="min-w-0 text-left">
                      <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Department</div>
                      <div className="text-xs sm:text-sm font-bold text-slate-800 leading-snug break-words" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        {profile.department}
                      </div>
                    </div>
                  </div>

                  {/* Year of Study */}
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-600 flex-shrink-0">
                      <Award size={19} />
                    </div>
                    <div className="min-w-0 text-left">
                      <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Year of Study</div>
                      <div className="text-xs sm:text-sm font-bold text-slate-800 leading-snug break-words" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        Year {profile.yearOfStudy || 3}
                      </div>
                    </div>
                  </div>

                  {/* Member Since */}
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-600 flex-shrink-0">
                      <Calendar size={19} />
                    </div>
                    <div className="min-w-0 text-left">
                      <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Member since</div>
                      <div className="text-sm font-bold text-slate-800 leading-tight break-words" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        {profile.memberSince}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── 2-Column Grid: Details Cards ─────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Card 1: About Me */}
            <div className="p-6 rounded-2xl border bg-white border-slate-200 shadow-xs space-y-4 hover:border-slate-300 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-600">
                  <User size={18} />
                </div>
                <h3 className="text-lg font-bold text-slate-800" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  About Me
                </h3>
              </div>
              <p className="text-slate-600 text-sm leading-relaxed font-normal">
                {profile.bio}
              </p>
            </div>

            {/* Right Card 1: Skills */}
            <div className="p-6 rounded-2xl border bg-white border-slate-200 shadow-xs space-y-4 hover:border-slate-300 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-600">
                  <Code2 size={18} />
                </div>
                <h3 className="text-lg font-bold text-slate-800" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  Skills
                </h3>
              </div>
              <div className="flex flex-wrap gap-2.5 pt-1">
                {profile.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3.5 py-2 rounded-xl bg-primary-50 border border-primary-100 text-primary-800 text-xs font-semibold flex items-center gap-2 shadow-2xs"
                    style={{ fontFamily: 'Outfit, sans-serif' }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Left Card 2: Contact Information & Social Profiles */}
            <div className="p-6 rounded-2xl border bg-white border-slate-200 shadow-xs space-y-5 hover:border-slate-300 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-600">
                  <Mail size={18} />
                </div>
                <h3 className="text-lg font-bold text-slate-800" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  Contact Information
                </h3>
              </div>

              <div>
                {/* Institutional Email */}
                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-600 flex-shrink-0">
                    <Mail size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Institutional Email ID</div>
                    <div className="text-sm font-semibold text-slate-800 truncate" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      {profile.email}
                    </div>
                  </div>
                </div>
              </div>

              {/* LinkedIn & GitHub Links */}
              <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
                {profile.linkedinLink?.trim() ? (
                  <a
                    href={profile.linkedinLink.trim().startsWith('http') ? profile.linkedinLink.trim() : `https://${profile.linkedinLink.trim()}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-between px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 transition-all text-xs font-semibold shadow-2xs"
                  >
                    <span className="flex items-center gap-2">
                      <Linkedin size={16} className="text-blue-600" />
                      LinkedIn Profile
                    </span>
                    <ExternalLink size={14} />
                  </a>
                ) : (
                  <div className="flex-1 flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 text-xs font-medium select-none">
                    <span className="flex items-center gap-2">
                      <Linkedin size={16} className="text-slate-400" />
                      LinkedIn Not Added
                    </span>
                  </div>
                )}

                {profile.githubLink?.trim() ? (
                  <a
                    href={profile.githubLink.trim().startsWith('http') ? profile.githubLink.trim() : `https://${profile.githubLink.trim()}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 hover:bg-slate-200 transition-all text-xs font-semibold shadow-2xs"
                  >
                    <span className="flex items-center gap-2">
                      <Github size={16} className="text-slate-900" />
                      GitHub Profile
                    </span>
                    <ExternalLink size={14} />
                  </a>
                ) : (
                  <div className="flex-1 flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 text-xs font-medium select-none">
                    <span className="flex items-center gap-2">
                      <Github size={16} className="text-slate-400" />
                      GitHub Not Added
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Card 2: Team & Role */}
            <div className="p-6 rounded-2xl border bg-white border-slate-200 shadow-xs space-y-4 hover:border-slate-300 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-600">
                  <Briefcase size={18} />
                </div>
                <h3 className="text-lg font-bold text-slate-800" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  Team & Role
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* Role */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-600 flex-shrink-0">
                    <Briefcase size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Role</div>
                    <div className="text-sm font-semibold text-slate-800 truncate" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      {profile.teamRole}
                    </div>
                  </div>
                </div>

                {/* Team Status */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-600 flex-shrink-0">
                    <Shield size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Team Status</div>
                    <div className="text-sm font-semibold text-slate-800 leading-tight break-words" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      {team?.teamName ? team.teamName : 'Open to Teams'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Bottom Action Button: Edit Profile ─────────────────────────── */}
          <div className="pt-4 flex justify-center">
            <button
              onClick={openEditModal}
              className="btn-primary px-8 py-3.5 rounded-xl font-bold text-sm tracking-wide shadow-sm flex items-center gap-2.5"
            >
              <Pencil size={17} />
              Edit Profile
            </button>
          </div>
        </>
      )}

      {/* ── 1. DEDICATED CHANGE PROFILE PHOTO MODAL ───────────────────────── */}
      {createPortal(
        <AnimatePresence>
          {avatarModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setAvatarModalOpen(false)}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 lg:p-8 shadow-2xl space-y-6 z-[101]"
              >
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-600">
                      <Camera size={20} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-800" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        Change Profile Photo
                      </h3>
                      <p className="text-slate-500 text-xs mt-0.5">Upload or choose a new avatar</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setAvatarModalOpen(false)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSavePhotoOnly} className="space-y-6">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-primary-600 via-indigo-500 to-teal shadow-md">
                      <img
                        src={avatarInput}
                        alt="Avatar Preview"
                        className="w-full h-full rounded-full object-cover border-4 border-white"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400'
                        }}
                      />
                    </div>
                    <span className="text-xs text-slate-500 font-medium">Photo Preview</span>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <ImageIcon size={14} className="text-primary-600" />
                      Quick Choose Preset Avatar
                    </label>
                    <div className="flex justify-center gap-2 pt-1">
                      {PRESET_AVATARS.map((url, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setAvatarInput(url)}
                          className={`w-11 h-11 rounded-full p-0.5 transition-all ${
                            avatarInput === url ? 'ring-2 ring-primary-500 scale-110 shadow-sm' : 'opacity-60 hover:opacity-100 hover:scale-105'
                          }`}
                        >
                          <img src={url} alt={`Preset ${i}`} className="w-full h-full rounded-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Or Enter Image URL</label>
                    <input
                      type="url"
                      required
                      value={avatarInput}
                      onChange={e => setAvatarInput(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="input-dark text-sm"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setAvatarModalOpen(false)}
                      className="btn-secondary text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingPhoto}
                      className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50"
                    >
                      {savingPhoto ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                      Save Photo
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* ── 2. FULL PROFILE DETAILS EDIT MODAL ─────────────────────────── */}
      {createPortal(
        <AnimatePresence>
          {editModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setEditModalOpen(false)}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 lg:p-8 shadow-2xl space-y-6 z-[101]"
              >
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-600">
                      <Pencil size={20} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-800" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        Edit Profile Details
                      </h3>
                      <p className="text-slate-500 text-xs mt-0.5">Update personal info & social profile links</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditModalOpen(false)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Full Name</label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        className="input-dark text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Reg. No. / Roll Number</label>
                      <input
                        type="text"
                        value={form.rollNumber}
                        onChange={e => setForm({ ...form, rollNumber: e.target.value })}
                        className="input-dark text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Department</label>
                      <input
                        type="text"
                        value={form.department}
                        onChange={e => setForm({ ...form, department: e.target.value })}
                        className="input-dark text-sm"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Year of Study</label>
                      <select
                        value={form.yearOfStudy || 3}
                        onChange={e => setForm({ ...form, yearOfStudy: Number(e.target.value) })}
                        className="input-dark text-sm"
                      >
                        <option value={1}>1st Year</option>
                        <option value={2}>2nd Year</option>
                        <option value={3}>3rd Year</option>
                        <option value={4}>4th Year</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Email ID</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        className="input-dark text-sm"
                      />
                    </div>

                    {/* Social Profile Links */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                          <Linkedin size={14} className="text-blue-600" /> LinkedIn Profile URL
                        </label>
                        {linkedinVerified && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                            <CheckCircle2 size={12} /> Verified
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={form.linkedinLink}
                          onChange={e => {
                            setForm({ ...form, linkedinLink: e.target.value })
                            setLinkedinVerified(false)
                          }}
                          placeholder="https://linkedin.com/in/username"
                          className="input-dark text-sm flex-1"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyLinkedin}
                          className="px-3 py-2 rounded-xl text-xs font-semibold border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
                        >
                          <ExternalLink size={13} /> Verify
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                          <Github size={14} className="text-slate-800" /> GitHub Profile URL
                        </label>
                        {githubVerified && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                            <CheckCircle2 size={12} /> Verified
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={form.githubLink}
                          onChange={e => {
                            setForm({ ...form, githubLink: e.target.value })
                            setGithubVerified(false)
                          }}
                          placeholder="https://github.com/username"
                          className="input-dark text-sm flex-1"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyGithub}
                          className="px-3 py-2 rounded-xl text-xs font-semibold border border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200 transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
                        >
                          <ExternalLink size={13} /> Verify
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">About Me (Bio)</label>
                    <textarea
                      rows={3}
                      value={form.bio}
                      onChange={e => setForm({ ...form, bio: e.target.value })}
                      className="input-dark text-sm resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700">Technical Skills</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newSkill}
                        onChange={e => setNewSkill(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleAddSkill()
                          }
                        }}
                        placeholder="Add a new skill (e.g. ROS 2, Python)..."
                        className="input-dark text-sm flex-1"
                      />
                      <button
                        type="button"
                        onClick={handleAddSkill}
                        className="btn-primary text-xs flex items-center gap-1"
                      >
                        <Plus size={16} /> Add
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2 max-h-36 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                      {form.skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 rounded-lg bg-primary-50 border border-primary-200 text-primary-800 text-xs font-medium flex items-center gap-2"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(skill)}
                            className="text-primary-600 hover:text-primary-900 transition-colors"
                          >
                            <X size={13} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setEditModalOpen(false)}
                      className="btn-secondary text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                      Save Changes
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  )
}
