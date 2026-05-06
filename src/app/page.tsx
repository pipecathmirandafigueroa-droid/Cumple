"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Dashboard from "@/components/Dashboard";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, ShieldCheck, UserCircle2 } from "lucide-react";

export default function Home() {
    const { role, login, loginAsGuest } = useAuth();
    const [code, setCode] = useState("");
    const [guestName, setGuestName] = useState("");
    const [error, setError] = useState(false);
    const [guestError, setGuestError] = useState(false);

    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const success = await login(code.trim());
        if (!success) {
            setError(true);
            setTimeout(() => setError(false), 2000);
        }
        setIsLoading(false);
    };

    const handleGuestAccess = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const success = await loginAsGuest(guestName);
        if (!success) {
            setGuestError(true);
            setTimeout(() => setGuestError(false), 2000);
        }
        setIsLoading(false);
    };

    if (role) return <Dashboard />;

    return (
        <main className="relative min-h-screen flex items-center justify-center p-3 sm:p-4 overflow-hidden bg-b-blue-50 dark:bg-b-blue-950">
            {/* ORNAMENTOS DE FONDO LUXURY */}
            <div className="fixed inset-0 pointer-events-none select-none">
                <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-b-gold/10 dark:bg-b-gold/5 rounded-full blur-[150px] animate-pulse-gold" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-600/10 dark:bg-blue-600/5 rounded-full blur-[150px] animate-pulse" />
            </div>

            <AnimatePresence>
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative z-10 w-full max-w-md"
                >
                    <div className="glass p-6 sm:p-8 md:p-12 rounded-[2rem] sm:rounded-[3rem] border border-b-gold/20 shadow-[0_24px_60px_rgba(0,0,0,0.35)] sm:shadow-[0_40px_100px_rgba(0,0,0,0.4)] text-center relative overflow-hidden">
                        {/* RETRATO DE LA REINA (Centerpiece) - COMPACTO */}
                        <div className="relative mb-8 sm:mb-10 flex justify-center items-center">
                            {/* Brillo de fondo */}
                            <div className="absolute inset-0 bg-b-gold/20 blur-[100px] rounded-full animate-pulse-gold" />
                            
                            <motion.div 
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                                className="relative w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 rounded-[2rem] sm:rounded-[3rem] p-1.5 border-2 border-b-gold/30 glass shadow-xl sm:shadow-2xl z-10 overflow-hidden"
                            >
                                <img 
                                    src="/assets/images/reina.png" 
                                    alt="La Reina" 
                                    className="w-full h-full object-cover rounded-[1.5rem] sm:rounded-[2.5rem]"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
                            </motion.div>
                        </div>

                        {/* TEXTO FORMAL */}
                        <div className="space-y-3 sm:space-y-4 mb-8 sm:mb-10">
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="flex items-center justify-center gap-4 opacity-50"
                            >
                                <div className="h-[1px] w-6 bg-b-gold" />
                                <span className="text-b-gold font-poppins font-bold tracking-[0.5em] text-[9px] uppercase">Invitación</span>
                                <div className="h-[1px] w-6 bg-b-gold" />
                            </motion.div>

                            <h1 className="text-3xl sm:text-4xl md:text-5xl font-playfair font-bold gold-text leading-tight">
                                Birthday Hub
                            </h1>
                            
                            <p className="text-gray-500 dark:text-b-gold/40 text-[10px] sm:text-[11px] font-poppins tracking-[0.08em] sm:tracking-widest font-medium italic max-w-[280px] mx-auto leading-relaxed">
                                "Un espacio creado con amor para celebrar una vida extraordinaria."
                            </p>
                        </div>

                        {/* FORMULARIO DE ACCESO INVITADO */}
                        <form onSubmit={handleGuestAccess} className="space-y-5 sm:space-y-6 max-w-xs mx-auto">
                            <div className="relative group">
                                <div className="absolute inset-0 bg-b-gold/5 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative">
                                    <UserCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-b-gold/40 group-focus-within:text-b-gold transition-colors" />
                                    <input
                                        type="text"
                                        value={guestName}
                                        onChange={(e) => setGuestName(e.target.value)}
                                        placeholder="NOMBRE COMPLETO"
                                        className={`w-full min-h-[44px] bg-black/5 dark:bg-white/5 pl-11 sm:pl-12 pr-5 sm:pr-6 py-3.5 sm:py-4 rounded-2xl border-2 text-center text-base sm:text-lg font-poppins font-bold tracking-[0.3em] sm:tracking-[0.4em] outline-none transition-all
                                            ${guestError ? "border-red-500 animate-shake" : "border-b-gold/10 focus:border-b-gold/50 dark:text-white placeholder:text-gray-500"}`}
                                    />
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                className="w-full min-h-[44px] py-3.5 sm:py-4 bg-b-gold text-b-blue-950 font-poppins font-black rounded-2xl shadow-xl sm:shadow-2xl tracking-[0.25em] sm:tracking-[0.3em] text-[10px] uppercase hover:bg-b-gold-light transition-all flex items-center justify-center gap-3"
                            >
                                <UserCircle2 className="w-3.5 h-3.5" />
                                ENTRAR COMO INVITADO
                            </motion.button>
                        </form>

                        <div className="max-w-xs mx-auto mt-6 pt-6 border-t border-b-gold/10">
                            <p className="text-[10px] font-poppins uppercase tracking-[0.2em] text-gray-500 mb-3">Acceso con codigo (admin/principal)</p>
                            <form onSubmit={handleSubmit} className="space-y-3">
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-b-gold/40" />
                                    <input
                                        type="text"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        placeholder="CODIGO"
                                        className={`w-full min-h-[44px] bg-black/5 dark:bg-white/5 pl-11 pr-5 py-3 rounded-2xl border-2 text-center text-sm font-poppins font-bold tracking-[0.2em] outline-none transition-all ${error ? "border-red-500 animate-shake" : "border-b-gold/10 focus:border-b-gold/50 dark:text-white placeholder:text-gray-500"}`}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full min-h-[44px] py-3 rounded-2xl bg-white/10 border border-b-gold/30 text-b-gold font-poppins font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2"
                                >
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    ACCEDER CON CODIGO
                                </button>
                            </form>
                        </div>

                        {/* DETALLE DE PIE */}
                        <div className="mt-8 sm:mt-10 opacity-30 text-[8px] font-poppins font-black tracking-[0.3em] sm:tracking-[0.4em] text-b-gold uppercase">
                            Seguridad Real • 2026
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
        </main>
    );
}