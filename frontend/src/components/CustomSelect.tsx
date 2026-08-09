import { useState, useRef, useEffect } from 'react'
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
}

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Select option',
  required = false,
  className = '',
  id,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Normalize options to object format
  const normalizedOptions: SelectOption[] = options.map(opt =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  )

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
          borderColor: isOpen ? 'rgba(26,95,180,0.6)' : 'rgba(26,95,180,0.2)',
          boxShadow: isOpen ? '0 0 0 3px rgba(26,95,180,0.15)' : 'none',
        }}
      >
        <span className={`truncate text-sm ${!value ? 'text-white/35' : 'text-white font-medium'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          className={`text-white/40 transition-transform duration-200 flex-shrink-0 ${
            isOpen ? 'rotate-180 text-primary-300' : ''
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
            className="absolute left-0 right-0 top-full z-50 min-w-[200px] max-h-60 overflow-y-auto rounded-xl border shadow-card backdrop-blur-md custom-scrollbar py-1"
            style={{
              background: '#07192d',
              borderColor: 'rgba(26,95,180,0.3)',
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(26, 95, 180, 0.2)',
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
                      ? 'text-white/20 cursor-not-allowed bg-transparent'
                      : isSelected
                      ? 'bg-primary-600/25 text-white font-semibold'
                      : 'text-white/75 hover:bg-primary-600/15 hover:text-white'
                  }`}
                  style={{ fontFamily: 'Outfit, Inter, sans-serif' }}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && <Check size={14} className="text-primary-300 flex-shrink-0 ml-2" />}
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
