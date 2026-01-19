/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./presentation.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        secondary: '#6366f1',
        'background-light': '#f3f4f6',
        'background-dark': '#18181b',
        'surface-light': '#ffffff',
        'surface-dark': '#27272a',
        'border-light': '#e5e7eb',
        'border-dark': '#3f3f46',
        success: '#22c55e',
        danger: '#ef4444',
        warning: '#f59e0b',
        // Extend purple palette
        purple: {
          DEFAULT: '#a855f7',
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
          950: '#3b0764',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow': '0 0 15px rgba(59, 130, 246, 0.5)',
        'glow-success': '0 0 15px rgba(34, 197, 94, 0.3)',
        'glow-danger': '0 0 15px rgba(239, 68, 68, 0.3)',
        'glow-warning': '0 0 15px rgba(245, 158, 11, 0.3)',
        'glow-purple': '0 0 15px rgba(168, 85, 247, 0.3)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
