/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hydra: {
          dark: '#13382B',
          darker: '#0C241B',
          deep: '#1A4938',
          accent: '#C5A880',
          accentLight: '#E8DFD0',
          accentDark: '#A68962',
          sand: '#FAF8F5',
          cream: '#F4F0EB',
          sage: '#EAF1EB',
          sageText: '#3F6352',
          border: '#E8E4DD',
          muted: '#687770',
          charcoal: '#1A211D'
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Cormorant Garamond', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif']
      },
      boxShadow: {
        'luxury': '0 10px 30px -10px rgba(19, 56, 43, 0.08), 0 4px 12px -2px rgba(0, 0, 0, 0.04)',
        'luxury-hover': '0 20px 40px -15px rgba(19, 56, 43, 0.15), 0 8px 20px -4px rgba(0, 0, 0, 0.06)'
      }
    },
  },
  plugins: [],
}
