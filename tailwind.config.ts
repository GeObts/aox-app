import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'aox-dark': '#0a0a0f',
        'aox-dark2': '#12121a',
        'aox-dark3': '#1a1a25',
        'aox-border': 'rgba(255,255,255,0.06)',
        'aox-muted': '#6b7280',
        'aox-cyan': '#00d4ff',
        'aox-orange': '#F7931A',
        'aox-green': '#66c800',
        'aox-blue': '#569cd6',
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      animation: {
        marquee: 'marquee 30s linear infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
