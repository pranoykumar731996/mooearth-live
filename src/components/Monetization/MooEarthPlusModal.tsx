'use client';

import React, { useState, useEffect } from 'react';
import { trackPlusModalOpen, trackPlusInterestSubmit } from '@/services/analytics';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

interface MooEarthPlusModalProps {
  isOpen: boolean;
  onClose: () => void;
  source?: string;
}

const PLUS_BENEFITS = [
  {
    id: 'ad_free',
    emoji: '🛡️',
    title: 'Ad-Free Planetary Exploration',
    description: 'Completely distraction-free browsing across global news, 3D atlas, and climate layers.'
  },
  {
    id: 'saved_collections',
    emoji: '★',
    title: 'Unlimited Saved Places & Curations',
    description: 'Organize personal travel dossiers, bookmarks, and regional alerts without local storage limits.'
  },
  {
    id: 'deep_discovery',
    emoji: '🧭',
    title: 'Deep Planetary Intelligence & Radar',
    description: 'High-resolution atmospheric radar, historical news archives, and comparative regional metrics.'
  },
  {
    id: 'custom_layers',
    emoji: '🌐',
    title: 'Custom Map Layers & Pro Export',
    description: 'Export regional intelligence snapshots, high-res visual cards, and customized map styles.'
  }
];

export const MooEarthPlusModal: React.FC<MooEarthPlusModalProps> = ({
  isOpen,
  onClose,
  source = 'user_trigger'
}) => {
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(['ad_free', 'deep_discovery']);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      trackPlusModalOpen(source);
      setSubmitted(false);
      setErrorMsg('');
    }
  }, [isOpen, source]);

  if (!isOpen) return null;

  const toggleFeature = (id: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      // 1. Telemetry signal
      trackPlusInterestSubmit(source, selectedFeatures);

      // 2. Persist waitlist signal to Firestore if available
      if (db) {
        try {
          await addDoc(collection(db, 'plus_waitlist'), {
            email: email.trim().toLowerCase(),
            requestedFeatures: selectedFeatures,
            source,
            createdAt: new Date().toISOString()
          });
        } catch (dbErr) {
          console.warn('Firestore waitlist record fallback:', dbErr);
        }
      }

      setSubmitted(true);
    } catch (err: any) {
      setErrorMsg('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="plus-modal-title"
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-cyan-500/30 p-6 md:p-8 shadow-2xl text-slate-100 overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Close modal"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/30">
            <span>✨</span>
            Conceptual Research & Waitlist
          </span>
        </div>

        <h2 id="plus-modal-title" className="text-xl md:text-2xl font-bold text-white tracking-tight">
          MooEarth Plus
        </h2>
        <p className="text-xs md:text-sm text-slate-400 mt-1 leading-relaxed">
          Core globe exploration and world news will <strong className="text-slate-200">always remain free</strong>. We are exploring a community-supported tier to fund independent servers and advanced features.
        </p>

        {/* Validation notice */}
        <div className="my-4 p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/20 flex items-start gap-2.5 text-xs text-cyan-200/90 leading-relaxed">
          <span className="text-cyan-400 font-bold shrink-0 mt-0.5">ℹ️</span>
          <span>
            <strong>No charges today:</strong> This is a demand validation survey. We will not take any payment or ask for credit card info until community interest is proven.
          </span>
        </div>

        {submitted ? (
          <div className="my-8 text-center space-y-3 py-4 animate-in zoom-in-95">
            <div className="inline-flex p-3 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white">Thank You for Your Voice!</h3>
            <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
              Your feedback directly shapes our development roadmap. You are on our priority early-access list and will be notified before any official launch.
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs rounded-xl border border-white/10 transition-colors"
            >
              Back to MooEarth
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-300 mb-2 block">
                Which premium capabilities would be most valuable to you?
              </label>
              <div className="space-y-2">
                {PLUS_BENEFITS.map((b) => {
                  const isChecked = selectedFeatures.includes(b.id);
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => toggleFeature(b.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 ${
                        isChecked
                          ? 'bg-cyan-950/40 border-cyan-500/40 text-white shadow-sm'
                          : 'bg-slate-900/50 border-white/5 text-slate-400 hover:border-white/10'
                      }`}
                    >
                      <div
                        className={`p-1.5 rounded-lg mt-0.5 text-base ${
                          isChecked ? 'bg-cyan-500/20' : 'bg-slate-800'
                        }`}
                      >
                        {b.emoji}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-white">{b.title}</span>
                          {isChecked && (
                            <svg className="w-3.5 h-3.5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">{b.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Email waitlist input */}
            <div className="pt-2">
              <label htmlFor="plus-waitlist-email" className="text-xs font-medium text-slate-300 mb-1.5 block">
                Notify me when early access opens (Optional):
              </label>
              <div className="flex gap-2">
                <input
                  id="plus-waitlist-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="flex-1 bg-slate-900/90 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                  required
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-semibold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                  {isSubmitting ? 'Submitting...' : 'Join Waitlist'}
                </button>
              </div>
              {errorMsg && <p className="text-[11px] text-rose-400 mt-1">{errorMsg}</p>}
            </div>

            <div className="pt-2 text-center text-[10px] text-slate-500">
              Pricing hypothesis: ~$2.99 / month or ~$24 / year. Zero automated rebills until your explicit confirmation.
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
