'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface PageCloseBarProps {
  title?: string;
  backHref?: string;
}

export default function PageCloseBar({
  title = 'MooEarth Live',
  backHref = '/',
}: PageCloseBarProps) {
  const router = useRouter();

  const handleClose = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push(backHref);
    }
  };

  // Keyboard Escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#070714]/90 backdrop-blur-xl border-b border-white/[0.08] px-4 sm:px-8 py-3">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Back button & branding */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleClose}
            className="h-9 px-3 flex items-center gap-1.5 rounded-xl bg-white/5 hover:bg-white/10 active:bg-white/20 border border-white/10 text-white/80 hover:text-white transition-all cursor-pointer text-xs font-bold"
            title="Go back to previous page"
            aria-label="Go back to previous page"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            <span>Back</span>
          </button>

          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-xl">🌍</span>
            <span className="font-extrabold text-sm tracking-tight text-white group-hover:text-cyan-300 transition-colors">
              Moo<span className="text-cyan-400">Earth</span>
            </span>
          </Link>
        </div>

        {/* Right: Crossbar Close button */}
        <button
          onClick={handleClose}
          className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 text-white/80 hover:text-white border border-white/15 flex items-center justify-center transition-all cursor-pointer shadow-md shrink-0"
          title="Close and return to Earth (Esc)"
          aria-label="Close page"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </header>
  );
}
