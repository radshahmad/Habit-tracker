/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Manrope"', 'system-ui', 'sans-serif'],
        body: ['"Public Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: {
          DEFAULT: '#1C2321',
          soft: '#3A4441',
        },
        paper: {
          DEFAULT: '#F5F6F3',
          raised: '#FFFFFF',
          sunken: '#EBEDE9',
        },
        growth: {
          50: '#EAF3F0',
          100: '#CFE4DC',
          300: '#7CB6A5',
          500: '#2F6F62',
          600: '#255A50',
          700: '#1D473F',
        },
        ember: {
          50: '#FBF0E2',
          100: '#F1D8AF',
          300: '#DBA654',
          500: '#B8792E',
          600: '#966125',
        },
        brick: {
          400: '#C77A64',
          500: '#A8503D',
          600: '#8A4031',
        },
        dark: {
          bg: '#121613',
          surface: '#1B211D',
          surface2: '#232B26',
          border: '#2C352F',
        }
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '16px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(28,35,33,0.06), 0 1px 1px rgba(28,35,33,0.04)',
        raised: '0 4px 14px rgba(28,35,33,0.08)',
      }
    },
  },
  plugins: [],
}
