import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  PlusCircle, ArrowRight, ArrowLeft, CheckCircle2, Check,
  Users, Lock, RefreshCw, ChevronLeft
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'
import SkillMultiSelect from '../../components/SkillMultiSelect'
import DomainMultiSelect from '../../components/DomainMultiSelect'
import { setTeam } from '../../store/teamSlice'
import { RootState } from '../../store'

const STEPS = [
  { step: 1, title: 'Team Info & Domains',          desc: 'Name, size & project domains' },
  { step: 2, title: 'Required Skill Requirements',  desc: 'Skills needed from teammates' },
  { step: 3, title: 'Project Focus',                desc: 'Brief project objective' },
  { step: 4, title: 'Review & Confirm',             desc: 'Lock team creation' },
]

export default function CreateTeamPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user }   = useSelector((s: RootState) => s.auth)
  const { teamId } = useSelector((s: RootState) => s.team)

  // Redirect if already in a team
  useEffect(() => {
    if (teamId) navigate('/student/team-portal', { replace: true })
  }, [teamId, navigate])

  const [step, setStep]   = useState(1)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    teamName:       '',
    domains:        [] as string[],
    maxTeamCount:   4,
    requiredSkills: [] as string[],
    projectFocus:   '',
  })

  // ── Validation ───────────────────────────────────────────────────────────
  const step1Valid = form.teamName.trim().length >= 3 && form.domains.length >= 1
  const step2Valid = form.requiredSkills.length >= 1
  const step3Valid = form.projectFocus.trim().length >= 10
  const isAllValid = step1Valid && step2Valid && step3Valid

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!isAllValid) { toast.error('Please complete all required fields.'); return }
    setSaving(true)
    try {
      const payload = {
        teamName:      form.teamName,
        domains:       form.domains,
        maxTeamSize:   form.maxTeamCount,
        requiredSkills: JSON.stringify(form.requiredSkills),
        projectFocus:  form.projectFocus,
      }

      const res = await api.post('/teams', payload)
      const createdTeam = res.data
      const teamId = (createdTeam?.id ?? Date.now()).toString()

      dispatch(setTeam({
        teamId,
        teamName:            form.teamName,
        projectDomain:       form.domains,
        projectFocus:        form.projectFocus,
        isLeader:            true,
        leaderId:            user?.userId?.toString() ?? 'me',
        memberLimit:         form.maxTeamCount,
        currentMemberCount:  1,
        status:              'RECRUITING',
        requiredSkills:      form.requiredSkills,
        members: [{
          id:           user?.userId?.toString() ?? 'me',
          name:         user?.name ?? 'You',
          role:         'LEADER',
          department:   user?.department ?? '',
          rollNumber:   '',
          contactNumber:'',
          techRole:     'Team Leader',
          skills:       form.requiredSkills.slice(0, 3),
          avatarInitial: user?.name?.[0]?.toUpperCase() ?? 'Y',
        }],
      }))

      toast.success(`Team "${form.teamName}" created successfully! 🎉`)
      navigate('/student/team-portal', { replace: true })
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to create team. Please try again.'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="animate-fade-in max-w-5xl mx-auto pb-12">
      {/* ── Back breadcrumb ─────────────────────────────────────────── */}
      <button
        onClick={() => navigate('/student/team')}
        className="flex items-center gap-2 text-white/40 hover:text-white text-sm mb-6 transition-colors group"
      >
        <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
        Team Formation
      </button>

      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-8">
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-glow"
          style={{ background: 'linear-gradient(135deg, #1a5fb4, #0e3d80)' }}
        >
          <PlusCircle size={22} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Create Team
          </h1>
          <p className="text-xs text-white/45">Set up your capstone team — step {step} of {STEPS.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* ── Left: Step Progress ──────────────────────────────────── */}
        <div className="lg:col-span-4 space-y-5">
          <div
            className="rounded-3xl p-6 border border-white/8"
            style={{ background: 'rgba(7,25,45,0.7)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-5">
              Registration Progress
            </p>
            <div className="space-y-5">
              {STEPS.map(s => (
                <div key={s.step} className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 transition-all ${
                      step > s.step
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : step === s.step
                        ? 'text-white shadow-glow'
                        : 'bg-white/5 text-white/25'
                    }`}
                    style={step === s.step ? { background: 'linear-gradient(135deg, #1a5fb4, #0e3d80)' } : undefined}
                  >
                    {step > s.step ? <Check size={14} /> : s.step}
                  </div>
                  <div>
                    <div className={`text-sm font-semibold ${step >= s.step ? 'text-white' : 'text-white/30'}`}>
                      {s.title}
                    </div>
                    <div className="text-xs text-white/30">{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Info panel */}
          <div
            className="rounded-3xl p-5 border border-primary-500/15"
            style={{ background: 'rgba(26,95,180,0.06)' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Lock size={14} className="text-primary-400" />
              <span className="text-xs font-semibold text-primary-300 uppercase tracking-wider">
                Permanent Fields
              </span>
            </div>
            <p className="text-xs text-white/45 leading-relaxed">
              Team Name and Project Domains are locked after creation. Choose carefully. Max team size and required skills can be updated later.
            </p>
          </div>
        </div>

        {/* ── Right: Form ─────────────────────────────────────────── */}
        <div className="lg:col-span-8">
          <div
            className="rounded-3xl p-8 border border-white/8"
            style={{ background: 'rgba(7,25,45,0.7)' }}
          >
            <AnimatePresence mode="wait">

              {/* Step 1: Basic Info */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-lg font-bold text-white mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      Team Info & Domains
                    </h2>
                    <p className="text-xs text-white/40">Set your team identity. These fields are permanent after creation.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-white/60 mb-2">
                      Team Name * <span className="text-white/30 normal-case">(permanent)</span>
                    </label>
                    <input
                      type="text"
                      value={form.teamName}
                      onChange={e => setForm({ ...form, teamName: e.target.value })}
                      placeholder="e.g. Team Innovators, AeroTech, RoboNexus Prime"
                      className="input-dark"
                      autoFocus
                    />
                    <p className="text-[11px] text-white/30 mt-1.5">
                      🔒 Choose carefully — this cannot be changed after creation.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-white/60 mb-2">
                      Maximum Team Size <span className="text-white/30 normal-case">(2–6 members, includes you)</span>
                    </label>
                    <div className="flex items-center gap-4">
                      {[2, 3, 4, 5, 6].map(n => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setForm({ ...form, maxTeamCount: n })}
                          className={`w-11 h-11 rounded-xl font-bold text-sm transition-all border ${
                            form.maxTeamCount === n
                              ? 'border-primary-500 text-white shadow-glow'
                              : 'border-white/10 text-white/40 hover:border-white/30 hover:text-white'
                          }`}
                          style={form.maxTeamCount === n ? { background: 'linear-gradient(135deg, #1a5fb4, #0e3d80)' } : { background: 'rgba(255,255,255,0.04)' }}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <DomainMultiSelect
                      label="Project Domains * (Select up to 3)"
                      selectedDomains={form.domains}
                      onChange={doms => setForm({ ...form, domains: doms })}
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      disabled={!step1Valid}
                      onClick={() => setStep(2)}
                      className="btn-primary text-sm flex items-center gap-2 px-6"
                    >
                      Next: Required Skills <ArrowRight size={15} />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Skills */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-lg font-bold text-white mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      Required Skill Requirements
                    </h2>
                    <p className="text-xs text-white/40">Select the skills your team needs from incoming members.</p>
                  </div>

                  <SkillMultiSelect
                    label="Required Teammate Skills * (Select from Library)"
                    selectedSkills={form.requiredSkills}
                    onChange={skills => setForm({ ...form, requiredSkills: skills })}
                    placeholder="Type or filter engineering skills (e.g. ROS, React, STM32, SolidWorks)..."
                  />

                  <div className="pt-2 flex justify-between">
                    <button type="button" onClick={() => setStep(1)} className="btn-secondary text-sm flex items-center gap-2">
                      <ArrowLeft size={15} /> Back
                    </button>
                    <button
                      type="button"
                      disabled={!step2Valid}
                      onClick={() => setStep(3)}
                      className="btn-primary text-sm flex items-center gap-2 px-6"
                    >
                      Next: Project Focus <ArrowRight size={15} />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Project Focus */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-lg font-bold text-white mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      Project Focus / Aim
                    </h2>
                    <p className="text-xs text-white/40">Describe your project objective in 2–3 concise sentences. This appears on your Team Portal.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-white/60 mb-2">
                      Project Objective *
                    </label>
                    <textarea
                      rows={5}
                      value={form.projectFocus}
                      onChange={e => setForm({ ...form, projectFocus: e.target.value })}
                      placeholder="e.g. Developing an AI-assisted autonomous agriculture monitoring system to improve crop productivity using IoT and Computer Vision..."
                      className="input-dark resize-none"
                    />
                    <p className="text-[11px] text-white/30 mt-1.5">
                      {form.projectFocus.trim().length} / min 10 characters
                    </p>
                  </div>

                  <div className="pt-2 flex justify-between">
                    <button type="button" onClick={() => setStep(2)} className="btn-secondary text-sm flex items-center gap-2">
                      <ArrowLeft size={15} /> Back
                    </button>
                    <button
                      type="button"
                      disabled={!step3Valid}
                      onClick={() => setStep(4)}
                      className="btn-primary text-sm flex items-center gap-2 px-6"
                    >
                      Review & Confirm <ArrowRight size={15} />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Review */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="text-lg font-bold text-white mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      Review & Confirm
                    </h2>
                    <p className="text-xs text-white/40">Double-check your team details before locking them in.</p>
                  </div>

                  <div
                    className="rounded-2xl p-5 border border-white/8 space-y-5"
                    style={{ background: 'rgba(255,255,255,0.03)' }}
                  >
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-white/40 text-xs block mb-0.5">Team Name</span>
                        <span className="font-bold text-white">{form.teamName}</span>
                      </div>
                      <div>
                        <span className="text-white/40 text-xs block mb-0.5">Max Team Size</span>
                        <span className="font-bold text-white">{form.maxTeamCount} Members</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-white/40 text-xs block mb-1.5">Project Domains</span>
                      <div className="flex flex-wrap gap-1.5">
                        {form.domains.map(d => (
                          <span key={d} className="badge badge-teal">{d}</span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-white/40 text-xs block mb-1.5">Required Skills</span>
                      <div className="flex flex-wrap gap-1.5">
                        {form.requiredSkills.map(s => (
                          <span key={s} className="badge badge-accent">{s}</span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-white/40 text-xs block mb-1.5">Project Focus</span>
                      <p className="text-sm text-white/75 leading-relaxed">{form.projectFocus}</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 flex items-start gap-3">
                    <Lock size={15} className="text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-300/80 leading-relaxed">
                      <strong className="text-amber-300">Team Name and Domains are permanent.</strong> Once created, they cannot be changed. Skills and team size can be updated later.
                    </p>
                  </div>

                  <div className="flex justify-between pt-2">
                    <button type="button" onClick={() => setStep(3)} className="btn-secondary text-sm flex items-center gap-2">
                      <ArrowLeft size={15} /> Back
                    </button>
                    <button
                      type="button"
                      disabled={saving || !isAllValid}
                      onClick={handleSubmit}
                      className="btn-primary text-sm flex items-center gap-2 px-8"
                    >
                      {saving ? (
                        <><RefreshCw size={15} className="animate-spin" /> Creating Team...</>
                      ) : (
                        <><CheckCircle2 size={15} /> Confirm & Create Team</>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
