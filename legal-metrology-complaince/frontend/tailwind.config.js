/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Fraunces"', "Georgia", "serif"],
        sans: ['"Sora"', "system-ui", "sans-serif"],
      },
      colors: {
        ink: {
          950: "#07090f",
          900: "#0c1220",
          800: "#141c2e",
          700: "#1c2740",
        },
        brass: {
          300: "#f0d59a",
          400: "#e0b15b",
          500: "#c4922e",
        },
        tide: {
          300: "#5eead4",
          400: "#2dd4bf",
        },
      },
      boxShadow: {
        glow: "0 0 80px rgba(224,177,91,0.12)",
      },
    },
  },
  plugins: [],
};
