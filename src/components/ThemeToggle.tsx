"use client";
import { useEffect, useState } from "react";

interface ThemeToggleProps {
    className?: string;
}

export default function ThemeToggle({ className = "" }: ThemeToggleProps) {
    const [isDark, setIsDark] = useState(true);

    useEffect(() => {
        const saved = localStorage.getItem("birthdayhub_theme");
        if (saved === "light") {
            setIsDark(false);
            return;
        }
        setIsDark(true);
    }, []);

    useEffect(() => {
        const root = window.document.documentElement;
        if (isDark) {
            root.classList.add("dark");
            localStorage.setItem("birthdayhub_theme", "dark");
        } else {
            root.classList.remove("dark");
            localStorage.setItem("birthdayhub_theme", "light");
        }
    }, [isDark]);

    return (
        <button
            onClick={() => setIsDark(!isDark)}
            className={`p-3 rounded-full bg-b-gold/20 border-2 border-b-gold hover:scale-110 transition-all shadow-lg text-xl flex items-center justify-center ${className}`}
            title={isDark ? "Modo Claro" : "Modo Oscuro"}
        >
            {isDark ? "🌙" : "☀️"}
        </button>
    );
}