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
            className="p-4 sm:p-6 rounded-[1.75rem] sm:rounded-[3rem] border border-b-gold/20 glass shadow-xl sm:shadow-2xl overflow-hidden group"
        >
            <div className="rounded-[1.25rem] sm:rounded-[2rem] overflow-hidden mb-4 sm:mb-6">
                <VideoPlayer 
                    publicId={publicId}
                    controls={true}
                    branding={{ base: "#020617", accent: "#d4af37" }}
                />
            </div>
            
            <div className="px-1 sm:px-2">
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                    <div className="w-6 h-[1px] bg-b-gold/30" />
                    <span className="text-[9px] sm:text-[10px] font-black text-b-gold uppercase tracking-[0.25em] sm:tracking-[0.4em] truncate">{autor}</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-serif italic dark:text-gray-100 leading-tight">{titulo}</h3>
            </div>
        </motion.div>
    );
}