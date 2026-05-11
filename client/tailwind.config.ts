import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "hsl(222 47% 6%)",
        surface: "hsl(220 30% 9%)",
        surfaceElevated: "hsl(220 28% 12%)",
        border: "hsl(220 18% 20%)",
        muted: "hsl(220 12% 60%)",
        foreground: "hsl(210 40% 96%)",
        primary: "hsl(190 95% 55%)",
        primaryForeground: "hsl(220 30% 8%)",
        accent: "hsl(265 90% 70%)",
        success: "hsl(150 75% 50%)",
        warning: "hsl(40 95% 60%)",
        danger: "hsl(0 80% 60%)",
        critical: "hsl(345 90% 60%)",
      },
      fontFamily: {
        sans: [
          "InterVariable",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },
      boxShadow: {
        card: "0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 30px rgba(0,0,0,0.35)",
        glow: "0 0 0 1px rgba(56,189,248,0.25), 0 12px 60px rgba(56,189,248,0.10)",
      },
      borderRadius: {
        "2xl": "1rem",
      },
      animation: {
        "fade-in": "fadeIn 220ms ease-out",
        "pulse-soft": "pulseSoft 1.6s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
