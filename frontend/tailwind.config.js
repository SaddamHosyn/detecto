/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#4ade80',
        'background-light': '#f6f8f6',
        'background-dark': '#18202F',
        'card-dark': '#212a3a',
        'border-dark': 'rgba(255,255,255,0.1)',
        'primary-accent': '#4ade80',
        'primary-dark': '#22c55e',
        'secondary-dark': '#212a3a',
        'surface': '#212a3a',
      },
      fontFamily: {
        display: ['Inter', 'sans-serif'],
      },
      keyframes: {
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
      animation: {
        'slide-in-right': 'slide-in-right 0.3s ease-out',
      },
    },
  },
  plugins: [],
}
