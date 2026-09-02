import { useState } from 'react'
import DOMPurify from 'dompurify'
import { Github, FileText, ExternalLink, RefreshCw, CheckCircle2, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/api'

interface ProjectDocumentationViewerProps {
  projectId: number
  sourceType?: 'GITHUB' | 'DOCUMENT' | 'NONE' | string
  githubRepoUrl?: string
  githubReadmeHtml?: string
  githubLastSyncedAt?: string
  generatedReadmeMd?: string
  projectOverviewDoc?: string
  canRefresh?: boolean
  onSyncSuccess?: (updatedHtml: string, syncedAt: string) => void
}

export default function ProjectDocumentationViewer({
  projectId,
  sourceType = 'NONE',
  githubRepoUrl,
  githubReadmeHtml,
  githubLastSyncedAt,
  generatedReadmeMd,
  projectOverviewDoc,
  canRefresh = true,
  onSyncSuccess
}: ProjectDocumentationViewerProps) {
  const [syncing, setSyncing] = useState(false)
  const [localHtml, setLocalHtml] = useState<string | undefined>(githubReadmeHtml)
  const [localSyncedAt, setLocalSyncedAt] = useState<string | undefined>(githubLastSyncedAt)

  const effectiveHtml = localHtml || githubReadmeHtml
  const effectiveMd = generatedReadmeMd || projectOverviewDoc
  const isGithub = sourceType === 'GITHUB' || Boolean(githubRepoUrl)
  const isDocument = sourceType === 'DOCUMENT' || Boolean(effectiveMd && !isGithub)

  const handleSyncReadme = async () => {
    if (!projectId || syncing) return
    setSyncing(true)
    try {
      const res = await api.post(`/projects/${projectId}/sync-readme`)
      if (res.data) {
        setLocalHtml(res.data.githubReadmeHtml)
        setLocalSyncedAt(res.data.githubLastSyncedAt)
        toast.success('README synchronized with GitHub!')
        if (onSyncSuccess) {
          onSyncSuccess(res.data.githubReadmeHtml, res.data.githubLastSyncedAt)
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to sync README from GitHub')
    } finally {
      setSyncing(false)
    }
  }

  // 1. GitHub README Source
  if (isGithub && githubRepoUrl) {
    const sanitizedHtml = effectiveHtml
      ? DOMPurify.sanitize(effectiveHtml, {
          ADD_ATTR: ['target', 'rel'],
          FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form']
        })
      : ''

    return (
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {/* GitHub Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-slate-50/80 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-slate-900 text-white rounded-lg inline-flex">
              <Github className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Source:</span>
                <span className="text-sm font-semibold text-slate-800 font-mono">
                  {githubRepoUrl.replace(/^https?:\/\/(www\.)?github\.com\//i, '')}
                </span>
              </div>
              {localSyncedAt && (
                <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                  <Clock className="w-3 h-3" />
                  <span>Synced {new Date(localSyncedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canRefresh && (
              <button
                type="button"
                onClick={handleSyncReadme}
                disabled={syncing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-sm transition disabled:opacity-60"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
                {syncing ? 'Syncing...' : 'Sync README'}
              </button>
            )}
            <a
              href={githubRepoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition"
            >
              <span>View on GitHub</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Rendered Sanitized README Content */}
        <div className="p-6 overflow-x-auto max-h-[600px] overflow-y-auto">
          {sanitizedHtml ? (
            <div
              className="prose prose-slate max-w-none prose-headings:font-semibold prose-a:text-blue-600 prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-img:rounded-lg"
              dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
            />
          ) : (
            <div className="p-8 text-center text-slate-500">
              <p>README is being retrieved from GitHub...</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // 2. Document PDF LLM Extraction Source
  if (isDocument && effectiveMd) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {/* Document Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-blue-50/50 border-b border-blue-100">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-blue-600 text-white rounded-lg inline-flex">
              <FileText className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">Source:</span>
                <span className="text-sm font-semibold text-slate-800">Project Proposal Document</span>
              </div>
              <span className="text-xs text-slate-400">Synthesized via AI Document Sanitizer</span>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" /> Verified Document
          </span>
        </div>

        {/* Markdown Rendered Content */}
        <div className="p-6 max-h-[600px] overflow-y-auto">
          <div className="prose prose-slate max-w-none whitespace-pre-line text-slate-700 leading-relaxed">
            {effectiveMd}
          </div>
        </div>
      </div>
    )
  }

  // 3. Fallback / None
  return (
    <div className="p-8 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-center">
      <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
      <p className="text-sm font-medium text-slate-600">No project repository or document linked.</p>
      <p className="text-xs text-slate-400 mt-1">Student team can link a GitHub repository or upload a project PDF.</p>
    </div>
  )
}
