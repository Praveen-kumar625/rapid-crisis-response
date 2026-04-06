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
        primary: '#031D44',   // Deep Navy
        secondary: '#0D9488', // Teal
        'secondary-light': '#2DD4BF', // Bright Teal for text
        accent: '#F59E0B',    // Amber
        softWhite: '#F8FAFC',
        navy: {
          950: '#0B1120', // Refined Deep Navy
          900: '#0a0f1c',
          800: '#0f172a',
          700: '#1e293b'
        },
        electric: {
          DEFAULT: '#00f0ff',
          hover: '#00d8e6',
          glow: 'rgba(0, 240, 255, 0.3)'
        },
        emerald: {
          DEFAULT: '#10b981',
          glow: 'rgba(16, 185, 129, 0.3)'
        },
        danger: {
          DEFAULT: '#ff3366',
          hover: '#e62e5c',
          glow: 'rgba(255, 51, 102, 0.3)'
        },
        warning: {
          DEFAULT: '#f59e0b',
          hover: '#d97706',
          glow: 'rgba(245, 158, 11, 0.3)'
        },
        surface: 'rgba(255, 255, 255, 0.1)',
        surfaceBorder: 'rgba(255, 255, 255, 0.2)'
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
        'mesh-pattern': "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSJub25lIi8+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')",
      },
      animation: {
        'slow-drift': 'drift 20s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 4s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
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
        }
      },
      boxShadow: {
        'electric': '0 0 20px rgba(0, 240, 255, 0.3)',
        'danger': '0 0 20px rgba(255, 51, 102, 0.3)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      }
    },
  },
  plugins: [],
}
