'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WorldEvent } from '@/types';
import { TrendingCountry } from '@/hooks/useEmotionMap';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  events: WorldEvent[];
  trendingCountries: TrendingCountry[];
  globalEnergyScore: number;
}

export default function AIAssistantDrawer({
  isOpen,
  onClose,
  events,
  trendingCountries,
  globalEnergyScore,
}: AIAssistantDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Welcome to MooEarth Live! I'm your real-time AI assistant. Ask me anything about live match scores, trending national sentiments, or global pulse statistics.",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userText = textToSend.trim();
    setInput('');
    setIsLoading(true);

    // Append user message
    const updatedMessages: Message[] = [...messages, { role: 'user', content: userText }];
    setMessages(updatedMessages);

    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
          events,
          trendingCountries,
          globalEnergyScore,
        }),
      });

      if (!response.ok) throw new Error('Assistant API returned an error');

      const data = await response.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (error) {
      console.error('Failed to get assistant reply:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "Sorry, I'm experiencing connectivity issues. Please try asking again in a few moments.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend(input);
    }
  };

  const quickPrompts = [
    { label: '⚽ Mexico score', text: 'Who won the match between Mexico and South Africa?' },
    { label: '🔥 Who is trending?', text: 'Which country is currently most emotional and why?' },
    { label: '💓 Global pulse', text: 'What is the current Global Pulse Energy score?' },
    { label: '📰 Brazil news', text: 'Is there any news about Brazil?' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: 420, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 420, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed right-6 top-[100px] bottom-24 w-[360px] z-50 rounded-3xl glass border border-white/10 flex flex-col overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.6)] pointer-events-auto"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-white/[0.05] flex items-center justify-between shrink-0 bg-black/20">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-sm shadow-[0_0_15px_rgba(0,229,255,0.3)]">
                🤖
              </div>
              <div>
                <h3 className="text-xs font-black text-white tracking-wide uppercase">AI Assistant</h3>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[9px] text-white/40 uppercase tracking-widest font-semibold">Online</span>
                </div>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white/50 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-[0_4px_15px_rgba(0,180,216,0.15)] rounded-tr-none'
                      : 'bg-white/5 border border-white/5 text-white/90 rounded-tl-none'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/5 border border-white/5 rounded-2xl rounded-tl-none px-4 py-3 text-xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-[bounce_1.4s_infinite_0.2s]" />
                  <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-[bounce_1.4s_infinite_0.4s]" />
                  <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-[bounce_1.4s_infinite_0.6s]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions */}
          <div className="px-4 py-2 flex flex-wrap gap-2 border-t border-white/[0.03] shrink-0 bg-black/10">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt.text)}
                disabled={isLoading}
                className="bg-white/5 hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-500/30 text-white/70 hover:text-cyan-400 text-[10px] py-1.5 px-3 rounded-full cursor-pointer transition-all disabled:opacity-50 disabled:pointer-events-none"
              >
                {prompt.label}
              </button>
            ))}
          </div>

          {/* Message Input Area */}
          <div className="p-4 border-t border-white/[0.05] bg-black/20 shrink-0 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isLoading}
              placeholder="Ask MooEarth AI Assistant..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-white/30 focus:border-cyan-500/50 focus:outline-none transition-all disabled:opacity-50"
            />
            <button
              onClick={() => handleSend(input)}
              disabled={!input.trim() || isLoading}
              className="h-10 px-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-bold text-xs tracking-wide hover:opacity-90 active:scale-95 transition-all flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:pointer-events-none disabled:scale-100"
            >
              SEND
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
