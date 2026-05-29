/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#15121b',
        surface: '#15121b',
        'surface-container-lowest': '#0f0d15',
        'surface-container-low': '#1d1a23',
        'surface-container': '#211e27',
        'surface-container-high': '#2c2832',
        'surface-container-highest': '#37333d',
        'surface-variant': '#37333d',
        'on-background': '#e7e0ed',
        'on-surface': '#e7e0ed',
        'on-surface-variant': '#cbc3d7',
        outline: '#958ea0',
        'outline-variant': '#494454',
        primary: '#d0bcff',
        'on-primary': '#3c0091',
        'primary-container': '#a078ff',
        'on-primary-container': '#340080',
        tertiary: '#ffb869',
        'tertiary-container': '#ca801e',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Sora', 'sans-serif'],
        body: ['var(--font-body)', 'Manrope', 'sans-serif'],
      },
      spacing: {
        gutter: '24px',
        'container-mobile': '20px',
        'container-desktop': '80px',
        'section-gap': '48px',
      },
      boxShadow: {
        glow: '0 18px 60px -30px rgba(208, 188, 255, 0.55)',
      },
    },
  },
  plugins: [],
};
