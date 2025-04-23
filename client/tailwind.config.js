// tailwind.config.js
module.exports = {
  purge: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  darkMode: false,
  theme: {
    extend: {
      colors: {
        'blood-red': '#B91C1C',
        'blood-red-dark': '#991B1B',
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'], // Define Inter as a custom font
      },
    },
  },
  variants: {},
  plugins: [],
};