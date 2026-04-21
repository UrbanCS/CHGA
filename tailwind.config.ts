import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        chga: {
          blue: "#151f6d",
          red: "#e31d2f",
          ink: "#141720",
          mist: "#f4f7fb"
        }
      },
      fontFamily: {
        sans: ["Inter", "Montserrat", "system-ui", "sans-serif"]
      },
      boxShadow: {
        soft: "0 12px 32px rgba(15, 23, 42, 0.08)"
      }
    }
  },
  plugins: []
} satisfies Config;
