/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // Tokens are raw OKLCH "L C H" triplets in :root, wrapped here so that
      // opacity modifiers (bg-primary/10) still work.
      colors: {
        paper: "oklch(var(--paper) / <alpha-value>)",
        surface: "oklch(var(--surface) / <alpha-value>)",
        sunken: "oklch(var(--sunken) / <alpha-value>)",
        ink: "oklch(var(--ink) / <alpha-value>)",
        "ink-muted": "oklch(var(--ink-muted) / <alpha-value>)",
        "ink-subtle": "oklch(var(--ink-subtle) / <alpha-value>)",
        line: "oklch(var(--border) / <alpha-value>)",
        "line-strong": "oklch(var(--border-strong) / <alpha-value>)",
        primary: "oklch(var(--primary) / <alpha-value>)",
        "primary-hover": "oklch(var(--primary-hover) / <alpha-value>)",
        "primary-tint": "oklch(var(--primary-tint) / <alpha-value>)",
        valid: "oklch(var(--valid) / <alpha-value>)",
        "valid-ink": "oklch(var(--valid-ink) / <alpha-value>)",
        "valid-tint": "oklch(var(--valid-tint) / <alpha-value>)",
        pending: "oklch(var(--pending) / <alpha-value>)",
        "pending-ink": "oklch(var(--pending-ink) / <alpha-value>)",
        "pending-tint": "oklch(var(--pending-tint) / <alpha-value>)",
        danger: "oklch(var(--danger) / <alpha-value>)",
        "danger-ink": "oklch(var(--danger-ink) / <alpha-value>)",
        "danger-tint": "oklch(var(--danger-tint) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        serif: ["Spectral", "Georgia", "serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "monospace"],
      },
      borderRadius: {
        md: "0.625rem",
        lg: "0.875rem",
        xl: "1.125rem",
      },
      boxShadow: {
        xs: "0 1px 2px oklch(var(--ink) / 0.06)",
        sm: "0 1px 2px oklch(var(--ink) / 0.06), 0 1px 3px oklch(var(--ink) / 0.04)",
        md: "0 2px 4px oklch(var(--ink) / 0.05), 0 6px 16px oklch(var(--ink) / 0.06)",
        lg: "0 8px 24px oklch(var(--ink) / 0.10), 0 2px 6px oklch(var(--ink) / 0.06)",
        focus: "0 0 0 3px oklch(var(--primary) / 0.28)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.98)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.35s cubic-bezier(0.22, 1, 0.36, 1) both",
        "scale-in": "scale-in 0.2s cubic-bezier(0.22, 1, 0.36, 1) both",
      },
    },
  },
  plugins: [],
};
