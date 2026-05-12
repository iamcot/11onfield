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
          50: '#f0f9f4',
          100: '#daf2e4',
          200: '#b8e5cd',
          300: '#88d1ab',
          400: '#54b684',
          500: '#319966',
          600: '#227d51',
          700: '#0c2c1f', // Primary brand color RGB(12, 44, 31)
          800: '#0a2419',
          900: '#081d14',
          950: '#04100e',
        },
      },
    },
  },
  plugins: [],
}
