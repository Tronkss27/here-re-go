/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx,js,jsx}',
    './components/**/*.{ts,tsx,js,jsx}',
    './app/**/*.{ts,tsx,js,jsx}',
    './src/**/*.{ts,tsx,js,jsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      // SISTEMA COLORI CENTRALIZZATO - PALETTE COERENTE
      colors: {
        // PALETTE ARANCIONE RIPRISTINATA
        'primary': '#ea580c',           // Arancione principale
        'secondary': '#fb923c',         // Arancione secondario
        'accent': '#fed7aa',            // Arancione chiaro
        'dark': '#1a1a1a',             // Nero
        'light': '#ffffff',            // Bianco
        'grey': '#f3f4f6',             // Grigio
        
        // COLORI SEMANTICI
        'background': '#ffffff',        // Sfondo principale
        'foreground': '#1a1a1a',       // Testo principale
        'muted': '#ea580c',            // Arancione per testi secondari
        'border': '#e5e7eb',           // Bordi neutri
        
        // CARDS E COMPONENTI
        'card': '#ffffff',             // Sfondo cards
        'card-foreground': '#1a1a1a',  // Testo su cards
        
        // INPUTS
        'input': '#ffffff',            // Sfondo inputs
        'input-border': '#e5e7eb',     // Bordi inputs
        
        // MAPPATURA SPORTS COLORS
        'sports-primary': '#ea580c',   // Arancione
        'sports-secondary': '#f3f4f6', // Grigio
        'sports-accent': '#fed7aa',    // Arancione chiaro
        'sports-white': '#ffffff',     // Bianco
        'sports-dark': '#1a1a1a',      // Scuro
      },
      fontFamily: {
        special: ['Special Gothic Expanded One', 'sans-serif'],
        racing: ['Special Elite', 'cursive'],
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} 