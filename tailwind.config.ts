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
        },
        earth: {
          950: "#24160f",
          900: "#342014",
          800: "#55341f",
          700: "#7a4a2b",
          600: "#9b6238",
          500: "#b97845",
          300: "#dfc2a6",
          200: "#ead8c5",
          100: "#f5eadf",
          50: "#fbf5ee"
        },
        sage: {
          900: "#253322",
          700: "#526542",
          600: "#697d52",
          100: "#edf2e7",
          50: "#f7f9f3"
        },
        paper: {
          100: "#f3eadf",
          50: "#fbf7f0"
        }
      },
      boxShadow: {
        soft: "0 20px 70px rgba(67, 48, 34, 0.10)",
        warm: "0 22px 80px rgba(85, 52, 31, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
