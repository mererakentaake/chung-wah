/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
      },
      colors: {
        navy: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#1e1b4b',
          800: '#0f0e2e',
          900: '#0A0F2C',
          950: '#06091e',
        },
        gold: {
          300: '#fde68a',
          400: '#fcd34d',
          500: '#F9C61F',
          600: '#d97706',
        },
        coral: {
          400: '#f87171',
          500: '#E84545',
          600: '#dc2626',
        },
        emerald: {
          400: '#34d399',
          500: '#10b981',
        },
        purple: {
          400: '#a78bfa',
          500: '#8b5cf6',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.4s ease-out',
        'bounce-in': 'bounceIn 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97)',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s infinite linear',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideInRight: { from: { opacity: 0, transform: 'translateX(30px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        bounceIn: { '0%': { transform: 'scale(0.9)', opacity: 0 }, '50%': { transform: 'scale(1.02)' }, '100%': { transform: 'scale(1)', opacity: 1 } },
        pulseGlow: { '0%, 100%': { boxShadow: '0 0 15px rgba(249,198,31,0.3)' }, '50%': { boxShadow: '0 0 30px rgba(249,198,31,0.6)' } },
        float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      backdropBlur: { xs: '2px' },
      boxShadow: {
        'glow-gold': '0 0 20px rgba(249,198,31,0.4)',
        'glow-coral': '0 0 20px rgba(232,69,69,0.4)',
        'card': '0 4px 24px rgba(0,0,0,0.12)',
        'card-hover': '0 8px 40px rgba(0,0,0,0.2)',
        'nav': '0 -4px 24px rgba(0,0,0,0.15)',
      }
    },
  },
  plugins: [],
}
