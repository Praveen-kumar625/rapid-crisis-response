/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
    },
    extend: {
      colors: {
        primary: '#0B0F19',   // Tactical Deep Black
        secondary: '#0D9488', // Teal
        'secondary-light': '#2DD4BF', // Bright Teal for text
        accent: '#F59E0B',    // Amber
        softWhite: '#F8FAFC',
        navy: {
          950: '#0B0F19', // Solid Tactical Black
          900: '#151B2B', // Solid Panel Slate
          800: '#1E293B', // Border/Hover Slate
          700: '#334155'
        },
        electric: {
          DEFAULT: '#00F0FF', // Neon Cyan
          hover: '#0891b2',
          glow: 'rgba(0, 240, 255, 0.4)'
        },
        emerald: {
          DEFAULT: '#10b981',
          glow: 'rgba(16, 185, 129, 0.4)'
        },
        danger: {
          DEFAULT: '#FF3366', // Tactical Red
          hover: '#dc2626',
          glow: 'rgba(255, 51, 102, 0.4)'
        },
        warning: {
          DEFAULT: '#F59E0B',
          hover: '#d97706',
          glow: 'rgba(245, 158, 11, 0.4)'
        },
        surface: '#151B2B',
        surfaceBorder: '#1E293B'
      },
      fontFamily: {
        sans: ['Inter', 'Montserrat', 'system-ui', 'sans-serif'],
        body: ['Inter', 'Source Sans Pro', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', "Liberation Mono", "Courier New", 'monospace'],
      },
      backdropBlur: {
        xs: '2px',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'grid-pattern': "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSJub25lIi8+PHBhdGggZD0iTSA0MCAwIEwgMCAwIDAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9zdmc+')",
      },
      animation: {
        'slow-drift': 'drift 20s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 4s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'scanline': 'scanline 8s linear infinite',
      },
      keyframes: {
        drift: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(2%, 2%) scale(1.1)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.3', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(1.2)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' }
        }
      },
      boxShadow: {
        'neon-cyan': '0 0 15px rgba(0, 240, 255, 0.3)',
        'neon-red': '0 0 15px rgba(255, 51, 102, 0.3)',
        'tactical': '0 4px 20px 0 rgba(0, 0, 0, 0.5)',
      }
    },
  },
  plugins: [],
}
