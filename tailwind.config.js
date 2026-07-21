/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fbf4ed',
          100: '#f5e4d5',
          200: '#edccb1',
          300: '#e0a679',
          400: '#d07e4f',
          500: '#bd5c33',
          600: '#9f4826',
          700: '#7f391f',
          800: '#69301e',
          900: '#57291b',
        },
        slateblue: '#2f332d',
      },
      fontFamily: {
        sans: ['IBM Plex Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        heading: ['Manrope', 'IBM Plex Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 18px 55px -24px rgba(87, 41, 27, 0.24)',
      },
      backgroundImage: {
        'hero-mesh':
          'radial-gradient(circle at top left, rgba(189,92,51,0.14), transparent 36%), radial-gradient(circle at bottom right, rgba(47,51,45,0.1), transparent 34%), linear-gradient(135deg, rgba(255,251,246,0.98), rgba(248,241,232,0.94))',
      },
    },
  },
  plugins: [],
};
