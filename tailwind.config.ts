// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    darkMode: 'class', // Vital para el modo oscuro manual
    theme: {
        extend: {
            screens: {
                'xxs': '320px',
                'xs': '375px',
                'sm': '640px',
                'md': '768px',
                'lg': '1024px',
                'xl': '1280px',
                '2xl': '1536px',
            },
            colors: {
                // Azul profundo para elegancia
                'b-blue': {
                    50: '#eef2ff',
                    900: '#0f172a', // Fondo Modo Oscuro
                    950: '#020617', // Variación más profunda
                },
                // Dorado para el toque festivo
                'b-gold': {
                    DEFAULT: '#d4af37', // Dorado clásico
                    light: '#f9d71c',   // Para hover o brillo
                    dark: '#b8860b',    // Para sombras o bordes
                },
            },
            fontFamily: {
                playfair: ['var(--font-playfair)', 'serif'],
                satisfy: ['var(--font-satisfy)', 'cursive'],
                poppins: ['var(--font-poppins)', 'sans-serif'],
            },
        },
    },
    plugins: [],
};
export default config;