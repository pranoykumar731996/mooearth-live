// ============================================================
// MooEarth Live — Install App Button
// ============================================================

'use client';

import { usePWA } from '@/hooks/usePWA';
import { motion, AnimatePresence } from 'framer-motion';

export default function InstallButton() {
  const { canInstall, promptInstall } = usePWA();

  return (
    <AnimatePresence>
      {canInstall && (
        <motion.button
          id="install-app-btn"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={promptInstall}
          className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                     bg-gradient-to-r from-cyan-500/20 to-blue-500/20
                     border border-cyan-500/30 text-cyan-400
                     hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(0,229,255,0.15)]
                     transition-all duration-300 cursor-pointer"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Install App
        </motion.button>
      )}
    </AnimatePresence>
  );
}
