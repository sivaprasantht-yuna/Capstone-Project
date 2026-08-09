import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Lightbulb,
  Search,
  Plus,
  X,
  TrendingUp,
  Github,
  FileText,
  Sparkles,
  Upload,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  FolderGit2,
  BookOpen,
  CheckCircle2,
  FileUp,
  RefreshCw,
  Layers,
  Globe
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'
import CustomSelect from '../../components/CustomSelect'

interface Project {
  id: number
  title: string
  description: string
  domain: string
  techStack?: string
  upvoteCount?: number
  status?: string
  postedBy?: { id: number; name: string }
  githubUrl?: string
  pdfDocumentUrl?: string
  projectOverviewDoc?: string
  similarityScore?: number
  similarityFlag?: boolean
  createdAt?: string
}

export default function IdeaRepository() {
  const [activeTab, setActiveTab] = useState<'my' | 'reference'>('reference')
  const [projects, setProjects] = useState<Project[]>([])
  const [myProjects, setMyProjects] = useState<Project[]>([])
  const [domains, setDomains] = useState<string[]>([])
  const [selectedDomain, setSelectedDomain] = useState('')
  const [search, setSearch] = useState('')

  // Form & Modals
  const [showForm, setShowForm] = useState(false)
  const [postOption, setPostOption] = useState<'github' | 'pdf'>('github')
  const [form, setForm] = useState({
    title: '',
    description: '',
    domain: '',
    techStack: '',
    githubUrl: '',
    pdfDocumentUrl: '',
    projectOverviewDoc: ''
  })

  // PDF processing state
  const [pdfUploading, setPdfUploading] = useState(false)
  const [pdfFileName, setPdfFileName] = useState('')
  const [loading, setLoading] = useState(false)

  // Document Overview Modal
  const [selectedDocProject, setSelectedDocProject] = useState<Project | null>(null)

  const fetchData = () => {
    Promise.all([
      api.get('/projects'),
      api.get('/projects/domains'),
      api.get('/projects/my').catch(() => ({ data: [] }))
    ]).then(([pRes, dRes, myRes]) => {
      setProjects(pRes.data)
      setDomains(dRes.data)
      setMyProjects(myRes.data)
    })
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Filter projects for Reference Repository
  const displayedProjects = (activeTab === 'my' ? myProjects : projects).filter(p =>
    (!selectedDomain || p.domain === selectedDomain) &&
    (!search || p.title.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase()))
  )

  // PDF File Upload + AI Overview Document generation
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.pdf')) {
      toast.error('Please select a valid PDF file.')
      return
    }

    setPdfUploading(true)
    setPdfFileName(file.name)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await api.post('/projects/process-pdf', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      const { pdfUrl, projectOverviewDoc } = res.data
      setForm(prev => ({
        ...prev,
        pdfDocumentUrl: pdfUrl || '',
        projectOverviewDoc: projectOverviewDoc || '',
        // Pre-fill description if empty
        description: prev.description || (projectOverviewDoc ? projectOverviewDoc.substring(0, 300) + '...' : '')
      }))

      toast.success('PDF processed! AI Project Overview Document generated.')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to process PDF file.')
    } finally {
      setPdfUploading(false)
    }
  }

  const submitIdea = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) {
      toast.error('Please enter a project title.')
      return
    }

    setLoading(true)
    try {
      const res = await api.post('/projects', form)
      setProjects(prev => [res.data, ...prev])
      setMyProjects(prev => [res.data, ...prev])
      setShowForm(false)
      setForm({
        title: '',
        description: '',
        domain: '',
        techStack: '',
        githubUrl: '',
        pdfDocumentUrl: '',
        projectOverviewDoc: ''
      })
      setPdfFileName('')

      toast.success('Project idea submitted to repository!')
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to post idea.')
    } finally {
      setLoading(false)
    }
  }

  const upvote = async (id: number) => {
    try {
      await api.post(`/projects/${id}/upvote`)
      const updateList = (list: Project[]) =>
        list.map(p => (p.id === id ? { ...p, upvoteCount: (p.upvoteCount || 0) + 1 } : p))
      setProjects(updateList)
      setMyProjects(updateList)
    } catch {
      toast.error('Could not register upvote.')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Top Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
            <Lightbulb className="text-amber-400" size={24} /> Idea Repository
          </h1>
          <p className="text-white/50 text-sm mt-1">
            Explore community projects, upload AI-powered overview documents, and connect your GitHub repositories.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary text-sm flex items-center gap-2 shadow-lg flex-shrink-0"
        >
          <Plus size={16} /> Post Idea
        </button>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2 p-1 rounded-2xl bg-white/5 border border-white/10">
          <button
            onClick={() => setActiveTab('reference')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'reference'
                ? 'bg-primary-600 text-white shadow-md'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Globe size={16} /> Reference Repository ({projects.length})
          </button>
          <button
            onClick={() => setActiveTab('my')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'my'
                ? 'bg-primary-600 text-white shadow-md'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <FolderGit2 size={16} /> My Repository ({myProjects.length})
          </button>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-wrap gap-3 flex-1 max-w-xl justify-end">
          <div className="relative flex-1 min-w-44">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" size={15} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search ideas or keywords..."
              className="input-dark pl-10 text-sm"
            />
          </div>
          <CustomSelect
            value={selectedDomain}
            onChange={setSelectedDomain}
            options={[
              { value: '', label: 'All Domains' },
              ...domains.map(d => ({ value: d, label: d }))
            ]}
            placeholder="All Domains"
            className="w-44"
          />
        </div>
      </div>

      {/* ── Project Cards Grid ── */}
      {displayedProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 rounded-3xl border border-dashed border-white/10 text-center p-6">
          <Lightbulb size={40} className="text-white/20 mb-3" />
          <h3 className="text-white font-semibold">No project ideas found</h3>
          <p className="text-white/40 text-sm mt-1 max-w-sm">
            {activeTab === 'my'
              ? "You haven't posted any ideas to your repository yet. Click 'Post Idea' to get started."
              : 'No project ideas match your search criteria.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {displayedProjects.map((p, i) => {
            const isDup = p.similarityFlag || (p.similarityScore && p.similarityScore > 0.7)
            const simPercent = p.similarityScore ? Math.round(p.similarityScore * 100) : 0

            return (
              <motion.div
                key={p.id || i}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="glass-card-hover p-5 flex flex-col justify-between h-full border border-white/10 relative overflow-hidden"
              >
                <div>
                  {/* Header badges */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {p.domain && <span className="badge badge-primary text-xs">{p.domain}</span>}
                      {/* Uniqueness / Duplicate Badge */}
                      {isDup ? (
                        <span className="badge bg-rose-500/15 text-rose-400 border border-rose-500/30 text-[11px] flex items-center gap-1">
                          <AlertTriangle size={11} /> {simPercent}% Similarity
                        </span>
                      ) : (
                        <span className="badge bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[11px] flex items-center gap-1">
                          <ShieldCheck size={11} /> Unique Idea
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-semibold text-white text-base leading-snug mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    {p.title}
                  </h3>
                  <p className="text-white/55 text-sm line-clamp-3 mb-4 leading-relaxed">{p.description}</p>

                  {/* Tech stack */}
                  {p.techStack && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {p.techStack.split(',').map((t, idx) => (
                        <span key={`${t.trim()}-${idx}`} className="badge badge-accent text-[11px]">
                          {t.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Actions & Links */}
                <div className="pt-3 border-t border-white/8 space-y-3 mt-auto">
                  {/* Document & Github badges if attached */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {p.githubUrl ? (
                      <a
                        href={p.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-white/70 hover:text-white bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg border border-white/10 transition-colors"
                      >
                        <Github size={13} className="text-amber-400" /> GitHub Page
                        <ExternalLink size={10} className="text-white/30" />
                      </a>
                    ) : (
                      <span className="text-xs text-white/30 italic">No GitHub link</span>
                    )}

                    {p.projectOverviewDoc || p.pdfDocumentUrl ? (
                      <button
                        onClick={() => setSelectedDocProject(p)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-400 hover:text-teal-300 bg-teal-500/10 hover:bg-teal-500/20 px-2.5 py-1 rounded-lg border border-teal-500/20 transition-all"
                      >
                        <Sparkles size={12} /> AI Overview Doc
                      </button>
                    ) : null}
                  </div>

                  <div className="flex items-center justify-between text-xs text-white/40 pt-1">
                    <span>by {p.postedBy?.name || 'Student'}</span>
                    <button
                      onClick={() => upvote(p.id)}
                      className="flex items-center gap-1 text-sm font-semibold text-primary-400 hover:text-primary-300 transition-colors"
                    >
                      <TrendingUp size={14} /> {p.upvoteCount || 0}
                    </button>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* ── Modal 1: Post Idea Modal (Option 1: GitHub / Option 2: Core PDF AI Document) ── */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              className="glass-card w-full max-w-xl p-6 border border-white/15 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar"
              style={{ background: 'rgba(10, 25, 45, 0.94)' }}
            >
              <div className="flex items-center justify-between mb-5 border-b border-white/10 pb-3">
                <div>
                  <h2 className="font-bold text-white text-lg flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    <Lightbulb className="text-amber-400" size={20} /> Add to Idea Repository
                  </h2>
                  <p className="text-xs text-white/40 mt-0.5">Post a student project with GitHub or upload a PDF for AI overview document</p>
                </div>
                <button onClick={() => setShowForm(false)} className="text-white/40 hover:text-white">
                  <X size={18} />
                </button>
              </div>

              {/* Option Selector */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <button
                  type="button"
                  onClick={() => setPostOption('github')}
                  className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                    postOption === 'github'
                      ? 'border-primary-500 bg-primary-500/15 text-white shadow-md'
                      : 'border-white/10 bg-white/4 text-white/60 hover:border-white/20'
                  }`}
                >
                  <Github size={20} className={postOption === 'github' ? 'text-primary-400' : 'text-white/40'} />
                  <div>
                    <p className="text-xs font-bold text-white">Option 1: GitHub Page</p>
                    <p className="text-[11px] text-white/50 mt-0.5">Link student's repository & code</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPostOption('pdf')}
                  className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                    postOption === 'pdf'
                      ? 'border-teal-500 bg-teal-500/15 text-white shadow-md'
                      : 'border-white/10 bg-white/4 text-white/60 hover:border-white/20'
                  }`}
                >
                  <Sparkles size={20} className={postOption === 'pdf' ? 'text-teal-400' : 'text-white/40'} />
                  <div>
                    <p className="text-xs font-bold text-white">Option 2: Core PDF & AI Overview</p>
                    <p className="text-[11px] text-white/50 mt-0.5">Upload document for AI analysis</p>
                  </div>
                </button>
              </div>

              <form onSubmit={submitIdea} className="space-y-4">
                <div>
                  <label className="text-xs text-white/50 block mb-1">Project Title *</label>
                  <input
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Autonomous Drone Navigation for Crop Health"
                    required
                    className="input-dark text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs text-white/50 block mb-1">Project Description *</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="Provide a high-level summary of problem, solution, and methodology..."
                    required
                    rows={3}
                    className="input-dark text-sm resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-white/50 block mb-1">Domain</label>
                    <CustomSelect
                      value={form.domain}
                      onChange={val => setForm({ ...form, domain: val })}
                      options={['IoT', 'ML/AI', 'Web', 'Embedded Systems', 'Data Science', 'Robotics', 'Blockchain', 'AR/VR']}
                      placeholder="Select domain"
                      className="w-full text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-white/50 block mb-1">Tech Stack</label>
                    <input
                      value={form.techStack}
                      onChange={e => setForm({ ...form, techStack: e.target.value })}
                      placeholder="e.g. Python, PyTorch, ROS"
                      className="input-dark text-sm"
                    />
                  </div>
                </div>

                {/* Option 1: GitHub Page Input */}
                {postOption === 'github' && (
                  <div>
                    <label className="text-xs text-amber-400 font-semibold block mb-1 flex items-center gap-1.5">
                      <Github size={14} /> Student GitHub Repository / Page Link
                    </label>
                    <input
                      type="url"
                      value={form.githubUrl}
                      onChange={e => setForm({ ...form, githubUrl: e.target.value })}
                      placeholder="https://github.com/username/project-repo"
                      className="input-dark text-sm"
                    />
                  </div>
                )}

                {/* Option 2: Core PDF Upload -> AI Overview Document */}
                {postOption === 'pdf' && (
                  <div className="p-4 rounded-2xl border border-teal-500/25 bg-teal-500/5 space-y-3">
                    <label className="text-xs font-semibold text-teal-400 flex items-center gap-1.5">
                      <Sparkles size={14} /> Upload Core Project Document (PDF)
                    </label>
                    <p className="text-[11px] text-white/50">
                      Upload your project proposal or report. Our AI will automatically extract key text and format a **Project Overview Document**.
                    </p>

                    <div className="flex items-center gap-3">
                      <label className="btn-secondary text-xs flex items-center gap-2 cursor-pointer py-2 px-3 border-teal-500/30">
                        {pdfUploading ? (
                          <>
                            <RefreshCw size={14} className="animate-spin text-teal-400" /> Processing with AI...
                          </>
                        ) : (
                          <>
                            <FileUp size={14} className="text-teal-400" /> Choose PDF File
                          </>
                        )}
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={handlePdfUpload}
                          disabled={pdfUploading}
                          className="hidden"
                        />
                      </label>
                      {pdfFileName && <span className="text-xs text-white/70 truncate max-w-xs">{pdfFileName}</span>}
                    </div>

                    {form.projectOverviewDoc && (
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-emerald-400 flex items-center gap-2">
                        <CheckCircle2 size={15} /> AI Project Overview Document Generated Successfully!
                      </div>
                    )}
                  </div>
                )}

                {/* Submit Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="btn-secondary flex-1 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || pdfUploading}
                    className="btn-primary flex-1 text-sm flex items-center justify-center gap-2"
                  >
                    {loading ? 'Submitting...' : 'Post to Repository'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Modal 2: AI Project Overview Document View ── */}
      <AnimatePresence>
        {selectedDocProject && (
          <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              className="glass-card w-full max-w-3xl p-6 border border-white/15 shadow-2xl relative max-h-[85vh] flex flex-col"
              style={{ background: 'rgba(10, 25, 45, 0.95)' }}
            >
              {/* Header */}
              <div className="flex items-start justify-between border-b border-white/10 pb-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="badge badge-teal text-xs flex items-center gap-1">
                      <Sparkles size={11} /> Project Overview Document
                    </span>
                    {selectedDocProject.domain && (
                      <span className="badge badge-primary text-xs">{selectedDocProject.domain}</span>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    {selectedDocProject.title}
                  </h2>
                  <p className="text-xs text-white/40 mt-0.5">by {selectedDocProject.postedBy?.name || 'Student Author'}</p>
                </div>
                <button
                  onClick={() => setSelectedDocProject(null)}
                  className="text-white/40 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Document Content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2 text-sm text-white/80 leading-relaxed">
                {selectedDocProject.projectOverviewDoc ? (
                  <div className="p-5 rounded-2xl bg-white/4 border border-white/8 space-y-3 font-mono text-xs whitespace-pre-wrap">
                    {selectedDocProject.projectOverviewDoc}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-white/4 border border-white/8">
                    <p className="text-white/60">{selectedDocProject.description}</p>
                  </div>
                )}

                {/* PDF Original File Download if available */}
                {selectedDocProject.pdfDocumentUrl && (
                  <div className="pt-2">
                    <a
                      href={selectedDocProject.pdfDocumentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500/15 text-teal-300 border border-teal-500/30 hover:bg-teal-500/25 transition-all text-xs font-semibold"
                    >
                      <FileText size={14} /> Download Original PDF Project Document
                      <ExternalLink size={11} />
                    </a>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-end">
                <button onClick={() => setSelectedDocProject(null)} className="btn-secondary text-xs px-5">
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
