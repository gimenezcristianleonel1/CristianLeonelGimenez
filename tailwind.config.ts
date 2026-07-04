import type { Config } from "tailwindcss";
import colors from "tailwindcss/colors";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Verde monte / yerba: color de marca principal, más terroso que un verde SaaS.
        brand: {
          50: "#f2f6ee",
          100: "#e2eada",
          200: "#c6d7b6",
          300: "#a3bd8a",
          400: "#7f9d64",
          500: "#61804a",
          600: "#4a6538",
          700: "#3a4f2c",
          800: "#2f4023",
          900: "#28351e",
        },
        // Terracota / tierra: ofertas, acentos y llamados de atención.
        accent: {
          50: "#fdf4ec",
          100: "#fae6d2",
          200: "#f3c99e",
          300: "#eaa768",
          400: "#de8542",
          500: "#c2692c",
          600: "#a05122",
          700: "#7d3f1d",
          800: "#5f301a",
          900: "#472616",
        },
        // Gris cálido (piedra) en vez del gris frío por defecto, para un fondo tipo papel/madera.
        gray: colors.stone,
      },
      fontFamily: {
        heading: ["var(--font-heading)", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};

export default config;
