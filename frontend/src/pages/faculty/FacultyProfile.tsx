// Faculty profile stub
import { useSelector } from 'react-redux'
import { RootState } from '../../store'
import { BookOpen } from 'lucide-react'

export default function FacultyProfile() {
  const { user } = useSelector((s: RootState) => s.auth)
  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><BookOpen className="text-emerald-600" size={24} /> My Profile</h1>
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal flex items-center justify-center text-white text-2xl font-bold shadow-xs">
            {user?.name?.[0]}
          </div>
          <div>
            <div className="font-bold text-slate-800 text-xl">{user?.name}</div>
            <div className="text-slate-600">{user?.email}</div>
            <div className="text-slate-500 text-sm">{user?.department}</div>
          </div>
        </div>
        <p className="text-slate-400 text-sm text-center py-8">
          Expertise tags, research areas, and rating management coming from profile API.
        </p>
      </div>
    </div>
  )
}
