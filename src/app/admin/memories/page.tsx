"use client";

import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
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
    Calendar,
    ChevronRight,
    Circle
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import ThemeToggle from "@/components/ThemeToggle";
import PremiumToast, { PremiumToastItem, PremiumToastType } from "@/components/PremiumToast";

interface Video {
    id: string;
    publicId: string;
    autor: string;
    titulo: string;
    created_at: string;
}

const AUDIO_PRESETS = [
    { id: "romantic_piano", name: "Piano Romántico", publicId: "memories/audio/romantic-piano" },
    { id: "upbeat_happy", name: "Felicidad Vibrante", publicId: "memories/audio/upbeat-happy" },
    { id: "acoustic_guitar", name: "Guitarra Acústica", publicId: "memories/audio/acoustic-guitar" },
];

export default function MemoriesPage() {
    const { role, guestId, userName } = useAuth();
    const router = useRouter();
    const [videos, setVideos] = useState<Video[]>([]);
    const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
    const [selectedAudio, setSelectedAudio] = useState(AUDIO_PRESETS[0].publicId);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
    const [isLoadingVideos, setIsLoadingVideos] = useState(true);
    const [toasts, setToasts] = useState<PremiumToastItem[]>([]);

    const pushToast = (type: PremiumToastType, title: string, message: string) => {
        const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        setToasts((prev) => [...prev, { id, type, title, message }]);
        setTimeout(() => setToasts((prev) => prev.filter((item) => item.id !== id)), 4000);
    };

    // Auth Guard - Only ADMIN can CREATE memories
    useEffect(() => {
        if (role !== null && role !== "admin") {
            router.push("/");
        }
    }, [role, router]);

    // Fetch Videos from Supabase
    useEffect(() => {
        const fetchVideos = async () => {
            setIsLoadingVideos(true);
            try {
                const { data, error } = await supabase
                    .from("videos")
                    .select("*")
                    .order("created_at", { ascending: false });

                if (error) throw error;
                if (data) {
                    setVideos(data.map(v => ({
                        ...v,
                        publicId: v.publicId || v.public_id
                    })));
                }
            } catch (err) {
                console.error("Error fetching videos:", err);
                pushToast("error", "Error", "No se pudieron cargar los videos de la nube.");
            } finally {
                setIsLoadingVideos(false);
            }
        };

        if (role === "admin") {
            fetchVideos();
        }
    }, [role]);

    const toggleVideoSelection = (publicId: string) => {
        setSelectedVideos(prev => 
            prev.includes(publicId) 
                ? prev.filter(id => id !== publicId) 
                : [...prev, publicId]
        );
    };

    const handleGenerateCompilation = async () => {
        if (selectedVideos.length < 2) {
            pushToast("info", "Selección insuficiente", "Selecciona al menos 2 videos para crear un compilado.");
            return;
        }

        setIsGenerating(true);
        setGeneratedUrl(null);

        try {
            const response = await fetch("/api/memories/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    videoIds: selectedVideos,
                    audioId: selectedAudio,
                }),
            });

            const data = await response.json();
            if (data.url) {
                setGeneratedUrl(data.url);
                
                // GUARDAR EN SUPABASE PARA QUE CATHERINE LO VEA
                const { error: dbError } = await supabase
                    .from('memories')
                    .insert([{ 
                        url: data.url,
                        title: `Recuerdos de Catherine - ${new Date().toLocaleDateString()}`
                    }]);

                if (dbError) throw dbError;

                pushToast("success", "¡Compilado Listo!", "Tu video de recuerdos ha sido generado y publicado para Catherine.");
            } else {
                throw new Error(data.error || "Error desconocido");
            }
        } catch (err: any) {
            pushToast("error", "Error de Generación", err.message);
        } finally {
            setIsGenerating(false);
        }
    };

    if (role === null) return null;

    return (
        <div className="min-h-screen bg-[#020617] text-white selection:bg-b-gold/30 selection:text-b-gold">
            <PremiumToast toasts={toasts} onClose={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
            
            {/* Background Ornaments */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-b-gold/10 rounded-full blur-[150px] animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[150px] animate-pulse" />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto px-6 py-12 lg:py-20">
                
                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16">
                    <div className="space-y-4">
                        <button 
                            onClick={() => router.push("/")}
                            className="group flex items-center gap-2 text-b-gold/60 hover:text-b-gold transition-colors text-xs font-bold tracking-[0.2em] uppercase"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Volver al Hub
                        </button>
                        <h1 className="text-5xl md:text-7xl font-playfair font-bold gold-text">
                            Video Highlights
                        </h1>
                        <p className="text-gray-400 font-poppins text-sm tracking-widest uppercase">
                            Crea memorias mágicas • {userName}
                        </p>
                    </div>
                    <ThemeToggle />
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    
                    {/* Left Column: Gallery Selection */}
                    <div className="lg:col-span-8 space-y-8">
                        <div className="glass p-8 rounded-[2.5rem] border border-white/5 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Clapperboard className="w-6 h-6 text-b-gold" />
                                    <h2 className="text-2xl font-serif italic">Galería de Momentos</h2>
                                </div>
                                <span className="text-[10px] font-black text-b-gold/60 uppercase tracking-[0.2em]">
                                    {selectedVideos.length} seleccionados
                                </span>
                            </div>

                            {isLoadingVideos ? (
                                <div className="h-64 flex flex-col items-center justify-center gap-4 text-gray-500">
                                    <Loader2 className="w-8 h-8 animate-spin" />
                                    <p className="text-xs font-poppins uppercase tracking-widest">Cargando videos...</p>
                                </div>
                            ) : videos.length === 0 ? (
                                <div className="h-64 flex flex-col items-center justify-center gap-4 text-gray-500 border-2 border-dashed border-white/5 rounded-3xl">
                                    <Film className="w-10 h-10 opacity-20" />
                                    <p className="text-xs font-poppins uppercase tracking-widest">No hay videos en la nube</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {videos.map((video) => (
                                        <motion.div
                                            key={video.id}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => toggleVideoSelection(video.publicId)}
                                            className={`relative aspect-[9/16] rounded-2xl overflow-hidden cursor-pointer border-2 transition-all ${
                                                selectedVideos.includes(video.publicId) 
                                                ? "border-b-gold shadow-[0_0_20px_rgba(212,175,55,0.3)]" 
                                                : "border-transparent hover:border-white/10"
                                            }`}
                                        >
                                            <img 
                                                src={`https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/video/upload/c_fill,w_300,h_533,so_2/${video.publicId}.jpg`}
                                                alt={video.titulo}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-4 flex flex-col justify-end">
                                                <p className="text-[10px] font-bold text-white/90 truncate">{video.autor}</p>
                                                <p className="text-[8px] text-white/50 uppercase tracking-widest">
                                                    {new Date(video.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            {selectedVideos.includes(video.publicId) && (
                                                <div className="absolute top-3 right-3 bg-b-gold text-b-blue-950 rounded-full p-1 shadow-lg">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Settings & Actions */}
                    <div className="lg:col-span-4 space-y-8">
                        
                        {/* Audio Selection */}
                        <div className="glass p-8 rounded-[2.5rem] border border-white/5 space-y-6">
                            <div className="flex items-center gap-3">
                                <Music className="w-5 h-5 text-b-gold" />
                                <h2 className="text-xl font-serif italic">Música de Fondo</h2>
                            </div>
                            <div className="space-y-3">
                                {AUDIO_PRESETS.map((audio) => (
                                    <button
                                        key={audio.id}
                                        onClick={() => setSelectedAudio(audio.publicId)}
                                        className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                                            selectedAudio === audio.publicId
                                            ? "bg-b-gold/10 border-b-gold text-b-gold"
                                            : "bg-white/5 border-transparent hover:border-white/10 text-gray-400"
                                        }`}
                                    >
                                        <span className="text-xs font-bold tracking-widest uppercase">{audio.name}</span>
                                        {selectedAudio === audio.publicId ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4 opacity-20" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Action Card */}
                        <div className="glass p-8 rounded-[2.5rem] border border-b-gold/20 space-y-8 bg-gradient-to-br from-b-gold/5 to-transparent">
                            <div className="space-y-2">
                                <h3 className="text-lg font-serif italic">¿Listo para la magia?</h3>
                                <p className="text-xs text-gray-500 font-poppins leading-relaxed">
                                    Combinaremos tus videos seleccionados en una sola película cinematográfica con transiciones suaves y música de fondo.
                                </p>
                            </div>

                            <button
                                onClick={handleGenerateCompilation}
                                disabled={isGenerating || selectedVideos.length < 2}
                                className="w-full h-16 bg-b-gold text-b-blue-950 rounded-2xl flex items-center justify-center gap-3 font-poppins font-black uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30 disabled:hover:scale-100 transition-all"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Generando...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5" />
                                        <span>Generar Compilado</span>
                                    </>
                                )}
                            </button>

                            {generatedUrl && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-4"
                                >
                                    <div className="h-[1px] bg-b-gold/20 w-full" />
                                    <a
                                        href={generatedUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full h-14 bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center gap-3 text-xs font-bold uppercase tracking-widest hover:bg-white/20 transition-all"
                                    >
                                        <Play className="w-4 h-4" />
                                        Ver Resultado
                                    </a>
                                    <a
                                        href={generatedUrl}
                                        download="highlights.mp4"
                                        className="w-full h-14 bg-b-blue-950/50 border border-b-gold/30 rounded-2xl flex items-center justify-center gap-3 text-xs font-bold uppercase tracking-widest text-b-gold hover:bg-b-gold hover:text-b-blue-950 transition-all"
                                    >
                                        <Download className="w-4 h-4" />
                                        Descargar Video
                                    </a>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
