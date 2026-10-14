// ============================================================
// MooEarth.Live — Personal Profile & Saved Places Dashboard
// ============================================================

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import ProfileModal from '@/components/UI/ProfileModal';
import AuthModal from '@/components/Layout/AuthModal';

export default function ProfilePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{
    uid: string;
    username: string;
    avatar: string;
    country: string;
  } | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        let profile = {
          uid: user.uid,
          username: user.displayName || user.email?.split('@')[0] || 'User',
          avatar: '🌍',
          country: 'Global',
        };

        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            profile = {
              uid: user.uid,
              username: data.username || profile.username,
              avatar: data.avatar || profile.avatar,
              country: data.country || profile.country,
            };
          }
        } catch (e) {
          console.warn('[ProfilePage] Error fetching user doc:', e);
        }

        setCurrentUser(profile);
      } else {
        setCurrentUser(null);
      }
      setIsReady(true);
    });

    return () => unsubscribe();
  }, []);

  return (
    <main className="min-h-screen bg-black text-white relative flex flex-col items-center justify-center p-4">
      {/* Background Starfield / Radial Glow */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(0,229,255,0.08)_0%,rgba(0,0,0,1)_85%)]" />

      {/* Navigation Return Header */}
      <header className="fixed top-6 left-6 z-40">
        <Link
          href="/"
          className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold transition-all flex items-center gap-2 backdrop-blur-md"
        >
          <span>←</span>
          <span>Return to 3D Globe</span>
        </Link>
      </header>

      {/* Main Profile Modal Interface */}
      {isReady && (
        <ProfileModal
          isOpen={true}
          onClose={() => router.push('/')}
          currentUser={currentUser}
          onSelectCountry={(country) => {
            if (country) router.push(`/?country=${encodeURIComponent(country)}`);
          }}
          onSelectLocation={(loc) => {
            if (loc) {
              router.push(`/?city=${encodeURIComponent(loc.name)}&lat=${loc.lat}&lng=${loc.lng}`);
            }
          }}
          onFocusCoordinates={(coords) => {
            router.push(`/?lat=${coords.lat}&lng=${coords.lng}`);
          }}
          onOpenAuth={() => setIsAuthOpen(true)}
          onSignOut={async () => {
            try {
              await signOut(auth);
              setCurrentUser(null);
            } catch (err) {
              console.error('Sign out error:', err);
            }
          }}
        />
      )}

      {/* Auth Modal if guest clicks Sign In */}
      {isAuthOpen && (
        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          onLoginSuccess={(user) => {
            setCurrentUser({
              uid: auth.currentUser?.uid || 'temp',
              username: user.username,
              avatar: user.avatar,
              country: user.country,
            });
            setIsAuthOpen(false);
          }}
        />
      )}
    </main>
  );
}
