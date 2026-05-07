"use client";
import { motion, useReducedMotion } from "framer-motion";
import VideoPlayer from "./video/VideoPlayer";

interface VideoProps {
    publicId: string;
    autor: string;
    titulo: string;
}

export default function VideoCard({ publicId, autor, titulo }: VideoProps) {
    const shouldReduceMotion = useReducedMotion();

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.35 }}
            viewport={{ once: true, margin: "-10%" }}
            className="p-3 sm:p-6 rounded-2xl sm:rounded-[3rem] border border-b-gold/10 glass shadow-lg sm:shadow-2xl overflow-hidden group"
        >
            <div className="rounded-xl sm:rounded-[2rem] overflow-hidden mb-3 sm:mb-6">
                <VideoPlayer 
                    publicId={publicId}
                    controls={true}
                    branding={{ base: "#020617", accent: "#d4af37" }}
                />
            </div>
            
            <div className="px-0.5 sm:px-2">
                <div className="flex items-center gap-1.5 sm:gap-3 mb-1 sm:mb-2">
                    <div className="w-4 h-[1px] bg-b-gold/30" />
                    <span className="text-[7px] sm:text-[10px] font-black text-b-gold uppercase tracking-[0.2em] sm:tracking-[0.4em] truncate">{autor}</span>
                </div>
                <h3 className="text-sm sm:text-2xl font-serif italic dark:text-gray-100 leading-tight line-clamp-1 sm:line-clamp-none">{titulo}</h3>
            </div>
        </motion.div>
    );
}