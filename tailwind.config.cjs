/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        slate: {
          950: '#07090f',
        },
        lagoon: '#0ea5e9',
      },
      boxShadow: {
        card: '0 10px 35px rgba(7,9,15,0.12)',
      },
    },
  },
  plugins: [],
}
