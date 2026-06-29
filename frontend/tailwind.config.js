/** @type {import('tailwindcss').Config} */
// Design tokens map to the CSS variables defined in src/index.css (AGENTS.md §4).
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary)',
          700: 'var(--color-primary-700)',
        },
        accent: 'var(--color-accent)',
        bg: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        border: 'var(--color-border)',
        text: {
          DEFAULT: 'var(--color-text)',
          muted: 'var(--color-text-muted)',
        },
        priority: {
          low: 'var(--priority-low)',
          medium: 'var(--priority-medium)',
          high: 'var(--priority-high)',
        },
      },
      borderRadius: {
        card: '8px',
        column: '12px',
      },
      boxShadow: {
        resting: '0 1px 2px rgba(15,23,42,.06)',
        lifted: '0 8px 24px rgba(15,23,42,.16)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
