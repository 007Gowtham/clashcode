/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        retro: {
          bg: '#FFC8DD',      // Main background (funny pink)
          paper: '#F4F1EA',   // Cards, panels, secondary background
          ink: '#141413',     // Text, borders, shadows (near black)
          muted: '#5F5E5A',   // Secondary text
          border: '#141413',  // Same as ink
          orange: '#FF4D2D',  // Primary accent
          blue: '#1A56DB',    // Secondary accent
          mint: '#10B981',    // Success accent
          yellow: '#FBBF24',  // Warning/Highlight accent
          cream: '#FFFDF9'    // Lightest background (used in navbar)
        }
      },
      fontFamily: {
        heading: ['"Bobby-Jones-Soft"', 'sans-serif'],
        'heading-outline': ['"Bobby-Jones-Soft-Outline"', 'sans-serif'],
      },
      boxShadow: {
        'retro': '4px 4px 0px 0px #141413',
        'retro-sm': '2px 2px 0px 0px #141413',
        'retro-lg': '6px 6px 0px 0px #141413',
        'retro-orange': '4px 4px 0px 0px #FF4D2D',
        'retro-blue': '4px 4px 0px 0px #1A56DB'
      }
    }
  },
  plugins: [],
};
