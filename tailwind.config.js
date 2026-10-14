/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        abyss: { 950: '#020617', 900: '#050c1f', 800: '#0a1630', 700: '#10204a' },
        neon: { DEFAULT: '#22d3ee', soft: '#67e8f9', deep: '#0891b2' },
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(34,211,238,.25), 0 0 32px -4px rgba(34,211,238,.45)',
        'glow-lg': '0 0 0 1px rgba(34,211,238,.35), 0 0 60px -6px rgba(34,211,238,.6)',
      },
      keyframes: {
        pulseRing: {
          '0%': { transform: 'scale(.9)', opacity: '.7' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
        flow: { to: { strokeDashoffset: '-20' } },
      },
      animation: {
        'pulse-ring': 'pulseRing 2.4s ease-out infinite',
        flow: 'flow 1s linear infinite',
      },
    },
  },
  plugins: [],
}
