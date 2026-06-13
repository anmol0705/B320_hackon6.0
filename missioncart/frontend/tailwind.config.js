/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        amazon: {
          orange: '#FF9900',
          'orange-dark': '#E47911',
          bg: '#FFFFFF',
          'bg-secondary': '#F3F3F3',
          border: '#DDDDDD',
          text: '#0F1111',
          'text-secondary': '#565959',
          link: '#007185',
          green: '#007600',
          star: '#FFA41C',
          prime: '#00A8E1',
          red: '#CC0C39',
          sponsored: '#0066C0',
          white: '#FFFFFF',
        },
      },
      borderRadius: {
        amazon: '4px',
      },
    },
  },
  plugins: [],
}
