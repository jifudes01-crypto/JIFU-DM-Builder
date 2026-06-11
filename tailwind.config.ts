import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#F4F6FA",
          100: "#E7ECF4",
          700: "#12345F",
          800: "#0B2345",
          900: "#081A33"
        },
        gold: {
          50: "#FBF7EE",
          100: "#F1E4C8",
          300: "#D8B97A",
          500: "#C8A15A",
          700: "#8E6B2E"
        },
        action: "#C8A15A",
        line: "#DFE5EE"
      },
      boxShadow: {
        panel: "0 22px 55px rgba(8, 26, 51, 0.12)",
        tight: "0 12px 28px rgba(8, 26, 51, 0.08)",
        luxury: "0 18px 45px rgba(8, 26, 51, 0.14)"
      }
    }
  },
  plugins: []
};

export default config;
