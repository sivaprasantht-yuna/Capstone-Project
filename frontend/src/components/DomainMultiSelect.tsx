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
          <label className="text-xs font-semibold uppercase tracking-wider text-white/70">
            {label}
          </label>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              maxReached
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-primary-500/15 text-primary-300'
            }`}
          >
            {selectedDomains.length} / {maxDomains} Selected
          </span>
        </div>
      )}

      {/* Selected Domain Chips */}
      {selectedDomains.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2.5 bg-surface-100/50 rounded-xl border border-white/5">
          {selectedDomains.map(domain => (
            <motion.span
              key={domain}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-teal/20 text-teal-300 border border-teal/30"
            >
              <span>{domain}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => toggleDomain(domain)}
                  className="text-white/40 hover:text-white"
                >
                  ×
                </button>
              )}
            </motion.span>
          ))}
        </div>
      )}

      {/* Domain Selection Grid */}
      <div className="p-3 bg-surface-100/30 border border-white/10 rounded-2xl space-y-3">
        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Filter domains (e.g. Robotics, AI, Web, Cloud)..."
          className="w-full bg-surface-100 border border-white/10 rounded-xl px-3.5 py-1.5 text-xs text-white placeholder-white/30 outline-none focus:border-primary-500"
          disabled={disabled}
        />

        {maxReached && (
          <div className="flex items-center gap-1.5 text-xs text-amber-300 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
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
                    ? 'bg-teal text-white shadow-glow font-bold'
                    : isSelectable
                    ? 'bg-surface-100 text-white/70 hover:bg-white/10 hover:text-white border border-white/5'
                    : 'bg-white/5 text-white/25 cursor-not-allowed border border-white/5'
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
