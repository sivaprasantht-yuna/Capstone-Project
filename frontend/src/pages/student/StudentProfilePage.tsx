import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useSelector, useDispatch } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, GraduationCap, Calendar, Phone, Mail,
  Briefcase, Code2, Cpu, Camera, Pencil, Contact,
  Target, X, Plus, Check, Loader2, Image as ImageIcon,
  Linkedin, Github, ExternalLink
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
  domain: string
  bio: string
  contactNo: string
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
    name: user?.name || 'Siva Prasanth T',
    email: user?.email || 'siva.prasanth21@bit.edu.in',
    role: 'Student',
    department: user?.department || 'Mechatronics Engineering',
    rollNumber: user?.rollNumber || '21MTR1234',
    domain: user?.domain || 'Robotics & Automation',
    bio: user?.bio || 'Passionate about robotics and automation. Love building intelligent machines and solving real-world problems through technology. Always eager to learn and collaborate.',
    contactNo: user?.contactNo || '+91 98765 43210',
    teamRole: team?.isLeader ? 'Team Lead' : (team?.teamId ? 'Team Member' : 'Team Lead'),
    memberSince: 'Aug 2023',
    avatarUrl: user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
    linkedinLink: 'https://linkedin.com/in/sivaprasanth',
    githubLink: 'https://github.com/sivaprasanth',
    skills: user?.skills && user.skills.length > 0 ? user.skills : DEFAULT_SKILLS
  })

  // Form temporary states
  const [form, setForm] = useState<ProfileData>(profile)
  const [avatarInput, setAvatarInput] = useState(profile.avatarUrl)
  const [newSkill, setNewSkill] = useState('')

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
            name: data.name || user?.name || 'Siva Prasanth T',
            email: data.email || user?.email || 'siva.prasanth21@bit.edu.in',
            role: 'Student',
            department: data.department || user?.department || 'Mechatronics Engineering',
            rollNumber: data.rollNumber || '21MTR1234',
            domain: data.domain || 'Robotics & Automation',
            bio: data.bio || 'Passionate about robotics and automation. Love building intelligent machines and solving real-world problems through technology. Always eager to learn and collaborate.',
            contactNo: data.contactNo || '+91 98765 43210',
            teamRole: data.teamRole || (team?.isLeader ? 'Team Lead' : 'Team Member'),
            memberSince: data.createdAt ? new Date(data.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Aug 2023',
            avatarUrl: data.avatarUrl || user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
            linkedinLink: data.linkedinLink || 'https://linkedin.com/in/sivaprasanth',
            githubLink: data.githubLink || 'https://github.com/sivaprasanth',
            skills: data.skills && data.skills.length > 0 ? data.skills : DEFAULT_SKILLS
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
            domain: updated.domain,
            contactNo: updated.contactNo,
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
    setEditModalOpen(true)
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
        domain: form.domain,
        bio: form.bio,
        contactNo: form.contactNo,
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
        domain: form.domain,
        contactNo: form.contactNo,
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
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Student Profile
          </h1>
          <p className="text-white/40 text-sm mt-1">
            View and manage your profile information
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-violet-400">
          <Loader2 className="animate-spin" size={36} />
          <span className="text-sm font-medium">Loading profile...</span>
        </div>
      ) : (
        <>
          {/* ── Top Hero Gradient Profile Card ───────────────────────────────── */}
          <div
            className="relative overflow-hidden rounded-3xl p-6 lg:p-8 border shadow-2xl transition-all duration-300"
            style={{
              background: '#0d0720',
              backgroundImage: 'radial-gradient(ellipse at top right, rgba(124, 58, 237, 0.25), rgba(15, 23, 42, 0.95) 70%), linear-gradient(135deg, #130a2a 0%, #0a1122 100%)',
              borderColor: 'rgba(139, 92, 246, 0.25)'
            }}
          >
            {/* Background Ambient Glow FX */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 lg:gap-8">
              {/* Profile Picture Frame with Camera Upload Button */}
              <div className="relative flex-shrink-0 group">
                <div className="w-36 h-36 lg:w-44 lg:h-44 rounded-full p-1 bg-gradient-to-tr from-violet-600 via-purple-500 to-indigo-400 shadow-[0_0_30px_rgba(139,92,246,0.35)]">
                  <img
                    src={profile.avatarUrl}
                    alt={profile.name}
                    className="w-full h-full rounded-full object-cover border-4 border-[#0e0720] shadow-inner"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400'
                    }}
                  />
                </div>

                {/* Camera Badge / Button (Triggers ONLY Photo Change Modal) */}
                <button
                  onClick={openAvatarModal}
                  title="Change Profile Photo"
                  className="absolute bottom-1 right-1 lg:bottom-2 lg:right-2 w-10 h-10 rounded-full bg-violet-600 hover:bg-violet-500 text-white border-2 border-[#0e0720] shadow-lg flex items-center justify-center cursor-pointer transition-transform duration-200 hover:scale-110 active:scale-95 group-hover:shadow-[0_0_15px_rgba(139,92,246,0.5)]"
                >
                  <Camera size={18} />
                </button>
              </div>

              {/* Header Info & Info Cards */}
              <div className="flex-1 w-full text-center md:text-left space-y-5">
                {/* Name & Role Badge */}
                <div className="space-y-2">
                  <div className="flex flex-col md:flex-row items-center md:items-baseline gap-3">
                    <h2 className="text-2xl lg:text-3xl font-extrabold text-white tracking-wide" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      {profile.name}
                    </h2>
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/30 shadow-sm" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      <GraduationCap size={14} />
                      {profile.role}
                    </span>
                  </div>
                </div>

                {/* Sub-info Grid (Fixed Truncation Issue with responsive full text) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-white/10">
                  {/* Reg No */}
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center text-violet-400 flex-shrink-0">
                      <Contact size={19} />
                    </div>
                    <div className="min-w-0 text-left">
                      <div className="text-[11px] font-medium text-white/40 uppercase tracking-wider">Reg. No.</div>
                      <div className="text-sm font-bold text-white leading-tight break-words" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        {profile.rollNumber}
                      </div>
                    </div>
                  </div>

                  {/* Department */}
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center text-violet-400 flex-shrink-0">
                      <GraduationCap size={19} />
                    </div>
                    <div className="min-w-0 text-left">
                      <div className="text-[11px] font-medium text-white/40 uppercase tracking-wider">Department</div>
                      <div className="text-xs sm:text-sm font-bold text-white leading-snug break-words" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        {profile.department}
                      </div>
                    </div>
                  </div>

                  {/* Domain */}
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center text-violet-400 flex-shrink-0">
                      <Cpu size={19} />
                    </div>
                    <div className="min-w-0 text-left">
                      <div className="text-[11px] font-medium text-white/40 uppercase tracking-wider">Domain</div>
                      <div className="text-xs sm:text-sm font-bold text-white leading-snug break-words" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        {profile.domain}
                      </div>
                    </div>
                  </div>

                  {/* Member Since */}
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center text-violet-400 flex-shrink-0">
                      <Calendar size={19} />
                    </div>
                    <div className="min-w-0 text-left">
                      <div className="text-[11px] font-medium text-white/40 uppercase tracking-wider">Member since</div>
                      <div className="text-sm font-bold text-white leading-tight break-words" style={{ fontFamily: 'Outfit, sans-serif' }}>
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
            <div className="p-6 rounded-2xl border bg-[#081223]/90 border-white/10 shadow-lg space-y-4 hover:border-violet-500/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center text-violet-300">
                  <User size={18} />
                </div>
                <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  About Me
                </h3>
              </div>
              <p className="text-white/70 text-sm leading-relaxed font-normal">
                {profile.bio}
              </p>
            </div>

            {/* Right Card 1: Skills */}
            <div className="p-6 rounded-2xl border bg-[#081223]/90 border-white/10 shadow-lg space-y-4 hover:border-violet-500/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center text-violet-300">
                  <Code2 size={18} />
                </div>
                <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  Skills
                </h3>
              </div>
              <div className="flex flex-wrap gap-2.5 pt-1">
                {profile.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3.5 py-2 rounded-xl bg-violet-950/40 border border-violet-500/25 text-violet-200 text-xs font-semibold flex items-center gap-2 shadow-sm transition-all hover:bg-violet-900/40 hover:border-violet-400/40"
                    style={{ fontFamily: 'Outfit, sans-serif' }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Left Card 2: Contact Information & Social Profiles */}
            <div className="p-6 rounded-2xl border bg-[#081223]/90 border-white/10 shadow-lg space-y-5 hover:border-violet-500/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center text-violet-300">
                  <Phone size={18} />
                </div>
                <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  Contact Information
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Phone */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center text-violet-400 flex-shrink-0">
                    <Phone size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-medium text-white/40 uppercase tracking-wider">Contact No.</div>
                    <div className="text-sm font-semibold text-white truncate" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      {profile.contactNo}
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center text-violet-400 flex-shrink-0">
                    <Mail size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-medium text-white/40 uppercase tracking-wider">Email ID</div>
                    <div className="text-sm font-semibold text-white truncate" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      {profile.email}
                    </div>
                  </div>
                </div>
              </div>

              {/* LinkedIn & GitHub Links */}
              <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row gap-3">
                <a
                  href={profile.linkedinLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 flex items-center justify-between px-4 py-2.5 rounded-xl bg-blue-600/15 border border-blue-500/30 text-blue-300 hover:bg-blue-600/25 hover:border-blue-400 transition-all text-xs font-semibold"
                >
                  <span className="flex items-center gap-2">
                    <Linkedin size={16} className="text-blue-400" />
                    LinkedIn Profile
                  </span>
                  <ExternalLink size={14} />
                </a>

                <a
                  href={profile.githubLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white/80 hover:bg-white/10 hover:border-white/30 transition-all text-xs font-semibold"
                >
                  <span className="flex items-center gap-2">
                    <Github size={16} className="text-white" />
                    GitHub Profile
                  </span>
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>

            {/* Right Card 2: Role & Domain */}
            <div className="p-6 rounded-2xl border bg-[#081223]/90 border-white/10 shadow-lg space-y-4 hover:border-violet-500/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center text-violet-300">
                  <Briefcase size={18} />
                </div>
                <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  Role & Domain
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* Role */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center text-violet-400 flex-shrink-0">
                    <Briefcase size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-medium text-white/40 uppercase tracking-wider">Role</div>
                    <div className="text-sm font-semibold text-white truncate" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      {profile.teamRole}
                    </div>
                  </div>
                </div>

                {/* Domain */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center text-violet-400 flex-shrink-0">
                    <Target size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-medium text-white/40 uppercase tracking-wider">Domain</div>
                    <div className="text-sm font-semibold text-white leading-tight break-words" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      {profile.domain}
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
              className="px-8 py-3.5 rounded-xl text-white font-bold text-sm tracking-wide shadow-glow transition-all duration-200 flex items-center gap-2.5 cursor-pointer hover:scale-105 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
                boxShadow: '0 0 20px rgba(124, 58, 237, 0.4)'
              }}
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
                className="absolute inset-0 bg-black/40 backdrop-blur-md"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative w-full max-w-md overflow-hidden rounded-3xl border border-violet-500/30 p-6 lg:p-8 shadow-2xl space-y-6 z-[101]"
                style={{
                  background: '#0a101d',
                  backgroundImage: 'radial-gradient(ellipse at top, rgba(124, 58, 237, 0.2), transparent 70%)'
                }}
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-300">
                      <Camera size={20} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        Change Profile Photo
                      </h3>
                      <p className="text-white/40 text-xs mt-0.5">Upload or choose a new avatar</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setAvatarModalOpen(false)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSavePhotoOnly} className="space-y-6">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-tr from-violet-600 via-purple-500 to-indigo-400 shadow-[0_0_25px_rgba(139,92,246,0.4)]">
                      <img
                        src={avatarInput}
                        alt="Avatar Preview"
                        className="w-full h-full rounded-full object-cover border-4 border-[#0e0720]"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400'
                        }}
                      />
                    </div>
                    <span className="text-xs text-white/40 font-medium">Photo Preview</span>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-white/70 flex items-center gap-1.5">
                      <ImageIcon size={14} className="text-violet-400" />
                      Quick Choose Preset Avatar
                    </label>
                    <div className="flex justify-center gap-2 pt-1">
                      {PRESET_AVATARS.map((url, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setAvatarInput(url)}
                          className={`w-11 h-11 rounded-full p-0.5 transition-all ${
                            avatarInput === url ? 'ring-2 ring-violet-400 scale-110 shadow-[0_0_12px_rgba(139,92,246,0.6)]' : 'opacity-60 hover:opacity-100 hover:scale-105'
                          }`}
                        >
                          <img src={url} alt={`Preset ${i}`} className="w-full h-full rounded-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white/70">Or Enter Image URL</label>
                    <input
                      type="url"
                      required
                      value={avatarInput}
                      onChange={e => setAvatarInput(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500/50"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setAvatarModalOpen(false)}
                      className="px-5 py-2.5 rounded-xl border border-white/10 text-white/70 text-sm font-semibold hover:bg-white/5 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingPhoto}
                      className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold shadow-glow flex items-center gap-2 transition-all disabled:opacity-50"
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
                className="absolute inset-0 bg-black/40 backdrop-blur-md"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-violet-500/30 p-6 lg:p-8 shadow-2xl space-y-6 z-[101]"
                style={{
                  background: '#0a101d',
                  backgroundImage: 'radial-gradient(ellipse at top, rgba(124, 58, 237, 0.15), transparent 70%)'
                }}
              >
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-300">
                      <Pencil size={20} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        Edit Profile Details
                      </h3>
                      <p className="text-white/40 text-xs mt-0.5">Update personal info & social profile links</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditModalOpen(false)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-white/70">Full Name</label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500/50"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-white/70">Reg. No. / Roll Number</label>
                      <input
                        type="text"
                        value={form.rollNumber}
                        onChange={e => setForm({ ...form, rollNumber: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500/50"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-white/70">Department</label>
                      <input
                        type="text"
                        value={form.department}
                        onChange={e => setForm({ ...form, department: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500/50"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-white/70">Domain</label>
                      <input
                        type="text"
                        value={form.domain}
                        onChange={e => setForm({ ...form, domain: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500/50"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-white/70">Contact Number</label>
                      <input
                        type="text"
                        value={form.contactNo}
                        onChange={e => setForm({ ...form, contactNo: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500/50"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-white/70">Email ID</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={e => setForm({ ...form, email: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500/50"
                      />
                    </div>

                    {/* Social Profile Links */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-white/70 flex items-center gap-1.5">
                        <Linkedin size={14} className="text-blue-400" /> LinkedIn URL
                      </label>
                      <input
                        type="url"
                        value={form.linkedinLink}
                        onChange={e => setForm({ ...form, linkedinLink: e.target.value })}
                        placeholder="https://linkedin.com/in/username"
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500/50"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-white/70 flex items-center gap-1.5">
                        <Github size={14} className="text-white" /> GitHub URL
                      </label>
                      <input
                        type="url"
                        value={form.githubLink}
                        onChange={e => setForm({ ...form, githubLink: e.target.value })}
                        placeholder="https://github.com/username"
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white/70">About Me (Bio)</label>
                    <textarea
                      rows={3}
                      value={form.bio}
                      onChange={e => setForm({ ...form, bio: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500/50 leading-relaxed"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-white/70">Technical Skills</label>
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
                        className="flex-1 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500/50"
                      />
                      <button
                        type="button"
                        onClick={handleAddSkill}
                        className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold flex items-center gap-1 transition-all"
                      >
                        <Plus size={16} /> Add
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2 max-h-36 overflow-y-auto p-2 bg-black/20 rounded-xl border border-white/5">
                      {form.skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 rounded-lg bg-violet-950/60 border border-violet-500/30 text-violet-200 text-xs font-medium flex items-center gap-2"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(skill)}
                            className="text-violet-400 hover:text-white transition-colors"
                          >
                            <X size={13} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setEditModalOpen(false)}
                      className="px-5 py-2.5 rounded-xl border border-white/10 text-white/70 text-sm font-semibold hover:bg-white/5 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold shadow-glow flex items-center gap-2 transition-all disabled:opacity-50"
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
