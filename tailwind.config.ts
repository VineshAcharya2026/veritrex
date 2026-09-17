import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Core brand palette, sampled from the Veritra logo artwork:
        // deep navy field, teal checkmark, amber/gold arrow tip.
        primary: {
          DEFAULT: "#000000",
          foreground: "#FFFFFF",
        },
        accent: {
          DEFAULT: "#14B8A6",
          foreground: "#FFFFFF",
        },
        gold: {
          DEFAULT: "#FBBF24",
          dark: "#F59E0B",
          light: "#FEF3C7",
          foreground: "#0A1628",
        },
        surface: "#F8FAFC",
        success: "#2D6A4F",
        warning: "#E76F51",
        error: "#C1121F",
        muted: {
          DEFAULT: "#6B7280",
          foreground: "#6B7280",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        landing: {
          black: "#000000",
          teal: "#14B8A6",
          tealDark: "#0F9488",
          tealLight: "#EFFCFA",
          mint: "#5EEAD4",
          gold: "#FBBF24",
          goldDark: "#F59E0B",
          goldLight: "#FEF3C7",
          navy: "#000000",
        },
      },
      borderRadius: {
        lg: "8px",
        md: "6px",
        sm: "4px",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(20 184 166 / 0.08), 0 1px 2px -1px rgb(10 22 40 / 0.06)",
        "card-hover": "0 4px 12px 0 rgb(20 184 166 / 0.12), 0 2px 4px -2px rgb(10 22 40 / 0.06)",
        subtle: "0 1px 2px 0 rgb(10 22 40 / 0.06)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
      transitionDuration: {
        DEFAULT: "200ms",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "translate(-50%, -48%) scale(0.96)" },
          to: { opacity: "1", transform: "translate(-50%, -50%) scale(1)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out forwards",
        "scale-in": "scale-in 0.25s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
