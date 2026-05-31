import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#07152f",
          900: "#0b1e3f",
          800: "#0f2a58",
          700: "#173a73"
        }
      },
      boxShadow: {
        soft: "0 20px 70px rgba(20, 49, 95, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
