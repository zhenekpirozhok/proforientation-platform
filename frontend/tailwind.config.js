/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/pages/**/*.{ts,tsx}",
    "./src/shared/**/*.{ts,tsx}",
    "./src/features/**/*.{ts,tsx}",
    "./src/entities/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
        fontFamily: {
        sans: ["var(--font-inter)", "system-ui"],
        heading: ["var(--font-poppins)", "var(--font-inter)", "system-ui"],
        },
    },
  },
  plugins: [],
};
