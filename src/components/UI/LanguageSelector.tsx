'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { SUPPORTED_LOCALES, LOCALES_META, SupportedLocale, isSupportedLocale } from '@/lib/i18n';

interface LanguageSelectorProps {
  compact?: boolean;
  className?: string;
}

export default function LanguageSelector({ compact = false, className = '' }: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLocale, setCurrentLocale] = useState<SupportedLocale>('en');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname() || '/';
  const router = useRouter();

  // Detect current language from URL pathname or localStorage
  useEffect(() => {
    const segments = pathname.split('/').filter(Boolean);
    const firstSegment = segments[0];

    if (firstSegment && isSupportedLocale(firstSegment)) {
      setCurrentLocale(firstSegment);
      if (typeof window !== 'undefined') {
        localStorage.setItem('mooearth_locale', firstSegment);
      }
    } else {
      setCurrentLocale('en');
    }
  }, [pathname]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle switching language
  function handleSelectLocale(targetLocale: SupportedLocale) {
    setIsOpen(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('mooearth_locale', targetLocale);
    }

    const segments = pathname.split('/').filter(Boolean);
    const hasLangPrefix = segments.length > 0 && isSupportedLocale(segments[0]);

    const cleanPathSegments = hasLangPrefix ? segments.slice(1) : segments;
    let newPath = '';

    if (targetLocale === 'en') {
      // English is root default
      newPath = cleanPathSegments.length === 0 ? '/' : `/${cleanPathSegments.join('/')}`;
    } else {
      newPath = `/${targetLocale}/${cleanPathSegments.join('/')}`;
    }

    // Preserve any existing search params
    if (typeof window !== 'undefined' && window.location.search) {
      newPath += window.location.search;
    }

    router.push(newPath);
  }

  const activeMeta = LOCALES_META[currentLocale] || LOCALES_META.en;

  return (
    <div ref={dropdownRef} className={`relative z-50 inline-block text-left ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        id="language-selector-btn"
        onClick={() => setIsOpen(!isOpen)}
        title={`Change Language (Current: ${activeMeta.nativeName})`}
        className={`flex items-center gap-1.5 rounded-xl border transition-all duration-200 pointer-events-auto cursor-pointer ${
          compact
            ? 'h-8 px-2 bg-white/5 border-white/10 hover:bg-white/10 text-xs text-white/90 active:scale-95'
            : 'h-9 px-3 bg-white/5 border-white/10 hover:bg-white/10 hover:border-cyan-400/40 text-xs font-semibold text-white active:scale-95 shadow-sm'
        } ${isOpen ? 'border-cyan-400/60 bg-white/10 ring-1 ring-cyan-400/30' : ''}`}
      >
        <span className="text-sm">{activeMeta.flag}</span>
        <span className="font-bold uppercase tracking-wider text-[11px] text-cyan-300">
          {activeMeta.code}
        </span>
        <svg
          className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#090d22] border border-cyan-500/40 shadow-[0_20px_50px_rgba(0,0,0,0.95)] z-[60] p-2 animate-fadeIn"
          style={{
            maxHeight: '380px',
            overflowY: 'auto',
          }}
        >
          <div className="px-3 py-2 border-b border-white/10 mb-1 flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">
              Select Language
            </span>
            <span className="text-[10px] text-cyan-400 font-mono">8 Locales</span>
          </div>

          <div className="space-y-1">
            {SUPPORTED_LOCALES.map((localeCode) => {
              const meta = LOCALES_META[localeCode];
              const isSelected = localeCode === currentLocale;

              return (
                <button
                  key={localeCode}
                  type="button"
                  onClick={() => handleSelectLocale(localeCode)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                    isSelected
                      ? 'bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 font-bold shadow-sm shadow-cyan-500/20'
                      : 'hover:bg-white/10 text-slate-300 hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{meta.flag}</span>
                    <div className="text-left">
                      <div className="font-semibold">{meta.nativeName}</div>
                      <div className="text-[10px] text-slate-400">{meta.name}</div>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="text-xs text-cyan-400 font-bold font-mono">✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
