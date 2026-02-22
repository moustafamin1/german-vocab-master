/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: "hsl(var(--background) / <alpha-value>)",
          secondary: "hsl(var(--card) / <alpha-value>)",
        },
        primary: {
          DEFAULT: "hsl(var(--primary-text) / <alpha-value>)",
          muted: "hsl(var(--muted-text) / <alpha-value>)",
        },
        card: "hsl(var(--card) / <alpha-value>)",
        border: "hsl(var(--border) / <alpha-value>)",
      }
    },
  },
  plugins: [],
}
