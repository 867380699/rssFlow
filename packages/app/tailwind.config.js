/* eslint-disable @typescript-eslint/no-var-requires */
const plugin = require('tailwindcss/plugin');

module.exports = {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#3880ff',
        secondary: '#3dc2ff',
        tertiary: '#5260ff',
        'ion-toolbar-background': 'var(--ion-toolbar-background)',
      },
      keyframes: {
        brightness: {
          '0%, 50%, 100%': { filter: 'brightness(1)' },
          '25%': { filter: 'brightness(0.92)' },
          '75%': { filter: 'brightness(1.08)' },
        },
      },
      animation: {
        brightness: 'brightness 3s ease infinite',
      },
    },
  },
  plugins: [
    plugin(function ({ addVariant }) {
      addVariant('electron', '.plt-electron &');
    }),
  ],
};
