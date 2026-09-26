/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        admin: {
          bg: 'var(--admin-bg)',
          surface: 'var(--admin-surface)',
          raised: 'var(--admin-raised)',
          border: 'var(--admin-border)',
          muted: 'var(--admin-muted)',
          text: 'var(--admin-text)',
          'text-sub': 'var(--admin-text-sub)',
          accent: 'var(--admin-accent)',
          'accent-soft': 'var(--admin-accent-soft)',
          'accent-text': 'var(--admin-accent-text)',
          danger: 'var(--admin-danger)',
        },
      },
      boxShadow: {
        panel: '0 1px 2px rgba(15, 23, 42, 0.04)',
      },
      borderRadius: {
        panel: '0.75rem',
      },
    },
  },
  plugins: [],
};
