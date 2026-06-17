/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        green: {
          50: '#e6f5f1',
          100: '#ccebe3',
          200: '#99d7c7',
          300: '#66c3ab',
          400: '#33af8f',
          500: '#009b73',
          600: '#007357', // Primary brand color
          700: '#005741',
          800: '#003b2b',
          900: '#001f15',
          950: '#000f0a',
        },
        gold: {
          50: '#fffbf0',
          100: '#fff7db',
          200: '#ffefb8',
          300: '#ffe694',
          400: '#ffde70',
          500: '#ffd64d',
          600: '#ffb600', // Main gold color
          700: '#cc9200',
          800: '#996d00',
          900: '#664900',
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
