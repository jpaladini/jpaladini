import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Azure DevOps brand-adjacent palette; override per-enterprise.
        azure: {
          50: "#eaf3fb",
          100: "#cfe4f7",
          500: "#0078d4",
          600: "#106ebe",
          700: "#005a9e",
        },
      },
    },
  },
  plugins: [],
};

export default config;
