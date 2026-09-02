import { useEffect, useState } from 'react'
import { Award, Download, ExternalLink } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import api from '../../lib/api'

export default function CertificatePage() {
  const [team, setTeam] = useState<any>(null)
  const [certificate, setCertificate] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/teams/my').then(async r => {
      if (r.data.length > 0) {
        const t = r.data[0]
        setTeam(t)
        try {
          const certRes = await api.get(`/certificates/team/${t.id}`)
          setCertificate(certRes.data)
        } catch {}
      }
    }).finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Award className="text-amber-500" size={24} /> Certificate of Completion
        </h1>
        <p className="text-slate-500 text-sm">Awarded upon project completion by Admin/Faculty</p>
      </div>

      {certificate ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="card p-8 text-center border border-amber-200 bg-amber-50/30">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Award size={32} className="text-white" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-1">Certificate Ready!</h2>
          <p className="text-slate-600 text-sm mb-2">Certificate No: <span className="text-slate-900 font-mono font-semibold">{certificate.certificateNumber}</span></p>
          <p className="text-slate-400 text-xs mb-6">Issued: {new Date(certificate.issuedAt).toLocaleDateString()}</p>
          <a href={certificate.pdfUrl} target="_blank" rel="noreferrer"
            className="btn-primary inline-flex items-center gap-2">
            <Download size={16} /> Download Certificate PDF
          </a>
        </motion.div>
      ) : (
        <div className="card p-12 text-center">
          <Award size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-slate-700 font-medium mb-2">
            {team ? 'Certificate not yet issued' : 'No team found'}
          </h3>
          <p className="text-slate-500 text-sm">
            {team
              ? 'Complete all milestones and ask your admin/faculty to generate the certificate.'
              : 'Join a team to track certificate progress.'}
          </p>
        </div>
      )}
    </div>
  )
}
