/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gfiBlue: '#1E3A8A', 
        gfiLight: '#F3F4F6'
      }
    },
  },
  plugins: [],
}