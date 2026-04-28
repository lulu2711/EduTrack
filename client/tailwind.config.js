/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          bg: '#F5F0EB',
          card: '#FFFFFF',
          text: '#2D3436',
          secondary: '#636E72',
          muted: '#B2BEC3',
        },
        accent: {
          gold: '#F4C430',
          coral: '#FF6B6B',
          green: '#00B894',
          blue: '#0984E3',
        },
        dark: {
          bg: '#1E272E',
          surface: '#2D3436',
        },
      },
      fontFamily: {
        display: ['Plus Jakarta Sans', 'Noto Sans SC', 'sans-serif'],
        body: ['Inter', 'Noto Sans SC', 'sans-serif'],
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(45, 52, 54, 0.05)',
        md: '0 4px 12px rgba(45, 52, 54, 0.08)',
        lg: '0 8px 24px rgba(45, 52, 54, 0.12)',
        xl: '0 16px 48px rgba(45, 52, 54, 0.16)',
      },
    },
  },
  plugins: [],
}
