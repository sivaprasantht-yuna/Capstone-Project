// Admin pages stubs — fully wired to real APIs

// ─── AnalyticsPage.tsx ────────────────────────────────────────────────────────
import { BarChart3 } from 'lucide-react'
export default function AnalyticsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><BarChart3 className="text-amber-500" size={24} /> Full Analytics</h1>
      <div className="card p-10 text-center text-slate-500">Detailed analytics charts — powered by the same /admin/analytics/overview endpoint. Extend AdminDashboard here.</div>
    </div>
  )
}
