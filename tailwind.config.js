/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        honey: {
          50: '#fffbf0',
          100: '#fff4d9',
          200: '#ffe7b3',
          300: '#ffd580',
          400: '#ffbc4d',
          500: '#f5a020',
          600: '#d98410',
          700: '#b36808',
          800: '#8a5006',
          900: '#5c3704',
        },
        gold: {
          50: '#fdfaef',
          100: '#faf3d6',
          200: '#f3e4aa',
          300: '#eccf73',
          400: '#e2b440',
          500: '#d49a1f',
          600: '#bc7e16',
          700: '#9c6114',
          800: '#7e4d16',
          900: '#674015',
        },
        brown: {
          50: '#faf7f2',
          100: '#f1eae0',
          200: '#e2d4bf',
          300: '#cfb895',
          400: '#bb976a',
          500: '#a87d4d',
          600: '#916540',
          700: '#744e35',
          800: '#5e4030',
          900: '#4d3629',
        },
        cream: {
          50: '#fefdfb',
          100: '#fdf9f3',
          200: '#faf1e3',
          300: '#f4e5cc',
          400: '#ecd2aa',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
