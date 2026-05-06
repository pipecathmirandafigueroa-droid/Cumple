"use client";
import { createContext, useContext, useState, ReactNode } from "react";
import { useEffect } from "react";

import { supabase } from "@/lib/supabase";

type Role = "admin" | "principal" | "user" | null;

interface AuthContextType {
    role: Role;
    userName: string | null;
    guestId: string | null;
    isGlobalPaused: boolean;
    setGlobalPause: (paused: boolean) => void;
    isAnyVideoPlaying: boolean;
    setIsAnyVideoPlaying: (playing: boolean) => void;
    login: (code: string) => Promise<boolean>;
    loginAsGuest: (fullName: string) => Promise<boolean>;
    logout: () => void;
}

const GUEST_SESSION_KEY = "birthdayhub_guest_session";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [role, setRole] = useState<Role>(null);
    const [userName, setUserName] = useState<string | null>(null);
    const [guestId, setGuestId] = useState<string | null>(null);
    const [isGlobalPaused, setIsGlobalPaused] = useState(false);
    const [isAnyVideoPlaying, setIsAnyVideoPlaying] = useState(false);

    useEffect(() => {
        try {
            const raw = sessionStorage.getItem(GUEST_SESSION_KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw) as { role: Role; userName: string; guestId: string };
            if (parsed?.role && parsed?.userName && parsed?.guestId) {
                setRole(parsed.role);
                setUserName(parsed.userName);
                setGuestId(parsed.guestId);
            }
        } catch {
            sessionStorage.removeItem(GUEST_SESSION_KEY);
        }
    }, []);

    const login = async (code: string) => {
        const normalizedCode = code.trim();
        // Master Fallback (Opcional, para el primer setup)
        if (normalizedCode.toUpperCase() === "ADMIN123") {
            setRole("admin");
            setUserName("Master Admin");
            // Admin usa un ID especial para poder enviar mensajes
            setGuestId("00000000-0000-0000-0000-000000000000");
            return true;
        }

        try {
            const { data, error } = await supabase
                .from('guests')
                .select('*')
                .ilike('code', normalizedCode)
                .single();

            if (data && !error) {
                setRole(data.role as Role);
                setUserName(data.name);
                setGuestId(data.id);
                setIsGlobalPaused(false);
                setIsAnyVideoPlaying(false);
                return true;
            }
        } catch (err) {
            console.error("Error logging in:", err);
        }
        return false;
    };

    const loginAsGuest = async (fullName: string) => {
        const normalizedName = fullName.trim();
        if (!normalizedName) return false;

        const generatedId = crypto.randomUUID();
        setRole("user");
        setUserName(normalizedName);
        setGuestId(generatedId);
        setIsGlobalPaused(false);
        setIsAnyVideoPlaying(false);

        sessionStorage.setItem(
            GUEST_SESSION_KEY,
            JSON.stringify({ role: "user", userName: normalizedName, guestId: generatedId })
        );

        return true;
    };

    const logout = () => {
        setRole(null);
        setUserName(null);
        setGuestId(null);
        setIsGlobalPaused(true);
        setIsAnyVideoPlaying(false);
        sessionStorage.removeItem(GUEST_SESSION_KEY);
    };

    const setGlobalPause = (paused: boolean) => {
        setIsGlobalPaused(paused);
    };

    return (
        <AuthContext.Provider value={{ 
            role, 
            userName, 
            guestId,
            isGlobalPaused, 
            setGlobalPause, 
            isAnyVideoPlaying, 
            setIsAnyVideoPlaying,
            login, 
            loginAsGuest,
            logout 
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider");
    return context;
};