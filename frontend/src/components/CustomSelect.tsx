import { useState, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check } from 'lucide-react'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface CustomSelectProps {
  value: string
  onChange: (value: string) => void
  options: (string | SelectOption)[]
  placeholder?: string
  required?: boolean
  className?: string
  id?: string
  sort?: boolean
}

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Select option',
  required = false,
  className = '',
  id,
  sort = true,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Normalize and sort options
  const normalizedOptions: SelectOption[] = useMemo(() => {
    const raw = options.map(opt =>
      typeof opt === 'string' ? { value: opt, label: opt } : opt
    )

    if (!sort) return raw

    // Separate empty/all placeholder option ('', 'all', etc.) to keep at top
    const topItems = raw.filter(opt => opt.value === '' || opt.value.toLowerCase() === 'all')
    const sortableItems = raw.filter(opt => opt.value !== '' && opt.value.toLowerCase() !== 'all')

    // Sort sortable items alphabetically / numerically
    sortableItems.sort((a, b) => {
      // Check if numeric
      const numA = Number(a.value)
      const numB = Number(b.value)
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB
      }
      return a.label.localeCompare(b.label, undefined, { sensitivity: 'base', numeric: true })
    })

    return [...topItems, ...sortableItems]
  }, [options, sort])

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

  const selectedOption = normalizedOptions.find(opt => opt.value === value)

  const handleSelect = (option: SelectOption) => {
    if (option.disabled) return
    onChange(option.value)
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Hidden input for HTML form validation if required */}
      {required && (
        <input
          tabIndex={-1}
          value={value}
          onChange={() => {}}
          required={required}
          className="sr-only absolute pointer-events-none opacity-0"
        />
      )}

      {/* Select trigger button */}
      <button
        type="button"
        id={id}
        onClick={() => setIsOpen(!isOpen)}
        className="input-dark flex items-center justify-between gap-3 text-left cursor-pointer w-full"
        style={{
          borderColor: isOpen ? '#1a5fb4' : '#cbd5e1',
          boxShadow: isOpen ? '0 0 0 3px rgba(26,95,180,0.12)' : 'none',
        }}
      >
        <span className={`truncate text-sm ${!value ? 'text-slate-400' : 'text-slate-800 font-medium'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`text-slate-400 transition-transform duration-200 flex-shrink-0 ${
            isOpen ? 'rotate-180 text-primary-600' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute left-0 right-0 top-full z-50 min-w-[200px] max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl custom-scrollbar py-1"
            style={{
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
            }}
          >
            {normalizedOptions.map(option => {
              const isSelected = option.value === value
              return (
                <button
                  key={option.value}
                  type="button"
                  disabled={option.disabled}
                  onClick={() => handleSelect(option)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors cursor-pointer ${
                    option.disabled
                      ? 'text-slate-300 cursor-not-allowed bg-transparent'
                      : isSelected
                      ? 'bg-primary-50 text-primary-700 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                  style={{ fontFamily: 'Outfit, Inter, sans-serif' }}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && <Check size={14} className="text-primary-600 flex-shrink-0 ml-2" />}
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
