import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#f4f8fb",
          100: "#e7eef5",
          700: "#18405f",
          800: "#123554",
          900: "#0f2a44"
        },
        action: "#2d8cff",
        line: "#d8e0e8"
      },
      boxShadow: {
        panel: "0 16px 42px rgba(15, 42, 68, 0.08)",
        tight: "0 8px 20px rgba(15, 42, 68, 0.07)"
      }
    }
  },
  plugins: []
};

export default config;
