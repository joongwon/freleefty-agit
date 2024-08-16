/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,js,jsx,ts,tsx}",
    "./app/**/*.{html,js,jsx,ts,tsx}",
    "./public/**/*.{html,js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["GMarketSansMedium", "sans-serif"],
        mono: ["Noto Sans Mono", "monospace"],
      },
      animation: {
        disappear: "disappear 0.5s forwards",
      },
      keyframes: {
        disappear: {
          "0%": { visibility: "visible" },
          "100%": { visibility: "hidden" },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
