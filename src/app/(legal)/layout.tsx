import React from 'react';
import GlobalFooter from '@/components/Layout/GlobalFooter';
import PageCloseBar from '@/components/Layout/PageCloseBar';

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen overflow-y-auto scrollbar-thin bg-[var(--background)] pt-20 pb-16 px-4 sm:px-6 lg:px-8">
      <PageCloseBar />
      <div className="max-w-4xl mx-auto bg-[var(--surface-color)]/30 border border-white/5 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden mt-4">
        <div className="p-8 sm:p-12 md:p-16 text-[var(--foreground)] prose prose-invert prose-emerald max-w-none prose-headings:text-emerald-400 prose-a:text-emerald-400 hover:prose-a:text-emerald-300">
          {children}
        </div>
      </div>
      <GlobalFooter />
    </div>
  );
}
