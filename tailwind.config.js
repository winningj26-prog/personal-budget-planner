/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: { colors: {
    brand: { navy: '#0F2A4A', navyLight: '#16345C' },
    positive: { DEFAULT: '#1F9D6B', bg: '#E6F7EF' },
    negative: { DEFAULT: '#E0483E', bg: '#FDECEA' },
    info: { DEFAULT: '#2E7DD1', bg: '#E8F1FC' },
    warning: { DEFAULT: '#E68A2E', bg: '#FDF3E7' },
    analytic: { DEFAULT: '#7C5CD6', bg: '#F1ECFB' },
    surface: '#F5F8FC',
  }, borderRadius: { card: '14px' }, boxShadow: { card: '0 1px 3px rgba(15, 42, 74, 0.08), 0 1px 2px rgba(15, 42, 74, 0.06)' } } },
  plugins: [],
}