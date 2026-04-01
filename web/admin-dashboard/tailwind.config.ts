import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#1f2937",
        mist: "#fafaf9",
        ocean: "#f97316",
        ember: "#f59e0b"
      }
    }
  },
  plugins: []
};

export default config;
