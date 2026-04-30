import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}", // Added for standard Next.js coverage
  ],
  theme: {
    extend: {
      boxShadow: {
        // These keys match the names used in your globals.css @apply rules
        'king-card': '0 20px 40px -10px rgba(0, 0, 0, 0.03)',
        'king-card-hover': '0 60px 120px -30px rgba(0, 0, 0, 0.12)',
        'glass-bar': '0 40px 80px -15px rgba(0, 0, 0, 0.15)',
        'btn-primary-hover': '0 25px 50px -12px rgba(0, 122, 255, 0.4)',
      },
    },
  },
  plugins: [],
};

export default config;