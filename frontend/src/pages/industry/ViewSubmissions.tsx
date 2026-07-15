import { useEffect, useState } from 'react'
import { Eye, FileText, Download, Github, ExternalLink } from 'lucide-react'
import api from '../../lib/api'
import { useSelector } from 'react-redux'
import { RootState } from '../../store'

export default function ViewSubmissions() {
  const { user } = useSelector((s: RootState) => s.auth)
  const [submissions, setSubmissions] = useState<any[]>([])

  useEffect(() => {
    // Fetch submissions for projects posted by this industry partner
    api.get('/projects').then(async r => {
      const myProjects = r.data.filter((p: any) => p.postedBy?.id === user?.userId && p.status !== 'OPEN')
      const allSubs: any[] = []
      for (const project of myProjects) {
        try {
          // Each approved project may have a team with submissions
          const teamRes = await api.get(`/teams?projectId=${project.id}`).catch(() => ({ data: null }))
          if (teamRes.data) allSubs.push({ project, team: teamRes.data })
        } catch {}
      }
      setSubmissions(allSubs)
    }).catch(() => {})
  }, [user?.userId])

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Eye className="text-pink-400" size={24} /> Team Submissions
        </h1>
        <p className="text-white/50 text-sm">View project submissions from teams working on your problems</p>
      </div>

      {submissions.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <FileText size={48} className="mx-auto text-white/10 mb-4" />
          <h3 className="text-white/50 font-medium mb-2">No submissions yet</h3>
          <p className="text-white/30 text-sm">
            Submissions will appear here once teams working on your problems submit their milestones.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map(({ project, team }) => (
            <div key={project.id} className="glass-card p-6">
              <h3 className="font-semibold text-white mb-1">{project.title}</h3>
              <p className="text-sm text-white/40 mb-4">Team: {team?.teamName || 'Unassigned'}</p>
              <div className="flex gap-3">
                {team?.submissions?.map((sub: any) => (
                  <div key={sub.id}>
                    {sub.fileUrl && (
                      <a href={sub.fileUrl} target="_blank" rel="noreferrer" className="btn-secondary text-sm flex items-center gap-2 py-2">
                        <Download size={14} /> Download Report
                      </a>
                    )}
                    {sub.githubUrl && (
                      <a href={sub.githubUrl} target="_blank" rel="noreferrer" className="btn-secondary text-sm flex items-center gap-2 py-2">
                        <Github size={14} /> GitHub Repo
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
