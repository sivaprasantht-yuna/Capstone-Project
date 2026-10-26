import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Lightbulb,
  Search,
  Plus,
  X,
  TrendingUp,
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
  Globe,
  UploadCloud,
  Cpu,
  Database,
  ArrowRight
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
  postedById?: number
  postedByName?: string
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
  ideaSimilarityScore?: number
  institutionName?: string
  createdAt?: string
}

export default function IdeaRepository() {
  const [activeTab, setActiveTab] = useState<'reference' | 'my' | 'showcase'>('reference')
  const [projects, setProjects] = useState<Project[]>([])
  const [myProjects, setMyProjects] = useState<Project[]>([])
  const [showcaseProjects, setShowcaseProjects] = useState<Project[]>([])
  const [domains, setDomains] = useState<string[]>([])
  const [selectedDomain, setSelectedDomain] = useState('')
  const [search, setSearch] = useState('')

  // Form & Modals
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    domain: '',
    techStack: 'Abstract Conceptual Architecture',
    problemStatement: '',
    conceptualVision: '',
    intendedImpact: ''
  })

  // Deduplication & Distillation State in Post Modal
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [rawTextProposal, setRawTextProposal] = useState('')

  // Document / Readme Viewer Modal
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  const fetchData = () => {
    Promise.all([
      api.get('/projects'),
      api.get('/projects/domains'),
      api.get('/projects/my').catch(() => ({ data: [] })),
      api.get('/projects/showcase').catch(() => ({ data: [] }))
    ]).then(([pRes, dRes, myRes, sRes]) => {
      setProjects(pRes.data)
      setDomains(Array.isArray(dRes.data) ? [...dRes.data].sort((a: string, b: string) => a.localeCompare(b)) : [])
      setMyProjects(myRes.data)
      setShowcaseProjects(Array.isArray(sRes.data) ? sRes.data : [])
    })
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Filter projects for Reference, Personal & Inter-College Repository
  const currentList = activeTab === 'my' ? myProjects : activeTab === 'showcase' ? showcaseProjects : projects
  const displayedProjects = currentList.filter(p =>
    (!selectedDomain || p.domain === selectedDomain) &&
    (!search || p.title.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase()))
  )

  // In-Memory Distillation & Vector Deduplication Check
  const handleRunDistillationAndGate = async () => {
    if (!pdfFile && !rawTextProposal.trim()) {
      toast.error('Please upload a PDF/text file or paste your project proposal text.')
      return
    }

    setIsScanning(true)
    const formData = new FormData()
    if (pdfFile) {
      formData.append('file', pdfFile)
    } else {
      formData.append('text', rawTextProposal)
    }

    try {
      const res = await api.post('/projects/distill-and-check', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      const result = res.data
      setScanResult(result)

      if (result.is_duplicate) {
        toast.error(`Duplicate detected in repository: ${result.existing_match?.title} (${(result.similarity * 100).toFixed(1)}% match)`)
      } else {
        toast.success('New Unique Concept Verified! No duplicate found in repository.')
        if (result.distilled) {
          setForm(prev => ({
            ...prev,
            title: result.distilled.title || prev.title,
            domain: result.distilled.domain || prev.domain,
            description: `### Problem Statement\n${result.distilled.problem_statement}\n\n### Conceptual Vision (DNA)\n${result.distilled.conceptual_vision}\n\n### Intended Impact\n${result.distilled.intended_impact}`,
            problemStatement: result.distilled.problem_statement,
            conceptualVision: result.distilled.conceptual_vision,
            intendedImpact: result.distilled.intended_impact
          }))
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to scan and distill document.')
    } finally {
      setIsScanning(false)
    }
  }

  // Submit & Publish Idea
  const submitIdea = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) {
      toast.error('Please enter a project title.')
      return
    }
    if (scanResult?.is_duplicate) {
      toast.error('Cannot publish a duplicate idea. Please revise your concept to be distinct.')
      return
    }

    setLoading(true)
    try {
      const payload = {
        title: form.title,
        description: form.description || form.conceptualVision || 'Abstract Conceptual Mechanism',
        domain: form.domain || 'Interdisciplinary Science & Technology',
        techStack: form.techStack || 'Abstract Conceptual Architecture'
      }

      const res = await api.post('/projects', payload)
      
      // Update both personal repository and reference list
      setMyProjects(prev => [res.data, ...prev])
      setProjects(prev => [res.data, ...prev])
      setShowForm(false)
      setForm({
        title: '',
        description: '',
        domain: '',
        techStack: 'Abstract Conceptual Architecture',
        problemStatement: '',
        conceptualVision: '',
        intendedImpact: ''
      })
      setScanResult(null)
      setPdfFile(null)
      setRawTextProposal('')

      toast.success('Project idea successfully published to your Personal & Reference Repositories!')
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Failed to publish idea.')
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
      toast.success('Upvoted!')
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
            Browse verified institutional capstone proposals and publish unique ideas protected by zero-storage vector deduplication.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary text-sm flex items-center gap-2 shadow-sm flex-shrink-0"
          >
            <Plus size={16} /> Post & Verify Idea
          </button>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2 p-1 rounded-2xl bg-slate-100 border border-slate-200">
          <button
            onClick={() => setActiveTab('reference')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'reference'
                ? 'bg-white text-primary-700 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Globe size={16} /> Reference Repository ({projects.length})
          </button>
          <button
            onClick={() => setActiveTab('my')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'my'
                ? 'bg-white text-primary-700 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <FolderGit2 size={16} /> My Personal Repository ({myProjects.length})
          </button>
          <button
            onClick={() => setActiveTab('showcase')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'showcase'
                ? 'bg-white text-primary-700 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Sparkles size={16} className="text-amber-500" /> Inter-College Showcase ({showcaseProjects.length})
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search repository..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input pl-10 text-sm py-2 bg-white"
            />
          </div>

          <div className="min-w-[180px]">
            <CustomSelect
              value={selectedDomain}
              onChange={setSelectedDomain}
              options={[
                { value: '', label: 'All Domains' },
                ...domains.map(d => ({ value: d, label: d }))
              ]}
              placeholder="Filter by Domain"
            />
          </div>
        </div>
      </div>

      {/* ── Reference & Personal Repository Grid ── */}
      {displayedProjects.length === 0 ? (
        <div className="card text-center py-16 bg-white border border-slate-200">
          <BookOpen className="mx-auto text-slate-400 mb-3 opacity-60" size={40} />
          <h3 className="text-base font-semibold text-slate-700">No project ideas found</h3>
          <p className="text-slate-500 text-xs mt-1">
            {activeTab === 'my' 
              ? "You haven't posted any ideas to your personal repository yet. Click 'Post & Verify Idea' to add one." 
              : activeTab === 'showcase'
              ? "No public ideas currently shared from opted-in institutions."
              : "Try clearing your filters or post a new verified concept."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedProjects.map((p) => (
            <div
              key={p.id}
              className="card bg-white border border-slate-200/90 hover:border-primary-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between p-5 rounded-2xl group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="badge badge-primary text-[10px] font-semibold">
                      {p.domain || 'General Domain'}
                    </span>
                    {p.institutionName && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                        🏛️ {p.institutionName}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    #{p.id}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-primary-600 transition-colors">
                  {p.title}
                </h3>

                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {p.description}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-500" />
                  <span className="text-[11px] font-medium text-slate-600">
                    {p.institutionName || p.postedByName || 'Institutional Author'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => upvote(p.id)}
                    className="flex items-center gap-1 text-slate-600 hover:text-amber-500 transition-colors px-2 py-1 rounded-lg hover:bg-slate-50"
                    title="Upvote idea"
                  >
                    <TrendingUp size={13} className="text-amber-500" />
                    <span className="font-bold text-xs">{p.upvoteCount || 0}</span>
                  </button>

                  <button
                    onClick={() => setSelectedProject(p)}
                    className="btn-outline text-[11px] py-1 px-2.5 rounded-lg flex items-center gap-1"
                  >
                    View Details <ExternalLink size={11} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Post & Verify Modal with In-Memory Deduplication Gate ── */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6 my-8"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Post & Verify Project Idea</h2>
                    <p className="text-xs text-slate-500">
                      Evaluates idea against repository via in-memory zero-storage vector deduplication.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Step 1: Input & Distillation Check */}
              <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200/80">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Cpu size={14} className="text-indigo-600" />
                    1. Upload or Paste Proposal for Vector Gate Check
                  </label>
                  <span className="text-[10px] text-emerald-600 font-medium">
                    100% In-Memory RAM Streaming
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl p-4 text-center cursor-pointer bg-white transition-colors">
                    <input
                      type="file"
                      accept=".pdf,.txt,.md"
                      onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <UploadCloud className="mx-auto text-indigo-500 mb-1" size={24} />
                    <span className="text-xs font-semibold text-slate-700 block">
                      {pdfFile ? pdfFile.name : 'Upload PDF / Text File'}
                    </span>
                    <span className="text-[10px] text-slate-400">PDF, TXT up to 10MB</span>
                  </label>

                  <textarea
                    value={rawTextProposal}
                    onChange={(e) => setRawTextProposal(e.target.value)}
                    placeholder="Or paste technical proposal here..."
                    rows={3}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleRunDistillationAndGate}
                    disabled={isScanning || (!pdfFile && !rawTextProposal.trim())}
                    className={`btn-primary text-xs py-2 px-4 flex items-center gap-2 ${
                      isScanning || (!pdfFile && !rawTextProposal.trim()) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isScanning ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        Scanning Vector Gate...
                      </>
                    ) : (
                      <>
                        <Sparkles size={13} />
                        Run Vector Gate & Distill
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Step 2: Live Gate Banner Results */}
              {scanResult && (
                <div className="space-y-3">
                  {scanResult.is_duplicate ? (
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                      <div className="flex items-center gap-2 font-bold text-amber-800">
                        <AlertTriangle size={15} />
                        Duplicate Idea Gated ({((scanResult.similarity || 0) * 100).toFixed(1)}% Match)
                      </div>
                      <p>
                        This concept matches existing repository idea: <strong>"{scanResult.existing_match?.title}"</strong>. 
                        Publication is restricted to prevent duplicate capstone allocations.
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-1">
                      <div className="flex items-center gap-2 font-bold text-emerald-800">
                        <CheckCircle2 size={15} />
                        Unique Concept Verified (Ready to Publish)
                      </div>
                      <p>
                        Zero-storage cognitive distillation scrubbed all procedural implementation details into pure Idea DNA.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Final Project Submission Form */}
              <form onSubmit={submitIdea} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Decentralized Soil Salinity Equilibrium Sensor Mesh"
                    className="input text-sm w-full py-2 bg-slate-50 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Domain *
                    </label>
                    <input
                      type="text"
                      required
                      value={form.domain}
                      onChange={e => setForm(prev => ({ ...prev, domain: e.target.value }))}
                      placeholder="e.g. Environmental Sustainability"
                      className="input text-sm w-full py-2 bg-slate-50 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Architecture / Tech Scope
                    </label>
                    <input
                      type="text"
                      value={form.techStack}
                      onChange={e => setForm(prev => ({ ...prev, techStack: e.target.value }))}
                      placeholder="e.g. Distributed Telemetry, Algorithmic Edge Consensus"
                      className="input text-sm w-full py-2 bg-slate-50 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Conceptual Overview & Mechanism *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={form.description}
                    onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Problem statement, theoretical mechanism, and intended impact..."
                    className="input text-xs w-full py-2 bg-slate-50 focus:bg-white font-mono"
                  />
                </div>

                {/* Submit Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="btn-outline text-xs py-2 px-4"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || (scanResult?.is_duplicate === true)}
                    className={`btn-primary text-xs py-2 px-5 flex items-center gap-2 ${
                      loading || (scanResult?.is_duplicate === true) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {loading ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" /> Publishing...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={13} /> Publish to Personal & Reference Repo
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Project Documentation Viewer Modal ── */}
      {selectedProject && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="badge badge-primary text-[10px] mb-1">{selectedProject.domain}</span>
                <h2 className="text-lg font-bold text-slate-900">{selectedProject.title}</h2>
              </div>
              <button
                onClick={() => setSelectedProject(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 font-mono text-xs whitespace-pre-wrap text-slate-800 max-h-[60vh] overflow-y-auto leading-relaxed">
              {selectedProject.description || selectedProject.projectOverviewDoc || selectedProject.generatedReadmeMd || 'No documentation available.'}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedProject(null)}
                className="btn-primary text-xs py-2 px-5"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
