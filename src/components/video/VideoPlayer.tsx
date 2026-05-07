"use client";
import { CldVideoPlayer } from 'next-cloudinary';
import 'next-cloudinary/dist/cld-video-player.css';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Play, Pause, RotateCcw, RotateCw, Maximize } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

import { useAuth } from '@/context/AuthContext';

interface BrandingConfig {
    base: string;
    accent: string;
}

interface VideoPlayerProps {
    publicId: string;
    branding?: BrandingConfig;
    controls?: boolean;
    autoPlay?: boolean;
    onPlayStateChange?: (isPlaying: boolean) => void;
}

export default function VideoPlayer({
    publicId,
    branding = { base: "#020617", accent: "#d4af37" },
    controls = true,
    autoPlay = false,
    onPlayStateChange
}: VideoPlayerProps) {
    const { isGlobalPaused, setIsAnyVideoPlaying } = useAuth();
    const shouldReduceMotion = useReducedMotion();
    const [isPlaying, setIsPlaying] = useState(false);
    const [showControls, setShowControls] = useState(false);
    const [isTouchUi, setIsTouchUi] = useState(false);
    const playerRef = useRef<any>(null);
    const [dimensions, setDimensions] = useState({ width: 1080, height: 1080 }); // Default neutral square
    const [isDimensionsLoaded, setIsDimensionsLoaded] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setIsTouchUi(window.matchMedia('(hover: none)').matches);
        }
    }, []);

    // Reaccionar a pausa global
    useEffect(() => {
        if (isGlobalPaused && playerRef.current && isPlaying) {
            playerRef.current.pause();
        }
    }, [isGlobalPaused, isPlaying]);

    // Fallback de seguridad: si en 2 segundos no detectamos dimensiones, mostramos igual
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!isDimensionsLoaded) {
                setIsDimensionsLoaded(true);
            }
        }, 2000);
        return () => clearTimeout(timer);
    }, [isDimensionsLoaded]);

    const updateDimensions = (player: any) => {
        if (!player) return;
        const w = player.videoWidth();
        const h = player.videoHeight();
        if (w && h) {
            setDimensions({ width: w, height: h });
            setIsDimensionsLoaded(true);
        }
    };

    const handlePlayPause = () => {
        if (playerRef.current) {
            if (isPlaying) {
                playerRef.current.pause();
            } else {
                playerRef.current.play();
            }
        }
    };

    const handleRewind = () => {
        if (playerRef.current) {
            const currentTime = playerRef.current.currentTime();
            playerRef.current.currentTime(Math.max(0, currentTime - 10));
        }
    };

    const handleForward = () => {
        if (playerRef.current) {
            const currentTime = playerRef.current.currentTime();
            const duration = playerRef.current.duration();
            playerRef.current.currentTime(Math.min(duration, currentTime + 10));
        }
    };

    return (
        <div
            className={`relative group rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden shadow-xl sm:shadow-2xl border border-b-gold/20 glass transition-all duration-700 ${!isDimensionsLoaded ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
            style={{ 
                aspectRatio: `${dimensions.width} / ${dimensions.height}`,
                maxHeight: dimensions.height > dimensions.width ? '70vh' : 'auto'
            }}
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => setShowControls(false)}
            onClick={() => {
                if (isTouchUi) setShowControls((prev) => !prev);
            }}
        >
            {!publicId && (
                <div className="w-full h-full flex items-center justify-center bg-black/30 text-b-gold/80 text-xs font-poppins uppercase tracking-[0.2em] min-h-[200px]">
                    Video sin ID valido
                </div>
            )}
            <CldVideoPlayer
                width={dimensions.width.toString()}
                height={dimensions.height.toString()}
                src={publicId}
                colors={{
                    accent: branding.accent,
                    base: branding.base,
                    text: "#ffffff"
                }}
                fontFace="Playfair Display"
                autoplay={autoPlay}
                onDataLoad={(event: { player: any }) => {
                    playerRef.current = event.player;
                    updateDimensions(event.player);
                }}
                onMetadataLoad={(event: { player: any }) => {
                    updateDimensions(event.player);
                }}
                onPlay={() => {
                    setIsPlaying(true);
                    setIsAnyVideoPlaying(true);
                    onPlayStateChange?.(true);
                    if (playerRef.current) updateDimensions(playerRef.current);
                }}
                onPause={() => {
                    setIsPlaying(false);
                    setIsAnyVideoPlaying(false);
                    onPlayStateChange?.(false);
                }}
                className="w-full h-full object-contain"
            />

            {/* INTERFAZ "MODO CINE" PERSONALIZADA */}
            {controls && publicId && (
                <AnimatePresence>
                    {(showControls || isTouchUi) && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2 }}
                            className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3 sm:p-6 z-10"
                        >
                            {/* Barra de Controles */}
                            <div className="flex items-center justify-between gap-2 sm:gap-4">
                                <div className="flex items-center gap-2 sm:gap-4">
                                    <button onClick={handleRewind} className="min-h-[44px] min-w-[44px] p-2 rounded-xl hover:text-b-gold transition-colors text-white">
                                        <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6" />
                                    </button>
                                    
                                    <button 
                                        onClick={handlePlayPause}
                                        className="w-11 h-11 sm:w-12 sm:h-12 bg-b-gold rounded-full flex items-center justify-center text-b-blue-950 shadow-lg sm:shadow-xl hover:scale-105 transition-all"
                                    >
                                        {isPlaying ? <Pause className="w-5 h-5 sm:w-6 sm:h-6 fill-current" /> : <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current ml-0.5 sm:ml-1" />}
                                    </button>

                                    <button onClick={handleForward} className="min-h-[44px] min-w-[44px] p-2 rounded-xl hover:text-b-gold transition-colors text-white">
                                        <RotateCw className="w-5 h-5 sm:w-6 sm:h-6" />
                                    </button>
                                </div>

                                <div className="flex items-center gap-2 sm:gap-4 text-white">
                                    <button onClick={() => playerRef.current?.maximize()} className="min-h-[44px] min-w-[44px] p-2 rounded-xl hover:text-b-gold transition-colors">
                                        <Maximize className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Indicador de "Modo Cine" */}
                            <div className="absolute top-3 left-3 sm:top-6 sm:left-6 flex items-center gap-2 opacity-60">
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse motion-reduce:animate-none" />
                                <span className="text-[9px] sm:text-[10px] font-black text-white tracking-[0.2em] sm:tracking-[0.3em] uppercase">Cinema Mode</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            )}

            {/* Efecto Glow en Bordes */}
            <div className="absolute inset-0 border border-b-gold/10 pointer-events-none rounded-[2rem]" />
        </div>
    );
}
