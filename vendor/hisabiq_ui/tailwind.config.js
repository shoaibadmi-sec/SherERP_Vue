export default {content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  darkMode: 'selector',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px'
      }
    },
    extend: {
      colors: {
        background: 'rgb(var(--color-background) / <alpha-value>)',
        foreground: 'rgb(var(--color-foreground) / <alpha-value>)',
        card: 'rgb(var(--color-card) / <alpha-value>)',
        'card-foreground': 'rgb(var(--color-foreground) / <alpha-value>)',
        popover: 'rgb(var(--color-popover) / <alpha-value>)',
        'popover-foreground': 'rgb(var(--color-foreground) / <alpha-value>)',
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        'primary-foreground': 'rgb(var(--color-primary-foreground) / <alpha-value>)',
        secondary: 'rgb(var(--color-secondary) / <alpha-value>)',
        'secondary-foreground': 'rgb(var(--color-foreground) / <alpha-value>)',
        muted: 'rgb(var(--color-muted) / <alpha-value>)',
        'muted-foreground': 'rgb(var(--color-muted-foreground) / <alpha-value>)',
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
        'accent-foreground': 'rgb(var(--color-accent-foreground) / <alpha-value>)',
        destructive: 'rgb(var(--color-danger) / <alpha-value>)',
        border: 'rgb(var(--color-border) / <alpha-value>)',
        input: 'rgb(var(--color-input) / <alpha-value>)',
        ring: 'rgb(var(--color-ring) / <alpha-value>)',
        'chart-1': 'rgb(var(--color-chart-1) / <alpha-value>)',
        'chart-2': 'rgb(var(--color-chart-2) / <alpha-value>)',
        'chart-3': 'rgb(var(--color-chart-3) / <alpha-value>)',
        'chart-4': 'rgb(var(--color-chart-4) / <alpha-value>)',
        'chart-5': 'rgb(var(--color-chart-5) / <alpha-value>)',
        sidebar: 'rgb(var(--color-card) / <alpha-value>)',
        'sidebar-foreground': 'rgb(var(--color-foreground) / <alpha-value>)',
        'sidebar-primary': 'rgb(var(--color-primary) / <alpha-value>)',
        'sidebar-primary-foreground': 'rgb(var(--color-primary-foreground) / <alpha-value>)',
        'sidebar-accent': 'rgb(var(--color-accent) / <alpha-value>)',
        'sidebar-accent-foreground': 'rgb(var(--color-accent-foreground) / <alpha-value>)',
        'sidebar-border': 'rgb(var(--color-border) / <alpha-value>)',
        'sidebar-ring': 'rgb(var(--color-ring) / <alpha-value>)',
        'destructive-foreground': 'rgb(var(--color-danger) / <alpha-value>)',
        ink: {
          DEFAULT: 'rgb(var(--color-ink) / <alpha-value>)',
          900: 'rgb(var(--color-ink-900) / <alpha-value>)',
          800: 'rgb(var(--color-ink-800) / <alpha-value>)',
          700: 'rgb(var(--color-ink-700) / <alpha-value>)',
          600: 'rgb(var(--color-ink-600) / <alpha-value>)',
          500: 'rgb(var(--color-ink-500) / <alpha-value>)',
          400: 'rgb(var(--color-ink-400) / <alpha-value>)',
          300: 'rgb(var(--color-ink-300) / <alpha-value>)',
          200: 'rgb(var(--color-ink-200) / <alpha-value>)',
          100: 'rgb(var(--color-ink-100) / <alpha-value>)',
          50: 'rgb(var(--color-ink-50) / <alpha-value>)'
        },
        teal: {
          DEFAULT: 'rgb(var(--color-teal) / <alpha-value>)',
          900: 'rgb(var(--color-teal-900) / <alpha-value>)',
          800: 'rgb(var(--color-teal-800) / <alpha-value>)',
          700: 'rgb(var(--color-teal-700) / <alpha-value>)',
          600: 'rgb(var(--color-teal-600) / <alpha-value>)',
          500: 'rgb(var(--color-teal-500) / <alpha-value>)',
          400: 'rgb(var(--color-teal-400) / <alpha-value>)',
          300: 'rgb(var(--color-teal-300) / <alpha-value>)',
          200: 'rgb(var(--color-teal-200) / <alpha-value>)',
          100: 'rgb(var(--color-teal-100) / <alpha-value>)',
          50: 'rgb(var(--color-teal-50) / <alpha-value>)'
        },
        success: { DEFAULT: 'rgb(var(--color-success) / <alpha-value>)', bg: 'rgb(var(--color-success-bg) / <alpha-value>)', solid: 'rgb(var(--color-success-solid) / <alpha-value>)' },
        warning: { DEFAULT: 'rgb(var(--color-warning) / <alpha-value>)', bg: 'rgb(var(--color-warning-bg) / <alpha-value>)', solid: 'rgb(var(--color-warning-solid) / <alpha-value>)' },
        danger: { DEFAULT: 'rgb(var(--color-danger) / <alpha-value>)', bg: 'rgb(var(--color-danger-bg) / <alpha-value>)', solid: 'rgb(var(--color-danger-solid) / <alpha-value>)' },
        info: { DEFAULT: 'rgb(var(--color-info) / <alpha-value>)', bg: 'rgb(var(--color-info-bg) / <alpha-value>)', solid: 'rgb(var(--color-info-solid) / <alpha-value>)' },
        'mint': 'rgb(var(--color-mint) / <alpha-value>)',
        'helper': 'rgb(var(--color-helper) / <alpha-value>)',
        'inverse': 'rgb(var(--color-inverse) / <alpha-value>)',
        'inverse-foreground': 'rgb(var(--color-inverse-foreground) / <alpha-value>)',
        'primary-hover': 'rgb(var(--color-primary-hover) / <alpha-value>)'
      },
      fontFamily: {
        sans: ['Geist', '"Hind Siliguri"', 'system-ui', 'sans-serif'],
        heading: ['Geist', '"Hind Siliguri"', 'sans-serif'],
        bn: ['"Hind Siliguri"', 'Geist', 'sans-serif']
      },
      boxShadow: {
        card: '0 1px 2px rgba(11,26,44,0.04), 0 1px 1px rgba(11,26,44,0.03)',
        pop: '0 12px 32px -8px rgba(11,26,44,0.18), 0 2px 6px rgba(11,26,44,0.06)'
      }
    }
  }
}

