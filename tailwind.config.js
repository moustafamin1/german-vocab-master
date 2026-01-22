/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: "#09090b", // zinc-950
          secondary: "#18181b", // zinc-900
        },
        primary: {
          DEFAULT: "#f4f4f5", // zinc-100
          muted: "#a1a1aa", // zinc-400
        }
      }
    },
  },
  plugins: [],
}
