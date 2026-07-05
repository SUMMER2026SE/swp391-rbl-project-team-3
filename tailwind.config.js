/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary-container": "#008378",
        "on-error-container": "#93000a",
        "surface-bright": "#f5faf8",
        "tertiary": "#924628",
        "surface-container-low": "#f0f5f2",
        "tertiary-fixed": "#ffdbce",
        "secondary-fixed-dim": "#adc6ff",
        "on-secondary": "#ffffff",
        "on-primary": "#ffffff",
        "primary-fixed-dim": "#6bd8cb",
        "primary": "#00685f",
        "background": "#f5faf8",
        "surface-container-high": "#e4e9e7",
        "outline": "#6d7a77",
        "outline-variant": "#bcc9c6",
        "on-background": "#171d1c",
        "secondary-container": "#2170e4",
        "on-surface-variant": "#3d4947",
        "on-tertiary": "#ffffff",
        "error-container": "#ffdad6",
        "inverse-on-surface": "#edf2f0",
        "on-tertiary-fixed": "#370e00",
        "on-tertiary-container": "#fffbff",
        "on-secondary-fixed": "#001a42",
        "on-primary-container": "#f4fffc",
        "secondary-fixed": "#d8e2ff",
        "surface": "#f5faf8",
        "error": "#ba1a1a",
        "tertiary-container": "#b05e3d",
        "inverse-primary": "#6bd8cb",
        "secondary": "#0058be",
        "on-tertiary-fixed-variant": "#773215",
        "on-primary-fixed-variant": "#005049",
        "surface-container": "#eaefed",
        "tertiary-fixed-dim": "#ffb59a",
        "surface-container-highest": "#dee4e1",
        "surface-dim": "#d6dbd9",
        "primary-fixed": "#89f5e7",
        "on-surface": "#171d1c",
        "on-secondary-fixed-variant": "#004395",
        "surface-container-lowest": "#ffffff",
        "inverse-surface": "#2c3130",
        "surface-tint": "#006a61",
        "on-error": "#ffffff",
        "on-secondary-container": "#fefcff",
        "on-primary-fixed": "#00201d",
        "surface-variant": "#dee4e1"
      },
      borderRadius: {
        "DEFAULT": "0.375rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px"
      },
      spacing: {
        "container-max-width": "1280px",
        "margin-mobile": "16px",
        "unit": "8px",
        "margin-desktop": "40px",
        "gutter": "24px"
      },
      fontFamily: {
        "headline-lg-mobile": ["Plus Jakarta Sans", "sans-serif"],
        "headline-lg": ["Plus Jakarta Sans", "sans-serif"],
        "label-sm": ["Plus Jakarta Sans", "sans-serif"],
        "headline-xl": ["Plus Jakarta Sans", "sans-serif"],
        "headline-md": ["Plus Jakarta Sans", "sans-serif"],
        "body-md": ["Plus Jakarta Sans", "sans-serif"],
        "body-lg": ["Plus Jakarta Sans", "sans-serif"]
      },
      fontSize: {
        "headline-lg-mobile": ["28px", { "lineHeight": "1.3", "fontWeight": "700" }],
        "headline-lg": ["32px", { "lineHeight": "1.3", "letterSpacing": "-0.01em", "fontWeight": "700" }],
        "label-sm": ["14px", { "lineHeight": "1.4", "fontWeight": "600" }],
        "headline-xl": ["48px", { "lineHeight": "1.2", "letterSpacing": "-0.02em", "fontWeight": "800" }],
        "headline-md": ["24px", { "lineHeight": "1.4", "fontWeight": "600" }],
        "body-md": ["16px", { "lineHeight": "1.6", "fontWeight": "400" }],
        "body-lg": ["18px", { "lineHeight": "1.6", "fontWeight": "400" }]
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries')
  ],
}
