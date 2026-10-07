'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [inputKey, setInputKey] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isLocal =
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1';

      if (isLocal) {
        // Auto-authenticate on local development
        setIsAuthenticated(true);
        return;
      }

      // Check if we have a stored session token
      const storedToken = localStorage.getItem('mooearth_admin_token');
      if (storedToken) {
        // Verify the stored token server-side
        verifyKey(storedToken, true);
      } else {
        // Check for query parameter key
        const params = new URLSearchParams(window.location.search);
        const queryKey = params.get('adminKey') || params.get('key');
        if (queryKey) {
          verifyKey(queryKey, true);
        } else {
          setIsAuthenticated(false);
        }
      }
    }
  }, []);

  async function verifyKey(key: string, silent = false) {
    if (!silent) setIsVerifying(true);
    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });
      const data = await res.json();
      if (data.authenticated) {
        localStorage.setItem('mooearth_admin_token', key);
        setIsAuthenticated(true);
        setErrorMsg('');
      } else {
        localStorage.removeItem('mooearth_admin_token');
        setIsAuthenticated(false);
        if (!silent) setErrorMsg('Invalid administrator credentials.');
      }
    } catch {
      setIsAuthenticated(false);
      if (!silent) setErrorMsg('Verification failed. Please try again.');
    } finally {
      if (!silent) setIsVerifying(false);
    }
  }

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    verifyKey(inputKey.trim());
  };

  const handleLock = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mooearth_admin_token');
    }
    setIsAuthenticated(false);
  };

  // Loading state
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white/50 text-sm font-mono">
        Verifying Security Credentials...
      </div>
    );
  }

  // Locked: Admin Access Gate
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#030712] text-white flex flex-col items-center justify-center px-4 font-sans relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -top-20 -left-20 pointer-events-none" />
        <div className="absolute w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -bottom-20 -right-20 pointer-events-none" />

        <div className="w-full max-w-md p-8 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] z-10 text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/30 flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(6,182,212,0.2)]">
            🔒
          </div>

          <div>
            <h1 className="text-xl font-black text-white tracking-tight">Admin Security Gate</h1>
            <p className="text-xs text-white/50 mt-1">
              Restricted area. Please provide administrator credentials to access system telemetry and diagnostic dashboards.
            </p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <input
                type="password"
                placeholder="Enter Administrator Key"
                value={inputKey}
                onChange={(e) => {
                  setInputKey(e.target.value);
                  setErrorMsg('');
                }}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all text-center tracking-widest font-mono"
                autoFocus
              />
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-400 font-medium animate-shake">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={isVerifying}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVerifying ? 'Verifying...' : 'Authenticate & Access ➔'}
            </button>
          </form>

          <div className="pt-2 border-t border-white/5">
            <Link
              href="/"
              className="text-xs text-white/40 hover:text-white transition-colors"
            >
              ← Return to MooEarth Public Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Authorized Admin View
  return (
    <div className="min-h-screen bg-[#030712] text-white">
      {/* Top Admin Bar */}
      <div className="sticky top-0 z-50 px-4 py-2 bg-slate-950/90 border-b border-white/10 backdrop-blur-xl flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold text-emerald-300">ADMIN CONSOLE ACTIVE</span>
          <span className="text-white/20">|</span>
          <Link href="/admin/health" className="text-white/60 hover:text-white transition-colors">
            Health Diagnostics
          </Link>
          <span className="text-white/20">|</span>
          <Link href="/admin/analytics" className="text-white/60 hover:text-white transition-colors">
            Analytics
          </Link>
          <span className="text-white/20">|</span>
          <Link href="/admin/seo" className="text-white/60 hover:text-white transition-colors">
            SEO & Search Console
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/" className="text-white/40 hover:text-white transition-colors">
            View Live Site ↗
          </Link>
          <button
            onClick={handleLock}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-rose-500/20 text-white/60 hover:text-rose-300 border border-white/10 text-[11px] transition-colors cursor-pointer"
          >
            Lock Session 🔒
          </button>
        </div>
      </div>

      <main>{children}</main>
    </div>
  );
}
