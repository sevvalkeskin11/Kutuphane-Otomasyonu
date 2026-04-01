/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#F9F9F9',
        surfaceElevated: '#FFFFFF',
        ink: '#121212',
        inkMuted: '#5F6470',
        accent: '#FF6B35',
        accentDark: '#E85D2C',
        night: '#1E3A5F',
        nightLight: '#2D4A6F',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        sm: '0 2px 10px rgba(18, 18, 18, 0.05)',
        card: '0 4px 24px rgba(18, 18, 18, 0.06)',
        panel: '0 10px 28px rgba(18, 18, 18, 0.08)',
        'card-hover': '0 12px 40px rgba(18, 18, 18, 0.1)',
      },
      borderRadius: {
        panel: '16px',
        card: '12px',
        pill: '9999px',
      },
      spacing: {
        section: '3.5rem',
      },
      keyframes: {
        'hero-blob': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(18%, 12%) scale(1.12)' },
        },
        'hero-blob-2': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(-14%, -10%) scale(1.08)' },
        },
        'hero-shimmer': {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
        'scroll-hint': {
          '0%, 100%': { transform: 'translateX(0)', opacity: '0.85' },
          '50%': { transform: 'translateX(6px)', opacity: '1' },
        },
      },
      animation: {
        'hero-blob': 'hero-blob 24s ease-in-out infinite',
        'hero-blob-2': 'hero-blob-2 30s ease-in-out infinite',
        'hero-shimmer': 'hero-shimmer 14s linear infinite',
        'scroll-hint': 'scroll-hint 2.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
