module.exports = {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
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
};
