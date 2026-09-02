/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary brand — Navy Blue / Royal Blue
        navy: {
          50:  '#eef3fb',
          100: '#d0e2f5',
          200: '#a3c4eb',
          300: '#6fa0d9',
          400: '#3d7cc9',
          500: '#1a5fb4',   // core royal blue
          600: '#1450a0',
          700: '#0e3d80',
          800: '#092d60',
          900: '#051d42',
          950: '#030e24',
        },
        primary: {
          50:  '#eef3fb',
          100: '#d0e2f5',
          200: '#a3c4eb',
          300: '#6fa0d9',
          400: '#3d7cc9',
          500: '#1a5fb4',
          600: '#1450a0',
          700: '#0e3d80',
          800: '#092d60',
          900: '#051d42',
          950: '#030e24',
        },
        // Light surface palette
        surface: {
          DEFAULT: '#f8fafc',
          50:  '#ffffff',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
        },
        // Gold accent — academic achievement feel
        gold: {
          DEFAULT: '#d97706',
          light:   '#f59e0b',
          dark:    '#b45309',
        },
        // Teal accent — fresh, modern
        teal: {
          DEFAULT: '#0d9488',
          light:   '#14b8a6',
          dark:    '#0f766e',
        },
        // Semantic
        accent: {
          DEFAULT: '#0d9488',
          dark:    '#0f766e',
        },
        warning: {
          DEFAULT: '#d97706',
          dark:    '#b45309',
        },
        danger: {
          DEFAULT: '#dc2626',
          dark:    '#b91c1c',
        },
        success: {
          DEFAULT: '#16a34a',
          dark:    '#15803d',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-gradient':   'linear-gradient(160deg, #ffffff 0%, #f8fafc 40%, #f1f5f9 70%, #ffffff 100%)',
        'card-shine':      'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 60%)',
        'accent-gradient': 'linear-gradient(90deg, #1a5fb4, #0d9488)',
        'gold-gradient':   'linear-gradient(90deg, #d97706, #f59e0b)',
        'panel-gradient':  'linear-gradient(160deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)',
      },
      animation: {
        'fade-in':      'fadeIn 0.3s ease-in-out',
        'slide-up':     'slideUp 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.35s ease-out',
        'pulse-slow':   'pulse 4s ease-in-out infinite',
        'float':        'float 8s ease-in-out infinite',
        'shimmer':      'shimmer 2s linear infinite',
        'draw-line':    'drawLine 1s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%':   { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-12px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        drawLine: {
          '0%':   { width: '0%' },
          '100%': { width: '100%' },
        },
      },
      boxShadow: {
        'glow':        '0 0 20px rgba(26, 95, 180, 0.18)',
        'glow-gold':   '0 0 20px rgba(217, 119, 6, 0.18)',
        'glow-teal':   '0 0 20px rgba(13, 148, 136, 0.18)',
        'glow-accent': '0 0 16px rgba(13, 148, 136, 0.15)',
        'card':        '0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        'card-hover':  '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
        'glass':       '0 4px 16px 0 rgba(0, 0, 0, 0.06)',
        'inner-glow':  'inset 0 1px 0 rgba(255,255,255,0.8)',
      },
      borderRadius: {
        'xl2': '1rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
