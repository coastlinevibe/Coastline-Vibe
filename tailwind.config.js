module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primaryTeal: '#006D77',
        seafoam: '#83C5BE',
        coralAccent: '#F4A261',
        sand: '#E9ECEF',
        offWhite: '#F0F8F8',
        darkCharcoal: '#343A40',
        grayLight: '#ADB5BD',
        border: '#E9ECEF',
      },
      fontFamily: {
        sans: ['Montserrat', 'Open Sans', 'ui-sans-serif', 'system-ui'],
        heading: ['Montserrat', 'Poppins', 'ui-sans-serif', 'system-ui'],
        body: ['Open Sans', 'Lato', 'ui-sans-serif', 'system-ui'],
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '16px',
        xl: '20px',
        card: '12px',
        pill: '20px',
      },
      boxShadow: {
        subtle: '0 1px 3px rgba(0,0,0,0.1)',
        elevated: '0 4px 8px rgba(0,0,0,0.15)',
      },
      maxWidth: {
        content: '1200px',
      },
      spacing: {
        1: '4px',
        2: '8px',
        4: '16px',
        6: '24px',
        8: '32px',
        12: '48px',
      },
    },
  },
  plugins: [],
}; 