/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0a0f1c',
          800: '#0f172a',
          700: '#1e293b'
        },
        electric: '#00f0ff',
        emerald: '#10b981',
        amber: '#f59e0b',
        cyan: '#22d3ee',
        teal: '#14b8a6',
        danger: '#ff3366',
        surface: 'rgba(15, 23, 42, 0.6)',
        surfaceBorder: 'rgba(255, 255, 255, 0.08)'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', "Liberation Mono", "Courier New", 'monospace'],
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
