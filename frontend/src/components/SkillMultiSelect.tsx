import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Check, ChevronDown, Sparkles, Filter } from 'lucide-react'
import { SKILL_LIBRARY, ALL_SKILLS } from '../data/skillLibrary'

interface SkillMultiSelectProps {
  selectedSkills: string[]
  onChange: (skills: string[]) => void
  placeholder?: string
  maxSkills?: number
  label?: string
}

export default function SkillMultiSelect({
  selectedSkills,
  onChange,
  placeholder = 'Search & select engineering skills...',
  maxSkills = 15,
  label,
}: SkillMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const containerRef = useRef<HTMLDivElement>(null)

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      onChange(selectedSkills.filter(s => s !== skill))
    } else {
      if (selectedSkills.length >= maxSkills) return
      onChange([...selectedSkills, skill])
    }
  }

  const removeSkill = (skill: string) => {
    onChange(selectedSkills.filter(s => s !== skill))
  }

  // Filter skills by category & search term
  const filteredCategories = SKILL_LIBRARY.map(cat => {
    if (selectedCategory !== 'ALL' && cat.category !== selectedCategory) {
      return null
    }
    const matchingSkills = cat.skills.filter(s =>
      s.toLowerCase().includes(search.toLowerCase())
    )
    if (matchingSkills.length === 0) return null
    return {
      category: cat.category,
      skills: matchingSkills,
    }
  }).filter(Boolean) as { category: string; skills: string[] }[]

  return (
    <div ref={containerRef} className="space-y-2 relative">
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
            {label}
          </label>
          <span className="text-xs text-slate-400">
            {selectedSkills.length} selected {maxSkills ? `(max ${maxSkills})` : ''}
          </span>
        </div>
      )}

      {/* Trigger & Selected Badges Area */}
      <div
        onClick={() => setIsOpen(true)}
        className={`input-dark min-h-[50px] p-2.5 flex flex-wrap items-center gap-1.5 cursor-pointer transition-all bg-white border ${
          isOpen ? 'border-primary-500 ring-2 ring-primary-500/10' : 'border-slate-300'
        }`}
      >
        {selectedSkills.length === 0 && (
          <span className="text-slate-400 text-sm px-1.5">{placeholder}</span>
        )}

        {selectedSkills.map(skill => (
          <motion.span
            key={skill}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-primary-50 text-primary-700 border border-primary-200 group hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors"
          >
            <span>{skill}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                removeSkill(skill)
              }}
              className="text-slate-400 group-hover:text-red-600 hover:scale-110 transition-transform"
            >
              <X size={13} />
            </button>
          </motion.span>
        ))}

        <div className="ml-auto flex items-center gap-2 pl-2">
          {selectedSkills.length > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onChange([])
              }}
              className="text-xs text-slate-400 hover:text-slate-700 transition-colors"
            >
              Clear
            </button>
          )}
          <ChevronDown
            size={16}
            className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary-600' : ''}`}
          />
        </div>
      </div>

      {/* Dropdown Skill Library Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute left-0 right-0 top-full z-50 rounded-2xl border border-slate-200 bg-white shadow-2xl p-4 custom-scrollbar max-h-80 overflow-y-auto"
            style={{
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            }}
          >
            {/* Header info */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary-700">
                <Sparkles size={14} />
                <span>Centralized Engineering Skill Library</span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-medium"
              >
                Done
              </button>
            </div>

            {/* Search Input */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search skills (e.g. ROS, React, STM32, SolidWorks)..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-9 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-primary-500 focus:bg-white"
                autoFocus
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Category Filter Horizontal Scroll */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2 mb-3 border-b border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setSelectedCategory('ALL')}
                className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                  selectedCategory === 'ALL'
                    ? 'bg-primary-600 text-white font-medium shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                All Categories
              </button>
              {SKILL_LIBRARY.map(cat => (
                <button
                  key={cat.category}
                  type="button"
                  onClick={() => setSelectedCategory(cat.category)}
                  className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                    selectedCategory === cat.category
                      ? 'bg-primary-600 text-white font-medium shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  {cat.category}
                </button>
              ))}
            </div>

            {/* Skill Lists by Category */}
            <div className="space-y-4">
              {filteredCategories.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No predefined skills matching "{search}".
                  <p className="text-[11px] text-slate-400 mt-1">
                    Custom skills are restricted to ensure standardized matching.
                  </p>
                </div>
              ) : (
                filteredCategories.map(cat => (
                  <div key={cat.category} className="space-y-1.5">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      {cat.category}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {cat.skills.map(skill => {
                        const isSelected = selectedSkills.includes(skill)
                        return (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => toggleSkill(skill)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                              isSelected
                                ? 'bg-primary-600 text-white shadow-xs font-semibold'
                                : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                          >
                            {isSelected && <Check size={12} />}
                            <span>{skill}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
