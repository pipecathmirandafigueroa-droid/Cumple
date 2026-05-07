"use client";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import VideoCard from "@/components/VideoCard";
import ThemeToggle from "@/components/ThemeToggle";
import AdminPanel from "@/components/AdminPanel";
import PremiumToast, { PremiumToastItem, PremiumToastType } from "@/components/PremiumToast";
import { supabase } from "@/lib/supabase";
import { Send, Lock, User, MessageSquare, Heart, LogOut, Shield, Edit2, Save, X, Clapperboard, Trash2, Volume2, VolumeX, Sparkles, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import VideoUpload from "@/components/VideoUpload";
import { useEffect, useRef } from "react";

// --- TIPOS DE DATOS ---
interface Message {
    id: string;
    guest_id: string;
    autor: string;
    texto: string;
    privado: boolean;
    created_at?: string;
}

interface Video {
    id: string;
    publicId: string;
    autor: string;
    titulo: string;
    ownerId?: string;
    created_at?: string;
}

const VIDEO_STORAGE_KEY = "birthdayhub_cloudinary_videos";
const ROMANTIC_BDAY_TRACKS = [
    "/assets/audio/happy-birthday-violin.mp3",
];

const TAB_META = {
    mensajes: { label: "Mensajes", icon: MessageSquare },
    videos: { label: "Videos", icon: Clapperboard },
    memorias: { label: "Memorias", icon: Sparkles },
    admin: { label: "Admin", icon: Shield },
} as const;

export default function Dashboard() {
    const { role, userName, guestId, logout, setGlobalPause, isAnyVideoPlaying } = useAuth();
    const router = useRouter();
    const shouldReduceMotion = useReducedMotion();
    const [activeTab, setActiveTab] = useState<"mensajes" | "videos" | "memorias" | "admin">("mensajes");
    const [isMuted, setIsMuted] = useState(false);
    const [baseVolume, setBaseVolume] = useState(0.12);
    const [isCompactTabs, setIsCompactTabs] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const trackIndexRef = useRef(0);

    // Gestión de Música de Fondo Romántica
    useEffect(() => {
        if (!audioRef.current) {
            const playTrack = (index: number) => {
                const src = ROMANTIC_BDAY_TRACKS[index];
                if (!src) return;

                const audio = new Audio(src);
                audio.loop = true;
                audio.volume = baseVolume;
                audioRef.current = audio;

                audio.onended = () => {
                    audio.currentTime = 0;
                    audio.play().catch(() => undefined);
                };

                audio.onerror = () => {
                    const next = index + 1;
                    if (next < ROMANTIC_BDAY_TRACKS.length) {
                        trackIndexRef.current = next;
                        playTrack(next);
                    }
                };

                if (isAnyVideoPlaying) {
                    audio.play().catch(() => console.log("Autoplay bloqueado, esperando interacción."));
                }
            };

            playTrack(trackIndexRef.current);
        }

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, [baseVolume]);

    // Música de acompañamiento: Solo se activa cuando hay un video sonando
    useEffect(() => {
        if (audioRef.current) {
            if (isMuted || !isAnyVideoPlaying) {
                audioRef.current.volume = 0;
            } else {
                // Cuando hay video, activamos el fondo a volumen muy bajo (ambiente)
                audioRef.current.volume = Math.min(0.02, baseVolume * 0.15);
                audioRef.current.play().catch(() => {});
            }
        }
    }, [isAnyVideoPlaying, isMuted, baseVolume]);

    const handleVolumeChange = (value: number) => {
        const normalized = Math.min(1, Math.max(0, value));
        setBaseVolume(normalized);
        if (normalized === 0) {
            setIsMuted(true);
        } else if (isMuted) {
            setIsMuted(false);
        }
    };

    useEffect(() => {
        const syncCompactTabs = () => {
            setIsCompactTabs(window.innerWidth < 640);
        };

        syncCompactTabs();
        window.addEventListener("resize", syncCompactTabs);
        return () => window.removeEventListener("resize", syncCompactTabs);
    }, []);

    const handleTabChange = (tab: "mensajes" | "videos" | "memorias" | "admin") => {
        setGlobalPause(tab !== "videos" && tab !== "memorias");
        setActiveTab(tab);
    };

    const [mensajes, setMensajes] = useState<Message[]>([]);
    const [videos, setVideos] = useState<Video[]>([]);
    const [nuevoMensaje, setNuevoMensaje] = useState("");
    const [nuevoAutor, setNuevoAutor] = useState("");
    const [esPrivado, setEsPrivado] = useState(false);
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editingText, setEditingText] = useState("");
    const [pendingDeleteMessageId, setPendingDeleteMessageId] = useState<string | null>(null);
    const [toasts, setToasts] = useState<PremiumToastItem[]>([]);
    const [videosHydrated, setVideosHydrated] = useState(false);
    const [latestMemory, setLatestMemory] = useState<{ url: string, title: string } | null>(null);

    const pushToast = (type: PremiumToastType, title: string, message: string) => {
        const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        setToasts((prev) => [...prev, { id, type, title, message }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((item) => item.id !== id));
        }, 4200);
    };

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((item) => item.id !== id));
    };

    // Cargar mensajes desde Supabase
    useEffect(() => {
        const loadData = async () => {
            if (!role) return;

            const messagesQuery = (role === "admin" || role === "principal")
                ? supabase.from('messages').select('*')
                : supabase.from('messages').select('*').eq('guest_id', guestId || '');

            const { data: msgs } = await messagesQuery.order('created_at', { ascending: false });
            if (msgs) setMensajes(msgs);
        };
        loadData();
    }, [role, guestId]);

    // Cargar videos desde Supabase (Centralizado)
    useEffect(() => {
        const loadVideos = async () => {
            if (!role) return;
            try {
                const { data, error } = await supabase
                    .from('videos')
                    .select('*')
                    .order('created_at', { ascending: false });
                
                if (data && !error) {
                    setVideos(data.map(v => ({
                        ...v,
                        publicId: v.publicId || v.public_id
                    })));
                } else if (error) {
                    throw error;
                }
            } catch (err) {
                console.error("Error loading videos from Supabase:", err);
                // Fallback a localStorage si falla la red
                const raw = localStorage.getItem(VIDEO_STORAGE_KEY);
                if (raw) {
                    setVideos(JSON.parse(raw));
                }
            } finally {
                setVideosHydrated(true);
            }
        };
        loadVideos();
    }, [role]);

    // Cargar la última memoria generada
    useEffect(() => {
        const loadLatestMemory = async () => {
            const { data, error } = await supabase
                .from('memories')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(1);
            
            if (data && data.length > 0 && !error) {
                setLatestMemory(data[0]);
            }
        };
        loadLatestMemory();
    }, []);

    useEffect(() => {
        if (!videosHydrated) return;
        localStorage.setItem(VIDEO_STORAGE_KEY, JSON.stringify(videos));
    }, [videos, videosHydrated]);

    const mensajesVisibles = mensajes;
    const videosVisibles = (role === "admin" || role === "principal")
        ? videos
        : videos.filter((video) => {
            if (!guestId) return false;
            if (video.ownerId) return video.ownerId === guestId;
            return video.autor === (userName || "Invitado");
        });

    const enviarMensaje = async () => {
        if (!nuevoMensaje.trim()) return;
        if (!guestId) {
            pushToast("error", "Sesion invalida", "No se pudo identificar tu usuario. Cierra sesion y vuelve a ingresar.");
            return;
        }
        
        const autor = nuevoAutor.trim() || userName || "Invitado";
        
        const { data, error } = await supabase
            .from('messages')
            .insert([{
                guest_id: guestId,
                autor,
                texto: nuevoMensaje,
                privado: esPrivado
            }])
            .select();

        if (error) {
            pushToast("error", "Error al enviar", `No se pudo enviar el mensaje: ${error.message}`);
            return;
        }

        if (data && !error) {
            setMensajes([data[0], ...mensajes]);
            setNuevoMensaje("");
            setNuevoAutor("");
            pushToast("success", "Mensaje enviado", "Tu mensaje fue publicado correctamente.");
        }
    };

    const startEditingMessage = (message: Message) => {
        setEditingMessageId(message.id);
        setEditingText(message.texto);
    };

    const cancelEditingMessage = () => {
        setEditingMessageId(null);
        setEditingText("");
    };

    const deleteMessage = async (messageId: string) => {
        let query = supabase
            .from('messages')
            .delete()
            .eq('id', messageId);

        if (role !== "admin") {
            query = query.eq('guest_id', guestId || '');
        }

        const { error } = await query;

        if (error) {
            pushToast("error", "Error al eliminar", `No se pudo eliminar el mensaje: ${error.message}`);
            return;
        }

        setMensajes((prev) => prev.filter((msg) => msg.id !== messageId));
        setPendingDeleteMessageId(null);
        if (editingMessageId === messageId) {
            cancelEditingMessage();
        }
        pushToast("success", "Mensaje eliminado", "El mensaje se elimino correctamente.");
    };

    const canDeleteVideo = (video: Video) => {
        if (role === "admin") return true;
        if (!guestId) return false;
        if (video.ownerId) return video.ownerId === guestId;
        return video.autor === (userName || "Invitado");
    };

    const deleteVideo = (videoId: string) => {
        setVideos((prev) => prev.filter((video) => video.id !== videoId));
        pushToast("success", "Video eliminado", "El video se elimino de la galeria.");
    };

    const saveEditedMessage = async (messageId: string) => {
        const trimmed = editingText.trim();
        if (!trimmed) return;

        let query = supabase
            .from('messages')
            .update({ texto: trimmed })
            .eq('id', messageId);

        if (role !== "admin") {
            query = query.eq('guest_id', guestId || '');
        }

        const { data, error } = await query.select().single();

        if (error) {
            pushToast("error", "Error al editar", `No se pudo editar el mensaje: ${error.message}`);
            return;
        }

        setMensajes((prev) => prev.map((msg) => (msg.id === messageId ? { ...msg, texto: data.texto } : msg)));
        cancelEditingMessage();
        pushToast("success", "Mensaje actualizado", "Los cambios se guardaron correctamente.");
    };

    return (
        <div className="min-h-screen bg-b-blue-50 dark:bg-b-blue-900 transition-colors duration-700 pb-20">
            <PremiumToast toasts={toasts} onClose={removeToast} />
            {/* CONTROLES FIJOS (Tema, Música y Logout) */}
            <div className="fixed top-3 right-3 sm:top-4 sm:right-4 md:top-6 md:right-6 z-50 flex items-center gap-2 sm:gap-3">
                <button
                    onClick={() => setIsMuted(!isMuted)}
                    className={`min-h-[44px] min-w-[44px] p-3 rounded-full border-2 glass shadow-lg transition-all ${isMuted ? 'border-red-500/50 text-red-500 bg-red-500/10' : 'border-b-gold text-b-gold bg-b-gold/10'}`}
                    title={isMuted ? "Activar Musica" : "Silenciar Musica"}
                >
                    <span className="relative flex items-center justify-center">
                        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5 animate-pulse" />}
                    </span>
                </button>
                <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-full border border-b-gold/20 glass shadow-lg">
                    <input
                        type="range"
                        min={0}
                        max={100}
                        step={1}
                        value={Math.round(baseVolume * 100)}
                        onChange={(e) => handleVolumeChange(Number(e.target.value) / 100)}
                        className="w-20 accent-b-gold"
                        aria-label="Volumen de musica"
                    />
                    <span className="text-[10px] font-poppins font-bold text-b-gold/90 w-8 text-right">
                        {Math.round(baseVolume * 100)}
                    </span>
                </div>
                <ThemeToggle />
                <motion.button
                    whileHover={shouldReduceMotion ? undefined : { scale: 1.06 }}
                    whileTap={shouldReduceMotion ? undefined : { scale: 0.94 }}
                    onClick={logout}
                    className="min-h-[44px] min-w-[44px] p-3 rounded-full bg-red-500/10 border-2 border-red-500/50 text-red-500 glass shadow-lg flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                    title="Cerrar Sesión"
                >
                    <LogOut className="w-5 h-5" />
                </motion.button>
            </div>

            {/* ORNAMENTOS DE FONDO LUXURY */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden select-none">
                {/* Círculos de luz difusa */}
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-b-gold/10 dark:bg-b-gold/5 rounded-full blur-[120px] animate-pulse-gold" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 dark:bg-blue-600/5 rounded-full blur-[120px] animate-pulse" />
            </div>

            <div className="relative z-10 p-6 md:p-12">

                {/* HEADER REDISEÑADO CON RETRATO - CORRECCIÓN DE ALINEACIÓN */}
                <header className="max-w-6xl mx-auto flex flex-col lg:flex-row justify-between items-center mb-12 lg:mb-24 gap-6 lg:gap-12 px-2 sm:px-4 md:px-0">
                    <div className="flex flex-col sm:flex-row items-center gap-6 lg:gap-12 w-full lg:w-auto">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="relative flex items-center justify-center flex-shrink-0"
                        >
                            {/* Brillo exterior para profundidad */}
                            <div className="absolute inset-0 bg-b-gold/20 blur-[100px] rounded-full animate-pulse-gold" />
                            
                            {/* Contenedor del Retrato Limpio - Responsive */}
                            <div className="relative w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 lg:w-72 lg:h-72 rounded-3xl sm:rounded-[3rem] md:rounded-[4rem] border-2 border-b-gold/30 p-1 sm:p-1.5 glass overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.3)] sm:shadow-[0_15px_40px_rgba(0,0,0,0.4)] md:shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-10">
                                <img 
                                    src="/assets/images/reina.png" 
                                    alt="La Reina" 
                                    className="w-full h-full object-cover rounded-3xl sm:rounded-[2.5rem] md:rounded-[3.5rem] transition-transform duration-1000 hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                            </div>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-center sm:text-left space-y-2 sm:space-y-3 md:space-y-4 flex-1">
                            <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-3 mb-1 sm:mb-2">
                                <div className="h-[1px] w-6 sm:w-8 md:w-12 bg-b-gold/30" />
                                <span className="text-b-gold font-poppins font-bold tracking-[0.3em] sm:tracking-[0.5em] text-[8px] sm:text-[9px] md:text-[10px] uppercase">Est. 2026</span>
                                <div className="h-[1px] w-6 sm:w-8 md:w-12 bg-b-gold/30" />
                            </div>
                            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-playfair font-bold leading-tight gold-text drop-shadow-2xl line-clamp-2 sm:line-clamp-none">
                                {role === "principal" ? "Para mi Reina" : "Birthday Hub"}
                            </h1>
                            <p className="text-gray-500 dark:text-b-gold/40 tracking-[0.3em] sm:tracking-[0.6em] uppercase text-[7px] sm:text-[8px] md:text-xs font-poppins font-black">
                                Celebración • Edición Especial • {new Date().getFullYear()}
                            </p>
                        </motion.div>
                    </div>

                </header>



                {/* NAVEGACIÓN POR PESTAÑAS (TABS) LUXURY - iOS Style */}
                <div className="max-w-2xl mx-auto mb-12 lg:mb-24 px-2 sm:px-4 md:px-0">
                    <div className="p-1.5 glass rounded-2xl sm:rounded-3xl flex border border-b-gold/10 shadow-xl sm:shadow-2xl gap-1 sm:gap-1.5">
                        {(['mensajes', 'videos', 'memorias', 'admin'] as const).filter(t => {
                            if (t === 'admin') return role === 'admin';
                            if (t === 'memorias') return role === 'admin' || role === 'principal';
                            return true;
                        }).map((tab) => {
                            const Icon = TAB_META[tab].icon;
                            const label = TAB_META[tab].label;

                            return (
                            <button
                                key={tab}
                                onClick={() => handleTabChange(tab)}
                                aria-label={label}
                                className={`flex-1 min-h-[44px] py-2.5 sm:py-3 px-2 sm:px-4 rounded-xl sm:rounded-2xl font-poppins font-black text-[8px] sm:text-[9px] md:text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.3em] transition-all duration-300 flex items-center justify-center gap-1 sm:gap-2 ${activeTab === tab
                                    ? "bg-b-gold text-b-blue-950 shadow-[0_8px_25px_rgba(212,175,55,0.3)] scale-105 sm:scale-100"
                                    : "text-gray-500 hover:text-b-gold/80 active:scale-95 sm:active:scale-100"
                                    }`}
                            >
                                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                {!isCompactTabs && <span>{label}</span>}
                            </button>
                        )})}
                    </div>
                </div>

                {/* CONTENIDO PRINCIPAL */}
                <main className="max-w-6xl mx-auto">
                    <AnimatePresence mode="wait">
                        {activeTab === "mensajes" ? (
                            <motion.section
                                key="mensajes"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="space-y-16"
                            >
                                {/* BIENVENIDA PERSONALIZADA */}
                                {role === "principal" && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="text-center p-8 sm:p-12 bg-gradient-to-br from-b-gold/20 via-transparent to-transparent backdrop-blur-sm rounded-[3rem] border border-b-gold/20 shadow-2xl space-y-6"
                                    >
                                        <div className="relative inline-block">
                                            <div className="absolute inset-0 bg-b-gold/40 blur-2xl rounded-full animate-pulse" />
                                            <Sparkles className="relative w-12 h-12 text-b-gold mx-auto mb-2" />
                                        </div>
                                        <div>
                                            <h2 className="text-4xl font-serif text-b-gold mb-2 italic">¡Felicidades, Catherine!</h2>
                                            <p className="text-gray-500 dark:text-gray-300 max-w-lg mx-auto text-sm leading-relaxed mb-8">
                                                Hoy el mundo celebra tu vida. Hemos preparado una sección especial para que guardes los mejores momentos de este día.
                                            </p>
                                        </div>

                                        {latestMemory && (
                                            <motion.div 
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="max-w-3xl mx-auto space-y-4"
                                            >
                                                <div className="flex items-center justify-center gap-3 text-b-gold/60 text-[10px] font-black uppercase tracking-[0.3em]">
                                                    <div className="h-[1px] w-8 bg-b-gold/30" />
                                                    <span>Tu Video de Recuerdos</span>
                                                    <div className="h-[1px] w-8 bg-b-gold/30" />
                                                </div>
                                                <div className="glass p-2 rounded-[2rem] border border-b-gold/20 shadow-2xl overflow-hidden aspect-video">
                                                    <video 
                                                        src={latestMemory.url} 
                                                        controls 
                                                        className="w-full h-full rounded-[1.5rem] object-cover"
                                                        poster={latestMemory.url.replace(".mp4", ".jpg")}
                                                    />
                                                </div>
                                                <p className="text-[10px] text-gray-500 italic font-serif">"{latestMemory.title}"</p>
                                            </motion.div>
                                        )}
                                        
                                        <div className="pt-4">
                                            <button 
                                                onClick={() => handleTabChange("memorias")}
                                                className="px-8 py-4 bg-b-gold text-b-blue-950 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 mx-auto"
                                            >
                                                Ver Mis Memorias
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {role === "user" && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="text-center p-12 bg-white/5 backdrop-blur-sm rounded-[3rem] border border-white/10"
                                    >
                                        <Heart className="w-12 h-12 text-b-gold mx-auto mb-6 animate-pulse" />
                                        <h2 className="text-4xl font-serif text-b-gold mb-2 italic">¡Bienvenido, {userName}!</h2>
                                        <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
                                            Gracias por ser parte de este momento tan especial. Tu presencia y tus palabras son el mejor regalo.
                                        </p>
                                    </motion.div>
                                )}

                                {/* SECCIÓN DE ENVÍO DE MENSAJES (No flotante) */}
                                {(role === "user" || role === "admin" || role === "principal") && (
                                    <div className="max-w-4xl mx-auto px-2 sm:px-0">
                                        <div className="glass p-6 sm:p-8 md:p-12 rounded-2xl sm:rounded-3xl md:rounded-[3.5rem] border border-b-gold/20 shadow-2xl relative overflow-hidden">
                                            <div className="flex flex-col gap-4 sm:gap-6 md:gap-8">
                                                <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 items-center sm:items-stretch border-b border-b-gold/10 pb-4 sm:pb-6 md:pb-8">
                                                    <div className="relative flex-1 w-full">
                                                        <User className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-b-gold" />
                                                        <input
                                                            type="text"
                                                            value={nuevoAutor}
                                                            onChange={(e) => setNuevoAutor(e.target.value)}
                                                            placeholder={userName || "Tu nombre"}
                                                            className="w-full bg-black/5 dark:bg-white/5 pl-10 sm:pl-12 pr-4 sm:pr-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl outline-none text-xs sm:text-sm dark:text-white placeholder:text-gray-500 border border-transparent focus:border-b-gold/30 transition-all font-semibold"
                                                        />
                                                    </div>
                                                    <div className="hidden md:flex items-center gap-2 sm:gap-3 flex-shrink-0">
                                                        <div className="w-1 sm:w-1.5 h-1 sm:h-1.5 rounded-full bg-b-gold animate-ping" />
                                                        <span className="text-[8px] sm:text-[10px] font-poppins font-black text-b-gold uppercase tracking-[0.3em]">Nueva Entrada</span>
                                                    </div>
                                                </div>

                                                <div className="relative">
                                                    <MessageSquare className="absolute left-3 sm:left-4 top-3 sm:top-4 w-4 sm:w-5 h-4 sm:h-5 text-b-gold/30" />
                                                    <textarea
                                                        value={nuevoMensaje}
                                                        onChange={(e) => setNuevoMensaje(e.target.value)}
                                                        placeholder="Escribe algo que la haga sonreír..."
                                                        className="w-full bg-transparent outline-none text-base sm:text-lg md:text-2xl pl-10 sm:pl-12 pr-4 sm:pr-6 py-2 sm:py-3 md:py-2 h-32 sm:h-36 md:h-40 resize-none dark:text-white placeholder:text-gray-500 placeholder:text-xs sm:placeholder:text-sm font-serif italic"
                                                    />
                                                </div>

                                                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 sm:gap-6 md:gap-8 pt-2 sm:pt-4">
                                                    <label className="flex items-center gap-2 sm:gap-4 cursor-pointer group order-2 sm:order-1">
                                                        <div className="relative flex-shrink-0">
                                                            <input type="checkbox" checked={esPrivado} onChange={(e) => setEsPrivado(e.target.checked)} className="sr-only" />
                                                            <div className={`w-12 sm:w-14 h-6 sm:h-7 rounded-full transition-all duration-500 ${esPrivado ? 'bg-b-gold shadow-[0_0_15px_rgba(212,175,55,0.3)] sm:shadow-[0_0_20px_rgba(212,175,55,0.4)]' : 'bg-gray-300 dark:bg-slate-800'}`} />
                                                            <div className={`absolute top-0.5 sm:top-1 left-0.5 sm:left-1 w-5 h-5 bg-white rounded-full transition-transform duration-500 shadow-md ${esPrivado ? 'translate-x-6 sm:translate-x-7' : ''}`} />
                                                        </div>
                                                        <div className="flex items-center gap-2 sm:gap-3 text-[7px] sm:text-[9px] md:text-[10px] font-poppins font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-gray-500 group-hover:text-b-gold transition-colors">
                                                            <Lock className={`w-3 sm:w-4 h-3 sm:h-4 transition-transform group-hover:rotate-12 ${esPrivado ? 'text-b-gold' : 'text-gray-400'}`} />
                                                            <span className="hidden xxs:inline">Privado</span>
                                                        </div>
                                                    </label>

                                                    <button
                                                        onClick={enviarMensaje}
                                                        disabled={!nuevoMensaje.trim()}
                                                        className="w-full sm:w-auto min-h-[44px] flex items-center justify-center gap-2 sm:gap-4 bg-b-gold text-b-blue-950 px-6 sm:px-10 md:px-14 py-3.5 sm:py-4 rounded-xl sm:rounded-[2rem] font-poppins font-black uppercase text-xs sm:text-xs tracking-[0.3em] sm:tracking-[0.4em] hover:scale-105 active:scale-95 disabled:opacity-30 transition-all shadow-xl sm:shadow-2xl group order-1 sm:order-2"
                                                    >
                                                        <span className="hidden xxs:inline">ENVIAR AHORA</span>
                                                        <span className="inline xxs:hidden text-[10px]">ENVIAR</span>
                                                        <Send className="w-3 sm:w-4 h-3 sm:h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 px-2 sm:px-0">
                                    {mensajesVisibles.map((m, i) => (
                                        <motion.div
                                            key={m.id}
                                            initial={{ opacity: 0, y: 30 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            whileHover={shouldReduceMotion ? undefined : { y: -3 }}
                                            transition={{ delay: shouldReduceMotion ? 0 : i * 0.08 }}
                                            className={`p-6 sm:p-8 md:p-10 rounded-2xl sm:rounded-3xl md:rounded-[3rem] shadow-xl sm:shadow-2xl relative overflow-hidden glass group border ${m.privado
                                                ? "border-b-gold/40"
                                                : "border-white/5"
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 md:mb-8">
                                                <div className="w-6 sm:w-8 h-[1px] bg-b-gold/30" />
                                                <span className="text-[8px] sm:text-[9px] md:text-[10px] font-poppins font-black text-b-gold uppercase tracking-[0.3em] sm:tracking-[0.4em] truncate">{m.autor}</span>
                                            </div>

                                            <p className="text-lg sm:text-xl md:text-3xl font-serif leading-snug dark:text-gray-100 italic line-clamp-4 sm:line-clamp-5">
                                                {editingMessageId === m.id ? (
                                                    <textarea
                                                        value={editingText}
                                                        onChange={(e) => setEditingText(e.target.value)}
                                                        className="w-full bg-black/5 dark:bg-white/5 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-2xl text-base sm:text-lg md:text-2xl outline-none border border-b-gold/20"
                                                        rows={3}
                                                    />
                                                ) : (
                                                    <>"{m.texto}"</>
                                                )}
                                            </p>

                                            {m.privado && (
                                                <div className="mt-4 sm:mt-6 md:mt-10 flex items-center gap-2 sm:gap-3 text-[7px] sm:text-[8px] md:text-[10px] font-poppins font-black text-b-gold tracking-[0.2em] uppercase">
                                                    <Lock className="w-3 sm:w-4 h-3 sm:h-4 animate-pulse flex-shrink-0" />
                                                    <span className="hidden xxs:inline">Solo para tus ojos</span>
                                                    <span className="inline xxs:hidden">Privado</span>
                                                </div>
                                            )}

                                            {(role === "admin" || m.guest_id === guestId) && (
                                                <div className="mt-4 sm:mt-6 flex items-center gap-2">
                                                    {editingMessageId === m.id ? (
                                                        <>
                                                            <button
                                                                onClick={() => saveEditedMessage(m.id)}
                                                                className="min-h-[44px] flex items-center gap-2 px-4 py-2 rounded-xl bg-b-gold text-b-blue-950 text-xs font-bold tracking-widest"
                                                            >
                                                                <Save className="w-3 h-3" />
                                                                GUARDAR
                                                            </button>
                                                            <button
                                                                onClick={cancelEditingMessage}
                                                                className="min-h-[44px] flex items-center gap-2 px-4 py-2 rounded-xl bg-black/10 dark:bg-white/10 text-xs font-bold tracking-widest"
                                                            >
                                                                <X className="w-3 h-3" />
                                                                CANCELAR
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            {pendingDeleteMessageId === m.id ? (
                                                                <>
                                                                    <button
                                                                        onClick={() => deleteMessage(m.id)}
                                                                        className="min-h-[44px] flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/90 text-white text-xs font-bold tracking-widest"
                                                                    >
                                                                        <Trash2 className="w-3 h-3" />
                                                                        CONFIRMAR
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setPendingDeleteMessageId(null)}
                                                                        className="min-h-[44px] flex items-center gap-2 px-4 py-2 rounded-xl bg-black/10 dark:bg-white/10 text-xs font-bold tracking-widest"
                                                                    >
                                                                        <X className="w-3 h-3" />
                                                                        CANCELAR
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <button
                                                                        onClick={() => startEditingMessage(m)}
                                                                        className="min-h-[44px] flex items-center gap-2 px-4 py-2 rounded-xl bg-black/10 dark:bg-white/10 text-xs font-bold tracking-widest hover:bg-b-gold/20 transition-colors"
                                                                    >
                                                                        <Edit2 className="w-3 h-3" />
                                                                        EDITAR
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setPendingDeleteMessageId(m.id)}
                                                                        className="min-h-[44px] flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/15 text-red-300 border border-red-400/30 text-xs font-bold tracking-widest hover:bg-red-500/25 transition-colors"
                                                                    >
                                                                        <Trash2 className="w-3 h-3" />
                                                                        ELIMINAR
                                                                    </button>
                                                                </>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.section>
                        ) : activeTab === "videos" ? (
                            <motion.section
                                key="videos"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-8 sm:space-y-12"
                            >
                                {/* WIDGET DE SUBIDA MEJORADO */}
                                {(role === "user" || role === "admin" || role === "principal") && (
                                    <div className="flex justify-center mb-10 sm:mb-16">
                                        <VideoUpload
                                            userName={userName || "Invitado"}
                                            onSuccess={async (publicId: string) => {
                                                const videoData = {
                                                    publicId,
                                                    autor: userName || "Invitado",
                                                    titulo: "Momento Mágico",
                                                    ownerId: guestId || null
                                                };

                                                const { data, error } = await supabase
                                                    .from('videos')
                                                    .insert([videoData])
                                                    .select()
                                                    .single();

                                                if (error) {
                                                    console.error("Error saving video to DB:", error);
                                                    pushToast("error", "Error de Nube", "El video se subió pero no se pudo registrar en la base de datos.");
                                                    return;
                                                }

                                                const newVideo: Video = {
                                                    id: data.id,
                                                    publicId: data.publicId,
                                                    autor: data.autor,
                                                    titulo: data.titulo,
                                                    ownerId: data.ownerId,
                                                    created_at: data.created_at,
                                                };

                                                setVideos((prev) => [newVideo, ...prev.filter((v) => v.publicId !== publicId)]);
                                                pushToast("success", "Video agregado", "El video se subió y registró correctamente.");
                                            }}
                                        />
                                    </div>
                                )}

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-12 px-2 sm:px-0">
                                    {videosVisibles.map((video) => (
                                        <div key={video.id} className="space-y-3">
                                            <VideoCard
                                                publicId={video.publicId}
                                                autor={video.autor}
                                                titulo={video.titulo}
                                            />

                                            {canDeleteVideo(video) && (
                                                <div className="flex justify-end gap-2 px-2 sm:px-4">
                                                    <button
                                                        onClick={() => deleteVideo(video.id)}
                                                        className="min-h-[44px] flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/15 text-red-300 border border-red-400/30 text-xs font-bold tracking-widest hover:bg-red-500/25 transition-colors"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                        ELIMINAR VIDEO
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {videosVisibles.length === 0 && (
                                    <div className="mx-2 sm:mx-0 p-6 sm:p-10 rounded-2xl sm:rounded-3xl border border-b-gold/20 glass text-center">
                                        <p className="text-sm sm:text-base font-poppins text-gray-500 dark:text-gray-300">
                                            Aun no hay videos visibles. Sube un video y veras solo los videos que publicaste.
                                        </p>
                                    </div>
                                )}
                            </motion.section>
                        ) : activeTab === "memorias" ? (
                            <motion.section
                                key="memorias"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="min-h-[60vh] flex flex-col items-center justify-center"
                            >
                                <div className="glass p-12 rounded-[3.5rem] border border-b-gold/20 text-center max-w-2xl space-y-8">
                                    <div className="w-20 h-20 bg-b-gold/20 rounded-3xl flex items-center justify-center text-b-gold mx-auto">
                                        <Sparkles className="w-10 h-10" />
                                    </div>
                                    <div className="space-y-4">
                                        <h2 className="text-4xl font-serif italic text-white">
                                            {role === "admin" ? "Generador de Memorias" : "Tus Recuerdos Mágicos"}
                                        </h2>
                                        <p className="text-gray-400 font-poppins text-sm leading-relaxed">
                                            {role === "admin" 
                                                ? "Selecciona los mejores momentos y crea una película cinematográfica para Catherine." 
                                                : "Disfruta de la compilación especial de momentos que hemos preparado para ti."}
                                        </p>
                                    </div>
                                    
                                    {role === "admin" ? (
                                        <button 
                                            onClick={() => router.push("/admin/memories")}
                                            className="w-full h-16 bg-b-gold text-b-blue-950 rounded-2xl flex items-center justify-center gap-3 font-poppins font-black uppercase tracking-[0.3em] shadow-xl hover:scale-105 transition-all"
                                        >
                                            Abrir Generador de Highlights
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    ) : latestMemory ? (
                                        <div className="space-y-6">
                                            <div className="glass p-4 rounded-[2rem] border border-white/5 aspect-video overflow-hidden">
                                                <video src={latestMemory.url} controls className="w-full h-full rounded-[1.5rem]" />
                                            </div>
                                            <p className="text-xs text-b-gold font-black uppercase tracking-widest">{latestMemory.title}</p>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-gray-500 uppercase tracking-widest">Aún no hay memorias generadas. El admin las creará pronto.</p>
                                    )}
                                </div>
                            </motion.section>
                        ) : (
                            <motion.section
                                key="admin"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                            >
                                <AdminPanel />
                            </motion.section>
                        )}
                    </AnimatePresence>
                </main>

            </div>
        </div>
    );
}