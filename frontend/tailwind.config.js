/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', '"Noto Sans"', 'sans-serif', '"Apple Color Emoji"', '"Segoe UI Emoji"', '"Segoe UI Symbol"', '"Noto Color Emoji"'],
        mono: ['"SF Mono"', 'Monaco', 'Menlo', 'Consolas', '"Ubuntu Mono"', '"Liberation Mono"', '"DejaVu Sans Mono"', '"Courier New"', 'monospace']
      }
    }
  },
  plugins: [],
};
