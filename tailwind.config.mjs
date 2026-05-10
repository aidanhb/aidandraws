/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#160912',
        text: {
          DEFAULT: '#FFFFFF',
          title: '#FFE4A8',
          link: '#C2CEFF',
          secondary: '#C2FFE1',
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
