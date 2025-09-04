/** @type {import('tailwindcss').Config} */
export default {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: '#D4AF37',
        royal: '#113CFC',
        midnight: '#0B1220',
      },
      boxShadow: {
        soft: '0 8px 30px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
};
