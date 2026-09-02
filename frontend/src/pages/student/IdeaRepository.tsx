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
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  FolderGit2,
  BookOpen,
  CheckCircle2,
  RefreshCw,
  Layers,
  Globe
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../lib/api'
import CustomSelect from '../../components/CustomSelect'
import ProjectDocumentationViewer from '../../components/ProjectDocumentationViewer'

interface Project {
  id: number
  title: string
  description: string
  domain: string
  techStack?: string
  upvoteCount?: number
  status?: string
  postedBy?: { id: number; name: string }
  sourceType?: 'GITHUB' | 'DOCUMENT' | 'NONE' | string
  githubRepoUrl?: string
  githubUrl?: string
  githubReadmeHtml?: string
  githubLastSyncedAt?: string
  generatedReadmeMd?: string
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
    sourceType: 'GITHUB',
    githubRepoUrl: '',
    githubUrl: '',
    pdfDocumentUrl: '',
    projectOverviewDoc: '',
    generatedReadmeMd: ''
  })

  // PDF processing state
  const [pdfUploading, setPdfUploading] = useState(false)
  const [pdfFileName, setPdfFileName] = useState('')
  const [loading, setLoading] = useState(false)

  // Document / Readme Viewer Modal
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  const fetchData = () => {
    Promise.all([
      api.get('/projects'),
      api.get('/projects/domains'),
      api.get('/projects/my').catch(() => ({ data: [] }))
    ]).then(([pRes, dRes, myRes]) => {
      setProjects(pRes.data)
      setDomains(Array.isArray(dRes.data) ? [...dRes.data].sort((a: string, b: string) => a.localeCompare(b)) : [])
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
        sourceType: 'DOCUMENT',
        pdfDocumentUrl: pdfUrl || '',
        projectOverviewDoc: projectOverviewDoc || '',
        generatedReadmeMd: projectOverviewDoc || '',
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
      const payload = {
        ...form,
        sourceType: postOption === 'github' ? 'GITHUB' : (form.projectOverviewDoc ? 'DOCUMENT' : 'NONE'),
        githubRepoUrl: postOption === 'github' ? (form.githubRepoUrl || form.githubUrl) : '',
        githubUrl: postOption === 'github' ? (form.githubRepoUrl || form.githubUrl) : '',
      }

      const res = await api.post('/projects', payload)
      setProjects(prev => [res.data, ...prev])
      setMyProjects(prev => [res.data, ...prev])
      setShowForm(false)
      setForm({
        title: '',
        description: '',
        domain: '',
        techStack: '',
        sourceType: 'GITHUB',
        githubRepoUrl: '',
        githubUrl: '',
        pdfDocumentUrl: '',
        projectOverviewDoc: '',
        generatedReadmeMd: ''
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
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
            <Lightbulb className="text-amber-500" size={24} /> Idea Repository
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Browse and propose project ideas with unified GitHub README previews and AI-synthesized document overviews.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary text-sm flex items-center gap-2 shadow-xs flex-shrink-0"
        >
          <Plus size={16} /> Post Idea
        </button>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-100 border border-slate-200">
          <button
            onClick={() => setActiveTab('reference')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'reference'
                ? 'bg-white text-primary-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Globe size={16} /> Reference Repository ({projects.length})
          </button>
          <button
            onClick={() => setActiveTab('my')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'my'
                ? 'bg-white text-primary-700 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <FolderGit2 size={16} /> My Repository ({myProjects.length})
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search projects..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input pl-10 text-sm py-2 bg-white"
            />
          </div>

          <div className="min-w-[180px]">
            <CustomSelect
              options={[{ value: '', label: 'All Domains' }, ...domains.map(d => ({ value: d, label: d }))]}
              value={selectedDomain}
              onChange={setSelectedDomain}
              placeholder="All Domains"
            />
          </div>
        </div>
      </div>

      {/* ── Project Cards Grid ── */}
      {displayedProjects.length === 0 ? (
        <div className="card p-12 text-center text-slate-500 bg-white border border-slate-200">
          <Lightbulb className="mx-auto text-slate-400 mb-3 opacity-60" size={40} />
          <p className="font-semibold text-slate-700">No project ideas found</p>
          <p className="text-sm text-slate-400 mt-1">Try refining your search filters or be the first to submit an idea.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedProjects.map(p => {
            const isDup = p.similarityFlag
            const simPercent = Math.round((p.similarityScore || 0) * 100)
            const isGithub = p.sourceType === 'GITHUB' || Boolean(p.githubRepoUrl || p.githubUrl)
            const isDoc = p.sourceType === 'DOCUMENT' || Boolean(p.generatedReadmeMd || p.projectOverviewDoc)

            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card p-5 border border-slate-200 hover:border-primary-300 hover:shadow-md transition-all flex flex-col justify-between bg-white group cursor-pointer"
                onClick={() => setSelectedProject(p)}
              >
                <div>
                  {/* Header badges */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {p.domain && <span className="badge badge-primary text-xs">{p.domain}</span>}
                      
                      {/* Source Type Badge */}
                      {isGithub ? (
                        <span className="badge bg-slate-900 text-white text-[11px] flex items-center gap-1">
                          <Github size={11} /> GitHub
                        </span>
                      ) : isDoc ? (
                        <span className="badge bg-blue-50 text-blue-700 border border-blue-200 text-[11px] flex items-center gap-1">
                          <FileText size={11} /> Document
                        </span>
                      ) : null}

                      {/* Uniqueness / Plagiarism Badge */}
                      {isDup ? (
                        <span className="badge bg-rose-50 text-rose-700 border border-rose-200 text-[11px] flex items-center gap-1">
                          <AlertTriangle size={11} /> {simPercent}% Similarity
                        </span>
                      ) : (
                        <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] flex items-center gap-1">
                          <ShieldCheck size={11} /> Unique
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-semibold text-slate-800 text-base leading-snug mb-2 group-hover:text-primary-600 transition-colors" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    {p.title}
                  </h3>
                  <p className="text-slate-600 text-sm line-clamp-3 mb-4 leading-relaxed">{p.description}</p>

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
                <div className="pt-3 border-t border-slate-100 space-y-3 mt-auto" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => setSelectedProject(p)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg border border-primary-200 transition-all"
                    >
                      <BookOpen size={13} /> View Documentation
                    </button>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400">by {p.postedBy?.name || 'Student'}</span>
                      <button
                        onClick={() => upvote(p.id)}
                        className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-primary-600 transition-colors"
                      >
                        <TrendingUp size={13} /> {p.upvoteCount || 0}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* ── Modal 1: Post Idea Modal ── */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              className="card w-full max-w-xl p-6 border border-slate-200 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar bg-white"
            >
              <div className="flex items-center justify-between mb-5 border-b border-slate-200 pb-3">
                <div>
                  <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    <Lightbulb className="text-amber-500" size={20} /> Add to Idea Repository
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Post a student project with a GitHub repository or project PDF document</p>
                </div>
                <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
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
                      ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <Github size={20} className={postOption === 'github' ? 'text-white' : 'text-slate-700'} />
                  <div>
                    <div className="font-semibold text-xs">GitHub Repository</div>
                    <div className={`text-[11px] mt-0.5 ${postOption === 'github' ? 'text-slate-300' : 'text-slate-400'}`}>
                      Paste repo URL to render live README
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPostOption('pdf')}
                  className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                    postOption === 'pdf'
                      ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <FileText size={20} className={postOption === 'pdf' ? 'text-white' : 'text-blue-600'} />
                  <div>
                    <div className="font-semibold text-xs">Project PDF Document</div>
                    <div className={`text-[11px] mt-0.5 ${postOption === 'pdf' ? 'text-blue-100' : 'text-slate-400'}`}>
                      Upload PDF for AI Markdown synthesis
                    </div>
                  </div>
                </button>
              </div>

              <form onSubmit={submitIdea} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Project Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Autonomous Drone Navigation System"
                    value={form.title}
                    onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                    className="input text-sm py-2 bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Domain</label>
                    <input
                      type="text"
                      placeholder="e.g. IoT, ML/AI, Web"
                      value={form.domain}
                      onChange={e => setForm(prev => ({ ...prev, domain: e.target.value }))}
                      className="input text-sm py-2 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Tech Stack</label>
                    <input
                      type="text"
                      placeholder="e.g. Python, PyTorch, React"
                      value={form.techStack}
                      onChange={e => setForm(prev => ({ ...prev, techStack: e.target.value }))}
                      className="input text-sm py-2 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Description *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Briefly describe what this project aims to accomplish..."
                    value={form.description}
                    onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                    className="input text-sm py-2 bg-white resize-none"
                  />
                </div>

                {/* Conditional Fields based on postOption */}
                {postOption === 'github' ? (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                      <Github size={14} className="text-slate-800" /> GitHub Repository URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://github.com/owner/repository"
                      value={form.githubRepoUrl || form.githubUrl}
                      onChange={e => setForm(prev => ({ ...prev, githubRepoUrl: e.target.value, githubUrl: e.target.value }))}
                      className="input text-sm py-2 bg-white"
                    />
                    <p className="text-[11px] text-slate-500">
                      Skill Sync will validate the repository and securely fetch its rendered README HTML.
                    </p>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200 space-y-3">
                    <label className="text-xs font-semibold text-blue-900 flex items-center gap-1.5">
                      <FileText size={14} className="text-blue-600" /> Upload Project Proposal (PDF)
                    </label>
                    <div className="flex items-center gap-3">
                      <label className="btn-secondary text-xs cursor-pointer inline-flex items-center gap-2 bg-white">
                        <Sparkles size={13} className="text-blue-600" />
                        {pdfUploading ? 'Extracting via AI...' : 'Choose PDF File'}
                        <input
                          type="file"
                          accept="application/pdf"
                          onChange={handlePdfUpload}
                          disabled={pdfUploading}
                          className="hidden"
                        />
                      </label>
                      {pdfFileName && <span className="text-xs text-slate-700 truncate max-w-xs">{pdfFileName}</span>}
                    </div>
                  </div>
                )}

                {/* Submit Actions */}
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1 text-sm">Cancel</button>
                  <button type="submit" disabled={loading || pdfUploading} className="btn-primary flex-1 text-sm">
                    {loading ? 'Submitting...' : 'Post to Repository'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Modal 2: Unified Project Documentation Viewer Modal ── */}
      <AnimatePresence>
        {selectedProject && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              className="card w-full max-w-4xl p-6 border border-slate-200 shadow-2xl relative max-h-[88vh] flex flex-col bg-white"
            >
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-200 pb-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {selectedProject.domain && (
                      <span className="badge badge-primary text-xs">{selectedProject.domain}</span>
                    )}
                    {selectedProject.sourceType === 'GITHUB' || selectedProject.githubRepoUrl ? (
                      <span className="badge bg-slate-900 text-white text-xs flex items-center gap-1">
                        <Github size={11} /> GitHub Source
                      </span>
                    ) : selectedProject.sourceType === 'DOCUMENT' || selectedProject.projectOverviewDoc ? (
                      <span className="badge bg-blue-100 text-blue-800 text-xs flex items-center gap-1">
                        <FileText size={11} /> Document Source
                      </span>
                    ) : null}
                  </div>
                  <h2 className="text-xl font-bold text-slate-800" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    {selectedProject.title}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">by {selectedProject.postedBy?.name || 'Student Author'}</p>
                </div>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Unified Documentation Viewer Component */}
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1">
                <ProjectDocumentationViewer
                  projectId={selectedProject.id}
                  sourceType={selectedProject.sourceType}
                  githubRepoUrl={selectedProject.githubRepoUrl || selectedProject.githubUrl}
                  githubReadmeHtml={selectedProject.githubReadmeHtml}
                  githubLastSyncedAt={selectedProject.githubLastSyncedAt}
                  generatedReadmeMd={selectedProject.generatedReadmeMd || selectedProject.projectOverviewDoc}
                  projectOverviewDoc={selectedProject.projectOverviewDoc}
                  onSyncSuccess={(updatedHtml, syncedAt) => {
                    setSelectedProject(prev => prev ? {
                      ...prev,
                      githubReadmeHtml: updatedHtml,
                      githubLastSyncedAt: syncedAt
                    } : null)
                  }}
                />

                {/* PDF Original File Download if available */}
                {selectedProject.pdfDocumentUrl && (
                  <div className="pt-2">
                    <a
                      href={selectedProject.pdfDocumentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-all text-xs font-semibold"
                    >
                      <FileText size={14} /> Download Original PDF Proposal
                      <ExternalLink size={11} />
                    </a>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end">
                <button onClick={() => setSelectedProject(null)} className="btn-secondary text-xs px-5">
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
