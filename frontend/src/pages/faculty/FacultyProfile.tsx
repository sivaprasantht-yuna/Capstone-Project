// Faculty profile stub
import { useSelector } from 'react-redux'
import { RootState } from '../../store'
import { BookOpen, Star } from 'lucide-react'

export default function FacultyProfile() {
  const { user } = useSelector((s: RootState) => s.auth)
  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2"><BookOpen className="text-emerald-400" size={24} /> My Profile</h1>
      <div className="glass-card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-white text-2xl font-bold">
            {user?.name?.[0]}
          </div>
          <div>
            <div className="font-bold text-white text-xl">{user?.name}</div>
            <div className="text-white/50">{user?.email}</div>
            <div className="text-white/40 text-sm">{user?.department}</div>
          </div>
        </div>
        <p className="text-white/40 text-sm text-center py-8">
          Expertise tags, research areas, and rating management coming from profile API.
        </p>
      </div>
    </div>
  )
}
