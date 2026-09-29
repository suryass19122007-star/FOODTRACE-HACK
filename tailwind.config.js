export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {
    fontFamily: { display: ['Fraunces', 'Georgia', 'serif'], sans: ['"Plus Jakarta Sans"', '"Noto Sans Tamil"', 'system-ui', 'sans-serif'] },
    colors: { ink: '#1c2b22', paper: '#f7f6f1', leaf: '#1f7a4d', leafsoft: '#e4f2ea', amber2: '#b7791f', ambersoft: '#fbf0d9', rose2: '#b42318', rosesoft: '#fde8e6' }
  } },
  plugins: []
}
