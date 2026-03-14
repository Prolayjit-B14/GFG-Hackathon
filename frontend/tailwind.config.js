/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      colors: {
        brand: {
          50: "#f0f0ff",
          100: "#e5e5ff",
          200: "#c7c7fe",
          300: "#a29bfe",
          400: "#7c6ff7",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
        },
        surface: {
          50: "#fafafa",
          100: "#f4f4f5",
          200: "#e4e4e7",
          800: "#1a1a2e",
          900: "#0f0f1a",
          950: "#09090f",
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-brand": "linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899)",
        "gradient-dark": "linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 100%)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.4s ease-out",
        "slide-in-right": "slideInRight 0.3s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp: { "0%": { transform: "translateY(20px)", opacity: "0" }, "100%": { transform: "translateY(0)", opacity: "1" } },
        slideInRight: { "0%": { transform: "translateX(-20px)", opacity: "0" }, "100%": { transform: "translateX(0)", opacity: "1" } },
        glow: { "0%": { boxShadow: "0 0 20px rgba(99,102,241,0.3)" }, "100%": { boxShadow: "0 0 40px rgba(99,102,241,0.7)" } },
      },
    },
  },
  plugins: [],
};
