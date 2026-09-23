import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#141A21",
        slate: "#3C4A57",
        muted: "#6B7A88",
        line: "#DDE3E8",
        surface: "#F1F4F7",
        panel: "#FFFFFF",
        part: "#C8102E",
        svc: "#24618F",
      },
      fontFamily: {
        sans: ["var(--font-plex-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-plex-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        panel: "0 1px 0 0 #DDE3E8",
      },
    },
  },
  plugins: [],
};

export default config;
