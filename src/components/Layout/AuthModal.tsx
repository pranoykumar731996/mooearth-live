'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: { username: string; avatar: string; country: string }) => void;
}

const AVATAR_EMOJIS = ['⚽', '🏆', '🔥', '👑', '🥳', '🕶️', '⚡', '🌟', '💥', '🦁', '🦅', '🐺'];

const COUNTRY_OPTIONS = [
  'Argentina', 'Australia', 'Belgium', 'Brazil', 'Cameroon', 'Canada', 
  'Chile', 'Colombia', 'Croatia', 'England', 'France', 'Germany', 
  'Italy', 'Japan', 'Mexico', 'Morocco', 'Netherlands', 'Nigeria', 
  'Portugal', 'Senegal', 'South Korea', 'Spain', 'United Kingdom', 'United States', 'Uruguay'
];

export default function AuthModal({ isOpen, onClose, onLoginSuccess }: AuthModalProps) {
  const [username, setUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('⚽');
  const [selectedCountry, setSelectedCountry] = useState('Brazil');
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    const userData = {
      username: username.trim(),
      avatar: selectedAvatar,
      country: selectedCountry,
    };

    localStorage.setItem('mooearth_user', JSON.stringify(userData));
    onLoginSuccess(userData);
    onClose();
  };

  const handleSocialLogin = (platform: string) => {
    const defaultUser = {
      username: platform === 'Google' ? 'Google_Fan' : 'Github_Fan',
      avatar: '👑',
      country: 'Brazil',
    };
    localStorage.setItem('mooearth_user', JSON.stringify(defaultUser));
    onLoginSuccess(defaultUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-[90vw] max-w-[420px] rounded-3xl p-6 glass border border-white/10 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(15,15,25,0.95) 0%, rgba(5,5,15,0.95) 100%)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(0, 229, 255, 0.1)'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
          {isRegistering ? 'Create Profile' : 'Sign In to MooEarth'}
        </h2>
        <p className="text-xs text-white/40 mb-6">
          Join the live emotional fan celebration network.
        </p>

        {isRegistering ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1">Username</label>
              <input
                type="text"
                required
                placeholder="e.g. neymar_fan"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:border-cyan-500 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1">Fan Country</label>
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-neutral-900 border border-white/10 text-white focus:border-cyan-500 focus:outline-none transition-colors"
              >
                {COUNTRY_OPTIONS.map((c) => (
                  <option key={c} value={c} className="bg-neutral-900 text-white">{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Choose Avatar Emoji</label>
              <div className="grid grid-cols-6 gap-2">
                {AVATAR_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setSelectedAvatar(emoji)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg border transition-all ${
                      selectedAvatar === emoji
                        ? 'border-cyan-400 bg-cyan-500/20 shadow-[0_0_15px_rgba(0,229,255,0.3)]'
                        : 'border-white/5 bg-white/5 hover:border-white/15'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-sm tracking-wide shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/35 transition-all duration-300 active:scale-98"
            >
              CREATE FAN PROFILE
            </button>

            <p className="text-center text-xs text-white/30 mt-3">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setIsRegistering(false)}
                className="text-cyan-400 hover:underline"
              >
                Sign In
              </button>
            </p>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="space-y-3">
              <button
                onClick={() => handleSocialLogin('Google')}
                className="w-full py-2.5 px-4 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-semibold flex items-center justify-center gap-3 hover:bg-white/10 transition-all cursor-pointer"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                </svg>
                Sign In with Google
              </button>
            </div>

            <div className="flex items-center gap-3 my-4">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-[10px] text-white/20 uppercase tracking-widest">or email</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setIsRegistering(true);
              }}
              className="space-y-3"
            >
              <input
                type="email"
                required
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:border-cyan-500 focus:outline-none transition-colors text-sm"
              />
              <input
                type="password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:border-cyan-500 focus:outline-none transition-colors text-sm"
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-white text-black font-semibold text-sm hover:bg-neutral-200 transition-colors active:scale-98 cursor-pointer"
              >
                Sign In
              </button>
            </form>

            <p className="text-center text-xs text-white/30 mt-3">
              New to MooEarth?{' '}
              <button
                type="button"
                onClick={() => setIsRegistering(true)}
                className="text-cyan-400 hover:underline"
              >
                Create Fan Profile
              </button>
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
