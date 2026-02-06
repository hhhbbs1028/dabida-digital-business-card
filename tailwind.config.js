/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e8f2ff',
          100: '#d0e5ff',
          200: '#a1cbff',
          300: '#72b1ff',
          400: '#4397ff',
          500: '#3182f6', // 토스 블루
          600: '#1e6ee6',
          700: '#1a5ad1',
          800: '#1646bc',
          900: '#1232a7',
        },
        // 토스 타이포그래피 색상 시스템
        text: {
          primary: '#333d4b',   // 주요 텍스트
          secondary: '#4e5968', // 부차 텍스트
          tertiary: '#8b95a1',  // 설명 텍스트
        },
        bg: {
          white: '#ffffff',
          gray: '#f2f4f6',
          'gray-light': '#f9fafb',
        },
      },
      fontSize: {
        base: ['16px', { lineHeight: '1.6' }],
      },
      borderRadius: {
        'toss': '16px',
        'toss-lg': '20px',
        'toss-xl': '24px',
      },
      spacing: {
        // 8px 그리드 시스템
        'grid': '8px',
        'grid-2': '16px',
        'grid-3': '24px',
        'grid-4': '32px',
        'grid-5': '40px',
        'grid-6': '48px',
      },
      boxShadow: {
        'toss': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'toss-md': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
      },
    },
  },
  plugins: [],
};
