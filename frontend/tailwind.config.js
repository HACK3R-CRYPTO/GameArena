/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          from: '#667eea',
          to: '#764ba2',
        },
        accent: {
          cyan: '#00d4ff',
          purple: '#7b2ff7',
        },
        rank: {
          gold: '#ffd700',
          silver: '#c0c0c0',
          bronze: '#cd7f32',
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'gradient-bg': 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        'gradient-accent': 'linear-gradient(45deg, #00d4ff, #7b2ff7)',
        'gradient-gold': 'linear-gradient(45deg, #ffd700, #ff8c00)',
      },
    },
  },
  plugins: [],
}
