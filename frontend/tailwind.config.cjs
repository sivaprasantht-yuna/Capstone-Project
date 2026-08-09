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
        // Deep navy for surfaces
        surface: {
          DEFAULT: '#04111f',
          50:  '#07192d',
          100: '#0d2640',
          200: '#163557',
          300: '#1e4570',
        },
        // Gold accent — academic achievement feel
        gold: {
          DEFAULT: '#e8a020',
          light:   '#f4c45a',
          dark:    '#b87c10',
        },
        // Teal accent — fresh, modern
        teal: {
          DEFAULT: '#0ba5a5',
          light:   '#14c4c4',
          dark:    '#077878',
        },
        // Semantic
        accent: {
          DEFAULT: '#0ba5a5',
          dark:    '#077878',
        },
        warning: {
          DEFAULT: '#e8a020',
          dark:    '#b87c10',
        },
        danger: {
          DEFAULT: '#e53e3e',
          dark:    '#c53030',
        },
        success: {
          DEFAULT: '#2f9e44',
          dark:    '#237032',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-gradient':   'linear-gradient(160deg, #04111f 0%, #07192d 40%, #0d2640 70%, #04111f 100%)',
        'card-shine':      'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 60%)',
        'accent-gradient': 'linear-gradient(90deg, #1a5fb4, #0ba5a5)',
        'gold-gradient':   'linear-gradient(90deg, #e8a020, #f4c45a)',
        'panel-gradient':  'linear-gradient(160deg, #07192d 0%, #0d2640 50%, #163557 100%)',
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
        'glow':        '0 0 24px rgba(26, 95, 180, 0.35)',
        'glow-gold':   '0 0 24px rgba(232, 160, 32, 0.35)',
        'glow-teal':   '0 0 24px rgba(11, 165, 165, 0.35)',
        'glow-accent': '0 0 20px rgba(11, 165, 165, 0.3)',
        'card':        '0 4px 24px rgba(0, 0, 0, 0.4), 0 1px 4px rgba(0,0,0,0.3)',
        'card-hover':  '0 8px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(26,95,180,0.2)',
        'glass':       '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
        'inner-glow':  'inset 0 1px 0 rgba(255,255,255,0.08)',
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
