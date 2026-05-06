"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

export type PremiumToastType = "success" | "error" | "info";

export interface PremiumToastItem {
  id: string;
  type: PremiumToastType;
  title: string;
  message: string;
}

interface PremiumToastProps {
  toasts: PremiumToastItem[];
  onClose: (id: string) => void;
}

const toneStyles: Record<PremiumToastType, string> = {
  success: "border-emerald-400/40 bg-emerald-500/10 text-emerald-200",
  error: "border-red-400/40 bg-red-500/10 text-red-200",
  info: "border-b-gold/40 bg-b-gold/10 text-b-gold-light",
};

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

export default function PremiumToast({ toasts, onClose }: PremiumToastProps) {
  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[70] w-[min(92vw,560px)] pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = icons[toast.type];
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto mb-3 border rounded-2xl backdrop-blur-xl shadow-2xl ${toneStyles[toast.type]}`}
            >
              <div className="flex items-start gap-3 p-4 sm:p-5">
                <div className="min-h-[44px] min-w-[44px] rounded-xl bg-black/20 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 pr-2">
                  <p className="font-poppins font-bold uppercase tracking-[0.2em] text-[10px] sm:text-xs">
                    {toast.title}
                  </p>
                  <p className="mt-1 text-sm sm:text-[15px] leading-relaxed text-white/90">
                    {toast.message}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onClose(toast.id)}
                  className="min-h-[44px] min-w-[44px] rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center"
                  aria-label="Cerrar notificacion"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
