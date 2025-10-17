/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontSize: {
        "course-details-heading-small": ["26px", "36px"],
        "course-details-heading-large": ["36px", "44px"],
        "home-heading-small": ["36px", "34px"],
        "home-heading-large": ["48px", "56,px"],
        default: ["15px", "21px"],
      },
      colors: {
        primary: {
          light: '#2dd4bf', // A light teal
          DEFAULT: '#14b8a6', // The main teal color
          dark: '#0d9488',  // A darker teal
        },
      },
      gridTemplateColumns: {
        auto: "repeat(auto-fit, minmax(200px, 1fr))",
      },
      spacing: {
        "section-height": "500px",
      },
      maxWidth: {
        "course-card": "424px",
      },
      boxShadow: {
        "custom-card": "0px 4px 15px 2px rgba(0, 0, 0, 0.1)",
      },
    },
  },
  plugins: [],
};
