import React from 'react';
import GlobalFooter from '@/components/Layout/GlobalFooter';

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--background)] pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-[var(--surface-color)]/30 border border-white/5 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8 sm:p-12 md:p-16 text-[var(--foreground)] prose prose-invert prose-emerald max-w-none prose-headings:text-emerald-400 prose-a:text-emerald-400 hover:prose-a:text-emerald-300">
          {children}
        </div>
      </div>
      <GlobalFooter />
    </div>
  );
}
