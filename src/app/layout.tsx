import { Metadata, Viewport } from "next";
import { AuthProvider } from "@/context/AuthContext";
import { Playfair_Display, Satisfy, Poppins } from "next/font/google";
import PWARegistry from "@/components/PWARegistry";
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

export const metadata: Metadata = {
    title: "Birthday Hub Luxury",
    description: "An exclusive celebratory space for Catherine.",
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "BdayHub",
    },
    formatDetection: {
        telephone: false,
    },
};

export const viewport: Viewport = {
    themeColor: "#020617",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="es" className={`dark ${playfair.variable} ${satisfy.variable} ${poppins.variable}`}>
            <head>
                <link rel="apple-touch-icon" href="/assets/images/reina.png" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
            </head>
            <body className="bg-b-blue-50 dark:bg-b-blue-900 transition-colors duration-500 font-poppins">
                <PWARegistry />
                <AuthProvider>{children}</AuthProvider>
            </body>
        </html>
    );
}