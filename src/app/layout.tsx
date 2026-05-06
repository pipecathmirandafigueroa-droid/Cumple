import { AuthProvider } from "@/context/AuthContext";
import { Playfair_Display, Satisfy, Poppins } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-playfair",
});

const satisfy = Satisfy({
    weight: "400",
    subsets: ["latin"],
    display: "swap",
    variable: "--font-satisfy",
});

const poppins = Poppins({
    weight: ["400", "500", "600", "700"],
    subsets: ["latin"],
    display: "swap",
    variable: "--font-poppins",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="es" className={`dark ${playfair.variable} ${satisfy.variable} ${poppins.variable}`}>
            <body className="bg-b-blue-50 dark:bg-b-blue-900 transition-colors duration-500 font-poppins">
                <AuthProvider>{children}</AuthProvider>
            </body>
        </html>
    );
}