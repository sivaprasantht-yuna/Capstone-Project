import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { PlusCircle, UserPlus, ArrowRight, Users, Sparkles, ShieldCheck } from 'lucide-react'
import { RootState } from '../../store'

export default function TeamFormation() {
  const navigate   = useNavigate()
  const { teamId } = useSelector((s: RootState) => s.team)

  // If already in a team, redirect straight to portal
  useEffect(() => {
    if (teamId) navigate('/student/team-portal', { replace: true })
  }, [teamId, navigate])

  if (teamId) return null

  return (
    <div className="animate-fade-in max-w-4xl mx-auto pb-12">
      {/* ── Page Header ──────────────────────────────────────────────── */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary-600 to-teal flex items-center justify-center shadow-glow">
            <Users size={22} className="text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-white/40">
              Student Portal
            </p>
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Team Formation
            </h1>
          </div>
        </div>
        <p className="text-white/50 text-sm max-w-xl">
          Every great capstone starts with the right team. Choose how you want to participate — lead your own team or join one as a skilled contributor.
        </p>
      </div>

      {/* ── Two Option Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Create Team Card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          onClick={() => navigate('/student/team/create')}
          className="group relative overflow-hidden rounded-3xl cursor-pointer border border-primary-500/20 hover:border-primary-500/60 transition-all duration-300"
          style={{ background: 'linear-gradient(145deg, rgba(26,95,180,0.12) 0%, rgba(14,61,128,0.22) 100%)' }}
        >
          {/* Glow blob */}
          <div
            className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-20 group-hover:opacity-40 transition-opacity duration-500 pointer-events-none"
            style={{ background: 'radial-gradient(circle, #1a5fb4, transparent 70%)' }}
          />

          <div className="relative z-10 p-8">
            {/* Icon */}
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-glow group-hover:scale-110 transition-transform duration-300"
              style={{ background: 'linear-gradient(135deg, #1a5fb4, #0e3d80)' }}
            >
              <PlusCircle size={26} className="text-white" />
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Create Team
            </h2>
            <p className="text-white/55 text-sm leading-relaxed mb-6">
              Start your own capstone team. Define your project domains, set required skills, and invite talented teammates to join your vision.
            </p>

            {/* Feature list */}
            <ul className="space-y-2.5 mb-8">
              {[
                'You become the Team Leader',
                'Set team name, domain & skill requirements',
                'Accept or reject join requests',
                'Access Team Portal & Mailbox',
              ].map(f => (
                <li key={f} className="flex items-start gap-2.5 text-xs text-white/60">
                  <ShieldCheck size={14} className="text-primary-400 flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>

            {/* CTA */}
            <div className="flex items-center gap-2 text-primary-300 font-semibold text-sm group-hover:gap-3 transition-all duration-200">
              <span>Create Your Team</span>
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </div>
          </div>

          {/* Bottom accent bar */}
          <div
            className="absolute bottom-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ background: 'linear-gradient(90deg, #1a5fb4, #0ba5a5)' }}
          />
        </motion.div>

        {/* Join Team Card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          onClick={() => navigate('/student/team/join')}
          className="group relative overflow-hidden rounded-3xl cursor-pointer border border-teal/20 hover:border-teal/60 transition-all duration-300"
          style={{ background: 'linear-gradient(145deg, rgba(11,165,165,0.10) 0%, rgba(7,120,120,0.20) 100%)' }}
        >
          {/* Glow blob */}
          <div
            className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-20 group-hover:opacity-40 transition-opacity duration-500 pointer-events-none"
            style={{ background: 'radial-gradient(circle, #0ba5a5, transparent 70%)' }}
          />

          <div className="relative z-10 p-8">
            {/* Icon */}
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-glow group-hover:scale-110 transition-transform duration-300"
              style={{ background: 'linear-gradient(135deg, #0ba5a5, #077878)' }}
            >
              <UserPlus size={26} className="text-white" />
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Join Team
            </h2>
            <p className="text-white/55 text-sm leading-relaxed mb-6">
              Browse active teams recruiting skilled members. Share your expertise, send join requests, and become part of a great capstone project.
            </p>

            {/* Feature list */}
            <ul className="space-y-2.5 mb-8">
              {[
                'Browse open team listings',
                'Filter by domain & required skills',
                'Send join requests to teams',
                'Get accepted by team leader',
              ].map(f => (
                <li key={f} className="flex items-start gap-2.5 text-xs text-white/60">
                  <Sparkles size={14} className="text-teal-300 flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>

            {/* CTA */}
            <div className="flex items-center gap-2 text-teal-300 font-semibold text-sm group-hover:gap-3 transition-all duration-200">
              <span>Browse Open Teams</span>
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </div>
          </div>

          {/* Bottom accent bar */}
          <div
            className="absolute bottom-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{ background: 'linear-gradient(90deg, #0ba5a5, #1a5fb4)' }}
          />
        </motion.div>
      </div>

      {/* ── Info Banner ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="mt-8 p-4 rounded-2xl border border-white/8 flex items-start gap-4"
        style={{ background: 'rgba(255,255,255,0.03)' }}
      >
        <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
          <ShieldCheck size={16} className="text-amber-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white mb-0.5" style={{ fontFamily: 'Outfit, sans-serif' }}>
            One team per student
          </p>
          <p className="text-xs text-white/45 leading-relaxed">
            You can only be part of one capstone team at a time. Once you create or join a team, the Team Formation page will be replaced by your personal Team Portal.
          </p>
        </div>
      </motion.div>
    </div>
  )
}
