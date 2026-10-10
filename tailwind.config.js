/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: { 950: '#02060b', 900: '#050d14', 800: '#08141d', 700: '#0d1f2b', 600: '#12303a' },
        neon: { green: '#22ff9c', cyan: '#2de2ff', purple: '#b26bff', magenta: '#ff4fd8' },
        accent: { DEFAULT: '#22ff9c', soft: '#8dffc9', deep: '#00d97e' },
        risk: { critical: '#ff2e63', high: '#ff9f1c', medium: '#ffd23f', low: '#22ff9c' },
      },
      fontFamily: {
        sans: ['"Chakra Petch"', '"Schibsted Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      keyframes: {
        slideDown: { from: { opacity: 0, transform: 'translateY(-16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        rowIn: { from: { opacity: 0, transform: 'translateX(-8px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        grow: { from: { transform: 'scaleX(0)' }, to: { transform: 'scaleX(1)' } },
        pop: { '0%': { transform: 'scale(0)', opacity: 0 }, '70%': { transform: 'scale(1.25)' }, '100%': { transform: 'scale(1)', opacity: 1 } },
        ping2: { '0%': { transform: 'scale(1)', opacity: 0.7 }, '100%': { transform: 'scale(2.6)', opacity: 0 } },
        drift: { '0%': { transform: 'translate3d(0,0,0)' }, '50%': { transform: 'translate3d(40px,-30px,0)' }, '100%': { transform: 'translate3d(0,0,0)' } },
        gridMove: { from: { backgroundPosition: '0 0' }, to: { backgroundPosition: '56px 56px' } },
        scan: { from: { transform: 'translateY(-10vh)' }, to: { transform: 'translateY(110vh)' } },
        spinSlow: { to: { transform: 'rotate(360deg)' } },
        blink: { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.25 } },
      },
      animation: {
        slideDown: 'slideDown .45s cubic-bezier(.2,.8,.2,1) both',
        rowIn: 'rowIn .4s cubic-bezier(.2,.8,.2,1) both',
        grow: 'grow .6s ease-out both',
        pop: 'pop .45s cubic-bezier(.2,.8,.2,1) both',
        ping2: 'ping2 1.8s ease-out infinite',
        drift: 'drift 22s ease-in-out infinite',
        gridMove: 'gridMove 6s linear infinite',
        scan: 'scan 9s linear infinite',
        spinSlow: 'spinSlow 40s linear infinite',
        blink: 'blink 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
