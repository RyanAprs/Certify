/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#7c3aed",
        secondary: "#00d1b2"
      }
    }
  },
  plugins: []
};
