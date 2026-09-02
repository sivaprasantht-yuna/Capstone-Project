import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Info, ShieldAlert } from 'lucide-react'
import { DOMAIN_OPTIONS } from '../data/skillLibrary'

interface DomainMultiSelectProps {
  selectedDomains: string[]
  onChange: (domains: string[]) => void
  maxDomains?: number
  label?: string
  disabled?: boolean
}

export default function DomainMultiSelect({
  selectedDomains,
  onChange,
  maxDomains = 3,
  label,
  disabled = false,
}: DomainMultiSelectProps) {
  const [search, setSearch] = useState('')

  const toggleDomain = (domain: string) => {
    if (disabled) return
    if (selectedDomains.includes(domain)) {
      onChange(selectedDomains.filter(d => d !== domain))
    } else {
      if (selectedDomains.length >= maxDomains) return
      onChange([...selectedDomains, domain])
    }
  }

  const filteredDomains = DOMAIN_OPTIONS.filter(d =>
    d.toLowerCase().includes(search.toLowerCase())
  )

  const maxReached = selectedDomains.length >= maxDomains

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
            {label}
          </label>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              maxReached
                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                : 'bg-primary-50 text-primary-700'
            }`}
          >
            {selectedDomains.length} / {maxDomains} Selected
          </span>
        </div>
      )}

      {/* Selected Domain Chips */}
      {selectedDomains.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
          {selectedDomains.map(domain => (
            <motion.span
              key={domain}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200"
            >
              <span>{domain}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => toggleDomain(domain)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  ×
                </button>
              )}
            </motion.span>
          ))}
        </div>
      )}

      {/* Domain Selection Grid */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Filter domains (e.g. Robotics, AI, Web, Cloud)..."
          className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-primary-500"
          disabled={disabled}
        />

        {maxReached && (
          <div className="flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
            <Info size={14} className="flex-shrink-0" />
            <span>Maximum {maxDomains} domains allowed. Deselect one to choose another.</span>
          </div>
        )}

        <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto custom-scrollbar p-1">
          {filteredDomains.map(domain => {
            const isSelected = selectedDomains.includes(domain)
            const isSelectable = isSelected || !maxReached

            return (
              <button
                key={domain}
                type="button"
                disabled={disabled || (!isSelected && maxReached)}
                onClick={() => toggleDomain(domain)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-teal text-white shadow-sm font-bold'
                    : isSelectable
                    ? 'bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-slate-200 shadow-xs'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                }`}
              >
                {isSelected && <Check size={12} />}
                <span>{domain}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
