"use client";

import { useAuth } from "@/context/AuthContext";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { 
    Clapperboard, 
    Music, 
    Sparkles, 
    ArrowLeft, 
    CheckCircle2, 
    Play, 
    Download,
    Loader2,
    Film,
    Plus,
    X
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import ThemeToggle from "@/components/ThemeToggle";
import PremiumToast, { PremiumToastItem, PremiumToastType } from "@/components/PremiumToast";
import { cloudinaryManager } from "@/lib/CloudinaryManager";
import { CldVideoPlayer, CldUploadWidget } from "next-cloudinary";

// --- INTERFACES ---
interface VideoMetadata {
    id: string;
    public_id: string;
    autor: string;
    titulo: string;
    created_at: string;
}

const PRINCIPAL_ID = "CARLOS_FELIPE_ID"; // ID definido en el Prompt Maestro

export default function MemoriesProPage() {
    const { role, guestId, userName } = useAuth();
    const router = useRouter();
    
    // Estados de Datos
    const [videos, setVideos] = useState<VideoMetadata[]>([]);
    const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
    const [selectedAudio, setSelectedAudio] = useState('bday_theme');
    
    // Estados de UI
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
    const [isLoadingVideos, setIsLoadingVideos] = useState(true);
    const [toasts, setToasts] = useState<PremiumToastItem[]>([]);

    // --- AUTH GUARD ---
    useEffect(() => {
        const isAuthorized = role === "admin" || guestId === PRINCIPAL_ID;
        if (role !== null && !isAuthorized) {
            router.push("/");
        }
    }, [role, guestId, router]);

    // --- FETCH VIDEOS ---
    const fetchVideos = async () => {
        setIsLoadingVideos(true);
        try {
            const { data, error } = await supabase
                .from("videos")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            if (data) setVideos(data);
        } catch (err) {
            pushToast("error", "Error de Red", "No se pudieron sincronizar los clips de la nube.");
        } finally {
            setIsLoadingVideos(false);
        }
    };

    useEffect(() => {
        if (role === "admin" || guestId === PRINCIPAL_ID) {
            fetchVideos();
        }
    }, [role, guestId]);

    // --- LOGICA DE SELECCION ---
    const toggleVideoSelection = (publicId: string) => {
        setSelectedVideos(prev => 
            prev.includes(publicId) 
                ? prev.filter(id => id !== publicId) 
                : [...prev, publicId]
        );
    };

    const getSelectionOrder = (publicId: string) => {
        const index = selectedVideos.indexOf(publicId);
        return index !== -1 ? index + 1 : null;
    };

    // --- GENERACIÓN DE MEMORIAS ---
    const handleGenerateMemory = async () => {
        if (selectedVideos.length < 2) {
            pushToast("info", "Selección necesaria", "Necesitas al menos 2 clips para crear una historia.");
            return;
        }

        setIsGenerating(true);
        setGeneratedUrl(null);

        try {
            // Usamos el CloudinaryManager para generar la URL SDK-Based (H.264, normalization, etc)
            const finalUrl = cloudinaryManager.generateMemoryUrl(selectedVideos, selectedAudio);
            
            if (finalUrl) {
                setGeneratedUrl(finalUrl);
                
                // Persistencia en Supabase
                const { error: dbError } = await supabase
                    .from('memories')
                    .insert([{ 
                        url: finalUrl,
                        title: `Historia Mágica - ${new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`
                    }]);

                if (dbError) throw dbError;
                pushToast("success", "Magia Completada", "Tu película de recuerdos está lista y publicada.");
            }
        } catch (err: any) {
            pushToast("error", "Error de Mezcla", "Hubo un problema procesando los clips.");
        } finally {
            setIsGenerating(false);
        }
    };

    const pushToast = (type: PremiumToastType, title: string, message: string) => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, type, title, message }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    };

    if (role === null) return null;

    return (
        <div className="min-h-screen bg-[#020617] text-white font-poppins selection:bg-b-gold/30">
            <PremiumToast toasts={toasts} onClose={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
            
            {/* Liquid Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-b-gold/10 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 lg:py-16">
                
                {/* Header Estilo Apple */}
                <header className="flex flex-col md:flex-row justify-between items-end gap-6 mb-16">
                    <div className="space-y-4">
                        <motion.button 
                            whileHover={{ x: -5 }}
                            onClick={() => router.push("/")}
                            className="flex items-center gap-2 text-white/40 hover:text-b-gold transition-colors text-[10px] font-black uppercase tracking-[0.3em]"
                        >
                            <ArrowLeft className="w-3 h-3" />
                            Volver al Inicio
                        </motion.button>
                        <h1 className="text-6xl md:text-8xl font-playfair font-bold tracking-tight">
                            Memorias <span className="gold-text italic">Mágicas</span>
                        </h1>
                        <p className="text-white/40 text-xs tracking-[0.4em] uppercase font-medium">
                            Editor de Recuerdos Pro • {userName}
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <CldUploadWidget 
                            uploadPreset="birthday_videos"
                            options={{ resourceType: 'video', clientAllowedFormats: ['mp4', 'mov', 'webm'] }}
                            onSuccess={() => fetchVideos()}
                        >
                            {({ open }) => (
                                <button 
                                    onClick={() => open()}
                                    className="p-4 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
                                >
                                    <Plus className="w-5 h-5 text-b-gold group-hover:rotate-90 transition-transform" />
                                </button>
                            )}
                        </CldUploadWidget>
                        <ThemeToggle />
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    
                    {/* Galería de Selección (Liquid Glass) */}
                    <div className="lg:col-span-8">
                        <div className="glass p-8 rounded-[3.5rem] border border-white/10 shadow-2xl space-y-8 min-h-[600px]">
                            <div className="flex items-center justify-between border-b border-white/5 pb-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-2xl bg-b-gold/20 text-b-gold">
                                        <Clapperboard className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-playfair font-bold">Librería de Clips</h2>
                                        <p className="text-[10px] text-white/30 uppercase tracking-widest font-black">Selecciona el orden de tu historia</p>
                                    </div>
                                </div>
                                <div className="px-4 py-2 rounded-full bg-white/5 border border-white/5 text-[10px] font-bold text-b-gold tracking-widest uppercase">
                                    {selectedVideos.length} Clips listos
                                </div>
                            </div>

                            {isLoadingVideos ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                    {[1, 2, 3, 4, 5, 6].map(i => (
                                        <div key={i} className="aspect-[9/16] rounded-3xl bg-white/5 animate-pulse" />
                                    ))}
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                    <AnimatePresence>
                                        {videos.map((video) => {
                                            const order = getSelectionOrder(video.public_id);
                                            return (
                                                <motion.div
                                                    key={video.id}
                                                    layout
                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    whileHover={{ y: -5 }}
                                                    onClick={() => toggleVideoSelection(video.public_id)}
                                                    className={`relative aspect-[9/16] rounded-[2.5rem] overflow-hidden cursor-pointer border-2 transition-all duration-500 ${
                                                        order 
                                                        ? "border-b-gold shadow-[0_0_40px_rgba(212,175,55,0.2)]" 
                                                        : "border-transparent grayscale-[0.5] hover:grayscale-0"
                                                    }`}
                                                >
                                                    <img 
                                                        src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/video/upload/c_fill,w_400,h_711,so_2/${video.public_id}.jpg`}
                                                        alt={video.titulo}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    
                                                    {/* iOS Style Checkbox & Order */}
                                                    <div className="absolute top-5 right-5 z-20">
                                                        {order ? (
                                                            <div className="w-8 h-8 rounded-full bg-b-gold text-b-blue-950 flex items-center justify-center font-black text-sm shadow-xl border-2 border-white/20 scale-110">
                                                                {order}
                                                            </div>
                                                        ) : (
                                                            <div className="w-8 h-8 rounded-full bg-black/20 backdrop-blur-md border-2 border-white/30" />
                                                        )}
                                                    </div>

                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent p-6 flex flex-col justify-end">
                                                        <span className="text-[9px] font-black text-b-gold uppercase tracking-[0.2em] mb-1">{video.autor}</span>
                                                        <h4 className="text-sm font-serif italic text-white/90 truncate">{video.titulo}</h4>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Editor & Preview (Liquid Glass) */}
                    <div className="lg:col-span-4 space-y-8">
                        
                        {/* Audio Settings */}
                        <div className="glass p-8 rounded-[3.5rem] border border-white/10 shadow-xl space-y-6">
                            <div className="flex items-center gap-3">
                                <Music className="w-5 h-5 text-b-gold" />
                                <h3 className="text-xl font-playfair font-bold">Soundtrack</h3>
                            </div>
                            <div className="p-4 rounded-2xl bg-b-gold/10 border border-b-gold/20 flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-widest text-b-gold">Birthday Theme</span>
                                <CheckCircle2 className="w-4 h-4 text-b-gold" />
                            </div>
                        </div>

                        {/* Generación / Resultado */}
                        <div className="glass p-8 rounded-[3.5rem] border border-b-gold/20 shadow-2xl bg-gradient-to-br from-b-gold/10 to-transparent min-h-[400px] flex flex-col justify-center text-center">
                            
                            <AnimatePresence mode="wait">
                                {isGenerating ? (
                                    <motion.div 
                                        key="generating"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="space-y-8"
                                    >
                                        <div className="relative w-24 h-24 mx-auto">
                                            <div className="absolute inset-0 border-4 border-b-gold/20 rounded-full" />
                                            <motion.div 
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                                className="absolute inset-0 border-4 border-t-b-gold rounded-full"
                                            />
                                            <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-b-gold animate-pulse" />
                                        </div>
                                        <div className="space-y-3">
                                            <h4 className="text-2xl font-playfair font-bold gold-text">Mezclando Recuerdos</h4>
                                            <p className="text-xs text-white/50 font-poppins italic tracking-wide">
                                                Estamos mezclando tus recuerdos... <br />
                                                <span className="text-b-gold/60">la magia tarda unos segundos</span>
                                            </p>
                                        </div>
                                    </motion.div>
                                ) : generatedUrl ? (
                                    <motion.div 
                                        key="result"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="space-y-6"
                                    >
                                        <div className="rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl aspect-[9/16] bg-black">
                                            <CldVideoPlayer
                                                src={generatedUrl}
                                                width="720"
                                                height="1280"
                                                colors={{ accent: "#d4af37", base: "#020617" }}
                                                logo={false}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <button 
                                                onClick={() => setGeneratedUrl(null)}
                                                className="p-4 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                                            >
                                                Nuevo
                                            </button>
                                            <a 
                                                href={generatedUrl}
                                                download="memoria_magica.mp4"
                                                className="p-4 rounded-2xl bg-b-gold text-b-blue-950 text-[10px] font-black uppercase tracking-widest shadow-xl hover:shadow-b-gold/30 transition-all flex items-center justify-center gap-2"
                                            >
                                                <Download className="w-3 h-3" />
                                                Descargar
                                            </a>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div 
                                        key="idle"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="space-y-8"
                                    >
                                        <div className="w-20 h-20 mx-auto rounded-3xl bg-b-gold/10 flex items-center justify-center text-b-gold border border-b-gold/20">
                                            <Film className="w-10 h-10" />
                                        </div>
                                        <div className="space-y-3">
                                            <h3 className="text-2xl font-playfair font-bold">Crea tu Historia</h3>
                                            <p className="text-xs text-white/40 leading-relaxed px-4">
                                                Selecciona al menos 2 clips de la librería para generar un video cinematográfico vertical.
                                            </p>
                                        </div>
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            disabled={selectedVideos.length < 2}
                                            onClick={handleGenerateMemory}
                                            className="w-full py-5 rounded-2xl bg-b-gold text-b-blue-950 font-black uppercase text-xs tracking-[0.3em] shadow-2xl disabled:opacity-20 disabled:grayscale transition-all flex items-center justify-center gap-3"
                                        >
                                            <Sparkles className="w-5 h-5" />
                                            <span>Generar Magia</span>
                                        </motion.button>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

