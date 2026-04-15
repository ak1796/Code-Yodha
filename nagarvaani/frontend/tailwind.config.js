/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0D1B40',
          light: '#1A2C5A',
          dark: '#050D21',
        },
        saffron: {
          DEFAULT: '#E8720C',
          light: '#FFB366',
        },
        emerald: {
          DEFAULT: '#0E8A5F',
          light: '#DCFCE7',
        },
        crimson: {
          DEFAULT: '#C0392B',
          light: '#FADBD8',
        },
        amber: {
          DEFAULT: '#F39C12',
          light: '#FEF9E7',
        },
        bg: '#F8F9FC',
        surface: '#FFFFFF',
        border: '#E2E6EF',
        text: {
          primary: '#0D1B40',
          secondary: '#64748B',
        }
      },
      fontFamily: {
        sora: ['Sora', 'sans-serif'],
        sans: ['DM Sans', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 4px 20px -2px rgba(13, 27, 64, 0.05)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      }
    },
  },
  plugins: [],
}
