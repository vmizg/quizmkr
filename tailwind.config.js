module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      screens: {
        'xs': '480px',
        // => @media (min-width: 480px) { ... }
      },
    },
    
  },
  plugins: [],
};
