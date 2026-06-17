'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  signInWithRedirect
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase';

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle email/password sign-in or sign-up
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isRegistering) {
        // Sign Up Flow
        if (!username.trim()) {
          throw new Error('Please enter a username');
        }

        // 1. Create authentication user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const uid = userCredential.user.uid;

        // 2. Save custom profile attributes to Firestore (wrapped in resilient try-catch with 1.5s timeout)
        const profileData = {
          username: username.trim(),
          avatar: selectedAvatar,
          country: selectedCountry,
          email: email.trim(),
          createdAt: Date.now()
        };

        try {
          const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500));
          await Promise.race([
            setDoc(doc(db, 'users', uid), profileData),
            timeoutPromise
          ]);
        } catch (firestoreErr) {
          console.warn('Failed to save user profile to Firestore (database might be unconfigured/offline/slow):', firestoreErr);
        }

        // 3. Update client state and close
        onLoginSuccess({
          username: profileData.username,
          avatar: profileData.avatar,
          country: profileData.country
        });
      } else {
        // Sign In Flow
        // 1. Authenticate with Firebase Auth
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
        const uid = userCredential.user.uid;

        // 2. Fetch custom profile attributes from Firestore (wrapped in resilient try-catch with 1.5s timeout)
        let profile = {
          username: userCredential.user.email?.split('@')[0] || 'User',
          avatar: '⚽',
          country: 'Brazil'
        };

        try {
          const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500));
          const userDoc = await Promise.race([
            getDoc(doc(db, 'users', uid)),
            timeoutPromise
          ]) as any;

          if (userDoc.exists()) {
            const data = userDoc.data();
            profile = {
              username: data.username || profile.username,
              avatar: data.avatar || profile.avatar,
              country: data.country || profile.country
            };
          }
        } catch (firestoreErr) {
          console.warn('Failed to fetch user profile from Firestore (database might be unconfigured/offline/slow):', firestoreErr);
        }

        onLoginSuccess(profile);
      }

      onClose();
      // Reset forms
      setEmail('');
      setPassword('');
      setUsername('');
    } catch (err: any) {
      console.error('Authentication error:', err);
      let friendlyMessage = err.message || 'An error occurred during authentication.';
      
      // Clean up common Firebase error codes for cleaner UI presentation
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        friendlyMessage = 'Invalid email or password.';
      } else if (err.code === 'auth/email-already-in-use') {
        friendlyMessage = 'This email address is already in use.';
      } else if (err.code === 'auth/invalid-email') {
        friendlyMessage = 'Please enter a valid email address.';
      } else if (err.code === 'auth/weak-password') {
        friendlyMessage = 'Password should be at least 6 characters.';
      }
      
      setError(friendlyMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google OAuth sign-in
  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const uid = result.user.uid;

      // Check if user document already exists in Firestore (wrapped in resilient try-catch with 1.5s timeout)
      let profile = {
        username: result.user.displayName || result.user.email?.split('@')[0] || 'Google_Fan',
        avatar: '👑',
        country: 'United States'
      };

      try {
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500));
        const userDoc = await Promise.race([
          getDoc(doc(db, 'users', uid)),
          timeoutPromise
        ]) as any;

        if (!userDoc.exists()) {
          // Create a default profile for new Google sign-ins
          const newProfile = {
            username: profile.username,
            avatar: profile.avatar,
            country: profile.country,
            email: result.user.email || '',
            createdAt: Date.now()
          };
          try {
            const writeTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500));
            await Promise.race([
              setDoc(doc(db, 'users', uid), newProfile),
              writeTimeout
            ]);
          } catch (writeErr) {
            console.warn('Failed to write Google user profile to Firestore:', writeErr);
          }
        } else {
          const data = userDoc.data();
          profile = {
            username: data?.username || profile.username,
            avatar: data?.avatar || profile.avatar,
            country: data?.country || profile.country
          };
        }
      } catch (firestoreErr) {
        console.warn('Failed to fetch/save Google user profile from Firestore (database might be unconfigured/offline/slow):', firestoreErr);
      }

      onLoginSuccess({
        username: profile.username || 'Google_Fan',
        avatar: profile.avatar || '👑',
        country: profile.country || 'United States'
      });

      onClose();
    } catch (err: any) {
      console.warn('Google Sign-In popup failed, checking fallback...', err);
      
      // If popup is blocked, closed, or cancelled, attempt redirect fallback
      if (
        err.code === 'auth/popup-blocked' || 
        err.code === 'auth/popup-closed-by-user' ||
        err.code === 'auth/cancelled-popup-request' ||
        (typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
      ) {
        try {
          await signInWithRedirect(auth, googleProvider);
        } catch (redirectErr: any) {
          console.error('Google Sign-In redirect error:', redirectErr);
          setError(redirectErr.message || 'Failed to sign in with Google.');
          setIsLoading(false);
        }
      } else {
        let friendlyMessage = err.message || 'Failed to sign in with Google.';
        if (err.code === 'auth/unauthorized-domain') {
          friendlyMessage = 'This domain (mooearth.live) is not authorized in the Firebase console. Please add it to Authorized Domains under Authentication > Settings.';
        }
        setError(friendlyMessage);
        setIsLoading(false);
      }
    }
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
          disabled={isLoading}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors disabled:opacity-50"
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

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2.5 rounded-xl text-xs mb-4">
            ⚠️ {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Social Sign In (Only visible in Sign In mode or as quick start) */}
          {!isRegistering && (
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-semibold flex items-center justify-center gap-3 hover:bg-white/10 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
              </svg>
              Sign In with Google
            </button>
          )}

          {!isRegistering && (
            <div className="flex items-center gap-3 my-4">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-[10px] text-white/20 uppercase tracking-widest">or email</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Common Auth Fields (Email & Password) */}
            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1">Email Address</label>
              <input
                type="email"
                required
                disabled={isLoading}
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:border-cyan-500 focus:outline-none transition-colors text-sm disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1">Password</label>
              <input
                type="password"
                required
                disabled={isLoading}
                placeholder="Password (min. 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:border-cyan-500 focus:outline-none transition-colors text-sm disabled:opacity-50"
              />
            </div>

            {/* Registration Specific Profile Fields */}
            {isRegistering && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1">Username</label>
                  <input
                    type="text"
                    required
                    disabled={isLoading}
                    placeholder="e.g. neymar_fan"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:border-cyan-500 focus:outline-none transition-colors text-sm disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1">Fan Country</label>
                  <select
                    value={selectedCountry}
                    disabled={isLoading}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-neutral-900 border border-white/10 text-white focus:border-cyan-500 focus:outline-none transition-colors text-sm disabled:opacity-50"
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
                        disabled={isLoading}
                        onClick={() => setSelectedAvatar(emoji)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg border transition-all disabled:opacity-50 ${
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
              </>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-sm tracking-wide shadow-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                isLoading
                  ? 'opacity-55 cursor-not-allowed'
                  : 'hover:shadow-cyan-500/35 cursor-pointer active:scale-98'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 rounded-full border border-white/20 border-t-white animate-spin" />
                  AUTHENTICATING...
                </>
              ) : isRegistering ? (
                'CREATE FAN PROFILE'
              ) : (
                'SIGN IN'
              )}
            </button>

            {/* Toggle Sign-In / Sign-Up */}
            <p className="text-center text-xs text-white/30 mt-4">
              {isRegistering ? 'Already have an account?' : 'New to MooEarth?'}{' '}
              <button
                type="button"
                disabled={isLoading}
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setError(null);
                }}
                className="text-cyan-400 hover:underline disabled:opacity-50"
              >
                {isRegistering ? 'Sign In' : 'Create Fan Profile'}
              </button>
            </p>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
