/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        flux: {
          bg: "var(--flux-bg)",
          surface: "var(--flux-surface)",
          panel: "var(--flux-panel)",
          border: "var(--flux-border)",
          accent: "var(--flux-accent)",
          "accent-dim": "var(--flux-accent-dim)",
          "accent-glow": "var(--flux-accent-glow)",
          text: "var(--flux-text)",
          muted: "var(--flux-muted)",
          success: "var(--flux-success)",
          warning: "var(--flux-warning)",
          error: "var(--flux-error)",
          info: "var(--flux-info)",
        },
      },
      fontFamily: {
        mono: [
          "JetBrains Mono",
          "Fira Code",
          "Cascadia Code",
          "Consolas",
          "monospace",
        ],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.15s ease-in-out",
        "slide-in": "slideIn 0.2s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideIn: {
          "0%": { transform: "translateX(-8px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
      },
      boxShadow: {
        glow: "0 0 20px rgba(99,102,241,0.3)",
        "glow-sm": "0 0 10px rgba(99,102,241,0.2)",
      },
    },
  },
  plugins: [],
};
