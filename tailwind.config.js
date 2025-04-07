/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './views/**/*.ejs',
    './public/**/*.js',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#4da3ff',
          DEFAULT: '#0077ff',
          dark: '#0055cc',
        },
        secondary: {
          light: '#6c757d',
          DEFAULT: '#495057',
          dark: '#343a40',
        },
      },
    },
  },
  plugins: [],
} 