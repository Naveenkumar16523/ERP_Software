/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border-light))",
        input: "hsl(var(--border-medium))",
        ring: "hsl(var(--primary))",
        background: "hsl(var(--bg-primary))",
        foreground: "hsl(var(--text-primary))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--inverse-primary))",
          hover: "hsl(var(--primary-hover))",
          light: "hsl(var(--primary-light))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--inverse-primary))",
          hover: "hsl(var(--secondary-hover))",
          light: "hsl(var(--secondary-light))",
        },
        destructive: {
          DEFAULT: "#ffb4ab",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "hsl(var(--bg-tertiary))",
          foreground: "hsl(var(--text-secondary))",
        },
        accent: {
          DEFAULT: "hsl(var(--bg-tertiary))",
          foreground: "hsl(var(--text-primary))",
        },
        popover: {
          DEFAULT: "hsl(var(--bg-secondary))",
          foreground: "hsl(var(--text-primary))",
        },
        card: {
          DEFAULT: "hsl(var(--bg-secondary))",
          foreground: "hsl(var(--text-primary))",
        },
        // Aetheric Enterprise OS Custom Color Tokens
        'deep': 'hsl(var(--bg-deep))',
        'surface': 'hsl(var(--bg-secondary))',
        'surface-container-low': '#131b2e',
        'surface-container': '#171f33',
        'surface-container-high': '#222a3d',
        'surface-container-highest': '#2d3449',
        'surface-variant': '#2d3449',
        'surface-bright': '#31394d',
        
        'primary-container': '#4f46e5',
        'inverse-primary': '#4d44e3',
        'secondary-container': '#03b5d3',
        'tertiary': '#e0b6ff',
        'tertiary-container': '#8539c0',
        'success-emerald': '#00CA72',
        'error': '#ffb4ab',
        'on-surface': '#dae2fd',
        'on-surface-variant': '#c7c4d8',
        'outline-variant': '#464555',
        'outline': '#918fa1',
        'surface-glass': 'rgba(255, 255, 255, 0.03)',
        'border-subtle': 'rgba(255, 255, 255, 0.08)',

        // Custom additions from ERP variables (retained for backward compatibility)
        success: {
          DEFAULT: "#00CA72",
          light: "rgba(0, 202, 114, 0.12)",
        },
        warning: {
          DEFAULT: "#f59e0b",
          light: "rgba(245, 158, 11, 0.12)",
        },
        danger: {
          DEFAULT: "#ffb4ab",
          light: "rgba(255, 180, 171, 0.12)",
        },
        info: {
          DEFAULT: "#4cd7f6",
          light: "rgba(76, 215, 246, 0.12)",
        },
      },
      borderRadius: {
        lg: "var(--radius-lg)",
        md: "var(--radius-md)",
        sm: "var(--radius-sm)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "sans-serif"],
        heading: ["var(--font-heading)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },

    },
  },
  plugins: [],
}
