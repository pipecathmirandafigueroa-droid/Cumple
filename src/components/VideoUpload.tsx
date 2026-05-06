"use client";
import { useState } from "react";
import { CldUploadWidget } from 'next-cloudinary';
import { Upload, CheckCircle, AlertCircle, Loader, Play } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

interface VideoUploadProps {
    onSuccess: (publicId: string) => void;
    userName: string;
}

export default function VideoUpload({ onSuccess, userName }: VideoUploadProps) {
    const shouldReduceMotion = useReducedMotion();
    const [uploadState, setUploadState] = useState<"idle" | "uploading" | "success" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState("");
    const [progress, setProgress] = useState(0);

    const handleUploadSuccess = async (res: any) => {
        if (res.info && typeof res.info !== 'string') {
            setUploadState("success");
            setProgress(100);
            onSuccess(res.info.public_id);
            
            // Reset después de 2.5 segundos
            setTimeout(() => {
                setUploadState("idle");
                setProgress(0);
            }, 2500);
        }
    };

    const handleUploadError = (error: any) => {
        setUploadState("error");
        setErrorMessage("Error al subir el video. Intenta de nuevo.");
        setProgress(0);
        
        // Reset después de 3 segundos
        setTimeout(() => {
            setUploadState("idle");
            setErrorMessage("");
        }, 3000);
    };

    return (
        <CldUploadWidget
            uploadPreset="birthday_videos"
            onSuccess={handleUploadSuccess}
            onError={handleUploadError}
            onClose={() => {
                if (uploadState === "uploading") {
                    setUploadState("idle");
                    setProgress(0);
                }
            }}
        >
            {({ open }) => (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.25 }}
                    className="w-full px-2 sm:px-4 md:px-0"
                >
                    {/* ESTADO: IDLE (Listo para subir) */}
                    <AnimatePresence>
                        {uploadState === "idle" && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="space-y-3 sm:space-y-4"
                            >
                                {/* CARD PRINCIPAL */}
                                <div className="glass p-6 sm:p-8 md:p-12 rounded-2xl sm:rounded-3xl md:rounded-[3.5rem] border border-b-gold/20 shadow-2xl overflow-hidden">
                                    <div className="flex flex-col items-center gap-4 sm:gap-6">
                                        {/* ICONO GRANDE */}
                                        <motion.div
                                            animate={shouldReduceMotion ? undefined : { y: [0, -8, 0] }}
                                            transition={shouldReduceMotion ? { duration: 0 } : { duration: 2, repeat: Infinity }}
                                            className="p-4 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl bg-b-gold/20 text-b-gold"
                                        >
                                            <Play className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12" fill="currentColor" />
                                        </motion.div>

                                        {/* TITULO */}
                                        <div className="text-center space-y-1 sm:space-y-2">
                                            <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-playfair font-bold text-b-gold">
                                                Sube tu video
                                            </h3>
                                            <p className="text-sm md:text-base font-poppins text-gray-500 dark:text-gray-400 px-2">
                                                Comparte un momento especial en esta celebración
                                            </p>
                                        </div>

                                        {/* BOTÓN PRINCIPAL - EXTRA GRANDE EN MOBILE */}
                                        <motion.button
                                            whileHover={shouldReduceMotion ? undefined : { scale: 1.03 }}
                                            whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
                                            onClick={() => {
                                                setUploadState("uploading");
                                                setProgress(15);
                                                open();
                                            }}
                                            className="w-full min-h-[44px] py-4 sm:py-5 md:py-4 px-6 sm:px-8 bg-gradient-to-r from-b-gold to-b-gold/80 text-b-blue-950 rounded-2xl font-poppins font-black uppercase text-xs sm:text-sm md:text-xs tracking-[0.2em] sm:tracking-[0.3em] transition-all shadow-xl sm:shadow-2xl hover:shadow-[0_0_28px_rgba(212,175,55,0.35)] active:shadow-lg"
                                        >
                                            <div className="flex items-center justify-center gap-3">
                                                <Upload className="w-5 h-5 md:w-4 md:h-4" />
                                                <span>Seleccionar Video</span>
                                            </div>
                                        </motion.button>

                                        {/* INFO COMPACTA */}
                                        <div className="w-full pt-4 border-t border-b-gold/10 space-y-3">
                                            <div className="grid grid-cols-3 gap-2 text-center text-[9px] md:text-[10px] font-poppins font-black uppercase tracking-[0.15em] text-gray-500">
                                                <div className="space-y-1">
                                                    <p className="text-b-gold">Máx</p>
                                                    <p className="text-xs">100MB</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-b-gold">Duración</p>
                                                    <p className="text-xs">60s ideal</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-b-gold">Formatos</p>
                                                    <p className="text-xs">MP4, WebM</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ESTADO: UPLOADING (Subiendo) */}
                    <AnimatePresence>
                        {uploadState === "uploading" && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="glass p-6 sm:p-8 md:p-12 rounded-2xl sm:rounded-3xl md:rounded-[3.5rem] border border-b-gold/20 shadow-xl sm:shadow-2xl"
                            >
                                <div className="flex flex-col items-center gap-6">
                                    {/* SPINNER */}
                                    <motion.div
                                        animate={shouldReduceMotion ? undefined : { rotate: 360 }}
                                        transition={shouldReduceMotion ? { duration: 0 } : { duration: 2, repeat: Infinity, ease: "linear" }}
                                        className="p-6 rounded-3xl bg-b-gold/20 text-b-gold"
                                    >
                                        <Loader className="w-12 h-12" />
                                    </motion.div>

                                    <div className="text-center space-y-2">
                                        <h3 className="text-2xl md:text-3xl font-playfair font-bold text-b-gold">
                                            Subiendo...
                                        </h3>
                                        <p className="text-sm font-poppins text-gray-500">
                                            Por favor espera a que termine
                                        </p>
                                    </div>

                                    {/* BARRA DE PROGRESO */}
                                    <div className="w-full space-y-3">
                                        <div className="bg-black/10 dark:bg-white/10 rounded-full h-3 overflow-hidden">
                                            <motion.div
                                                initial={{ width: "0%" }}
                                                animate={{ width: `${progress}%` }}
                                                transition={{ ease: "easeOut", duration: 0.3 }}
                                                className="h-full bg-gradient-to-r from-b-gold to-b-gold/60"
                                            />
                                        </div>
                                        <p className="text-center text-xs font-bold text-b-gold">
                                            {progress}%
                                        </p>
                                    </div>

                                    {/* CONSEJO */}
                                    <div className="w-full p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-b-gold/10 text-center text-xs font-poppins text-gray-600 dark:text-gray-300">
                                        💡 No cierres esta pantalla hasta terminar
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ESTADO: SUCCESS (Éxito) */}
                    <AnimatePresence>
                        {uploadState === "success" && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="glass p-6 sm:p-8 md:p-12 rounded-2xl sm:rounded-3xl md:rounded-[3.5rem] border-2 border-green-500/50 shadow-xl sm:shadow-2xl bg-green-500/5"
                            >
                                <div className="flex flex-col items-center gap-6">
                                    {/* CHECKMARK */}
                                    <motion.div
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ type: "spring", stiffness: 100, damping: 10 }}
                                        className="p-6 rounded-full bg-green-500/20 text-green-500"
                                    >
                                        <CheckCircle className="w-12 h-12 md:w-16 md:h-16" />
                                    </motion.div>

                                    <div className="text-center space-y-2">
                                        <h3 className="text-2xl md:text-3xl font-playfair font-bold text-green-500">
                                            ¡Video subido!
                                        </h3>
                                        <p className="text-sm font-poppins text-gray-500">
                                            Tu video aparecerá pronto abajo
                                        </p>
                                    </div>

                                    {/* BOTÓN CERRAR */}
                                    <motion.button
                                        whileHover={shouldReduceMotion ? undefined : { scale: 1.03 }}
                                        whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
                                        onClick={() => setUploadState("idle")}
                                        className="w-full min-h-[44px] py-4 px-8 bg-green-500/20 text-green-500 rounded-2xl font-poppins font-black uppercase text-sm tracking-[0.2em] hover:bg-green-500/30 transition-all"
                                    >
                                        Listo
                                    </motion.button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ESTADO: ERROR (Error) */}
                    <AnimatePresence>
                        {uploadState === "error" && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="glass p-6 sm:p-8 md:p-12 rounded-2xl sm:rounded-3xl md:rounded-[3.5rem] border-2 border-red-500/50 shadow-xl sm:shadow-2xl bg-red-500/5"
                            >
                                <div className="flex flex-col items-center gap-6">
                                    {/* ALERTA */}
                                    <motion.div
                                        initial={{ scale: 0, rotate: 180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ type: "spring", stiffness: 100 }}
                                        className="p-6 rounded-3xl bg-red-500/20 text-red-500"
                                    >
                                        <AlertCircle className="w-12 h-12 md:w-16 md:h-16" />
                                    </motion.div>

                                    <div className="text-center space-y-2">
                                        <h3 className="text-2xl md:text-3xl font-playfair font-bold text-red-500">
                                            Oops, error
                                        </h3>
                                        <p className="text-sm font-poppins text-gray-500">
                                            {errorMessage}
                                        </p>
                                    </div>

                                    {/* BOTÓN REINTENTAR */}
                                    <motion.button
                                        whileHover={shouldReduceMotion ? undefined : { scale: 1.03 }}
                                        whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
                                        onClick={() => open()}
                                        className="w-full min-h-[44px] py-4 px-8 bg-b-gold text-b-blue-950 rounded-2xl font-poppins font-black uppercase text-sm tracking-[0.3em] hover:shadow-[0_0_24px_rgba(212,175,55,0.3)] transition-all"
                                    >
                                        Reintentar
                                    </motion.button>

                                    {/* BOTÓN CERRAR */}
                                    <motion.button
                                        whileHover={shouldReduceMotion ? undefined : { scale: 1.01 }}
                                        onClick={() => setUploadState("idle")}
                                        className="w-full min-h-[44px] py-3 px-8 bg-black/10 dark:bg-white/10 rounded-2xl font-poppins font-bold uppercase text-xs tracking-[0.2em] hover:bg-black/20 dark:hover:bg-white/20 transition-all"
                                    >
                                        Cancelar
                                    </motion.button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}
        </CldUploadWidget>
    );
}
