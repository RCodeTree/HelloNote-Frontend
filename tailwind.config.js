/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        page: 'var(--bg-primary)',
        surface: 'var(--bg-secondary)',
        card: 'var(--bg-card)',
        elevated: 'var(--bg-elevated)',
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        border: {
          DEFAULT: 'var(--border-default)',
        },
        accent: {
          DEFAULT: 'var(--accent-primary)',
          danger: 'var(--accent-danger)',
          olive: 'var(--accent-olive)',
        },
      },
      fontFamily: {
        display: 'var(--font-display)',
        body: 'var(--font-body)',
        mono: 'var(--font-mono)',
      },
      borderRadius: {
        retro: '14px',
        panel: '18px',
      },
      backdropBlur: {
        glass: '18px',
      },
      boxShadow: {
        retro: 'var(--shadow-card)',
        floating: 'var(--shadow-floating)',
      },
    },
  },
  plugins: [],
}
