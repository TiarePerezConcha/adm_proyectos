/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Inter"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        brand: {
          pink: '#DD8396',
          pinkLight: '#F3CED6',
          denim: '#4A6D8C',
          denimDark: '#1F3A5F',
          terracota: '#C96F4A',
          cream: '#FFF8F0',
        },
        lsc: {
          bg: '#0A0C10',
          card: '#12151C',
          cardHover: '#181C26',
          border: '#202634',
          accent: '#70D687',
          yellow: '#ECC94B',
          blue: '#4299E1',
          purple: '#9F7AEA'
        }
      }
    },
  },
  plugins: [],
}
