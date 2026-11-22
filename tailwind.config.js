/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#eef2f9',
          100: '#d6e0f2',
          200: '#adc1e5',
          300: '#7f9ed4',
          400: '#4e77bf',
          500: '#2d549d',
          600: '#1f3e7a',
          700: '#172e5c',
          800: '#0f2042',
          900: '#0a162e',
          950: '#060d1c',
        },
        royal: {
          50: '#eff4ff',
          100: '#dbe6fe',
          200: '#bfd3fe',
          300: '#93b4fd',
          400: '#608efa',
          500: '#3b68f6',
          600: '#254aeb',
          700: '#1d38d8',
          800: '#1e2faf',
          900: '#1e2d8a',
        },
        violet: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        dyslexic: ['"OpenDyslexic"', '"Comic Sans MS"', 'Verdana', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(15, 32, 66, 0.06), 0 1px 2px -1px rgba(15, 32, 66, 0.04)',
        elevated: '0 10px 25px -5px rgba(15, 32, 66, 0.08), 0 8px 10px -6px rgba(15, 32, 66, 0.04)',
      },
    },
  },
  plugins: [],
};
