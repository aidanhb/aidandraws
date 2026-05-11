/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--color-bg) / <alpha-value>)',
        text: {
          DEFAULT: 'rgb(var(--color-text) / <alpha-value>)',
          title: 'rgb(var(--color-text-title) / <alpha-value>)',
          link: 'rgb(var(--color-text-link) / <alpha-value>)',
          secondary: 'rgb(var(--color-text-secondary) / <alpha-value>)',
        },
      },
      fontFamily: {
        heading: ['"Josefin Sans"', 'sans-serif'],
        body: ['"Space Grotesk"', 'sans-serif'],
      },
      fontSize: {
        h1: ['4rem', { lineHeight: '1.2', fontWeight: '400' }],
        h2: ['3.8rem', { lineHeight: '1.2', fontWeight: '400' }],
        h3: ['3rem', { lineHeight: '1.2', fontWeight: '400' }],
        h4: ['2.4rem', { lineHeight: '1.2', fontWeight: '400' }],
        p1: ['1.4rem', { lineHeight: '1.5', fontWeight: '400' }],
        p2: ['1rem', { lineHeight: '1.5', fontWeight: '400' }],
        p3: ['0.9rem', { lineHeight: '1.5', fontWeight: '400' }],
      },
      maxWidth: {
        content: '1200px',
      },
    },
  },
  plugins: [],
};
