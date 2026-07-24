/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        legado: {
          50: '#fdf8f3',
          100: '#f9ece0',
          200: '#f0d3b3',
          300: '#e3b47f',
          400: '#d4924f',
          500: '#c17832',
          600: '#a35f26',
          700: '#7f4820',
          800: '#5c341c',
          900: '#3d2314',
        },
        night: {
          800: '#1c1a2e',
          900: '#12111f',
        },
      },
      fontFamily: {
        serif: ['"Source Serif 4"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
