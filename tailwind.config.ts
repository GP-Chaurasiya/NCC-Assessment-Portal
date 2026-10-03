import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ncc: {
          navy: {
            DEFAULT: '#0B2545',
            dark: '#07182E',
            light: '#143864',
          },
          red: {
            DEFAULT: '#B71C1C',
            hover: '#9B1414',
            light: '#FDECEC',
          },
          royal: {
            DEFAULT: '#133E87',
            hover: '#0E2F68',
            light: '#EBF1FA',
          },
          sky: {
            DEFAULT: '#4A90E2',
            hover: '#357ABD',
            light: '#EEF5FC',
          },
          gold: {
            DEFAULT: '#D4AF37',
            hover: '#BA982A',
            light: '#FDF9EE',
          },
        },
        // Direct semantic tokens matching exact color names
        'deep-navy': '#0B2545',
        'crimson-red': '#B71C1C',
        'royal-navy': '#133E87',
        'sky-blue': '#4A90E2',
        'golden-brass': '#D4AF37',
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        navy: {
          800: '#0f172a',
          900: '#0a0f1d',
          950: '#05070d',
        }
      },
    },
  },
  plugins: [],
};
export default config;
