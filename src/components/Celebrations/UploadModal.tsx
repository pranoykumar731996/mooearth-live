'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WorldEvent } from '@/types';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc } from 'firebase/firestore';
import { storage, db } from '@/lib/firebase';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  matches: WorldEvent[];
  currentUser: { username: string; avatar: string; country: string } | null;
  onUploadSuccess: (celebration: any) => void;
}

const COUNTRY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'Brazil':         { lat: -14.2350, lng: -51.9253 },
  'Argentina':      { lat: -38.4161, lng: -63.6167 },
  'France':         { lat: 46.2276,  lng: 2.2137 },
  'Germany':        { lat: 51.1657,  lng: 10.4515 },
  'Spain':          { lat: 40.4637,  lng: -3.7492 },
  'Italy':          { lat: 41.8719,  lng: 12.5674 },
  'Portugal':       { lat: 39.3999,  lng: -8.2245 },
  'Netherlands':    { lat: 52.1326,  lng: 5.2913 },
  'Belgium':        { lat: 50.5039,  lng: 4.4699 },
  'England':        { lat: 52.3555,  lng: -1.1743 },
  'United Kingdom': { lat: 55.3781,  lng: -3.4360 },
  'Colombia':       { lat: 4.5709,   lng: -74.2973 },
  'Mexico':         { lat: 23.6345,  lng: -102.5528 },
  'Japan':          { lat: 36.2048,  lng: 138.2529 },
  'South Korea':    { lat: 35.9078,  lng: 127.7669 },
  'USA':            { lat: 37.0902,  lng: -95.7129 },
  'United States':  { lat: 37.0902,  lng: -95.7129 },
  'Croatia':        { lat: 45.1000,  lng: 15.2000 },
  'Uruguay':        { lat: -32.5228, lng: -55.7658 },
  'Morocco':        { lat: 31.7917,  lng: -7.0926 },
  'Nigeria':        { lat: 9.0820,   lng: 8.6753 },
  'Cameroon':       { lat: 7.3697,   lng: 12.3547 },
  'Senegal':        { lat: 14.4974,  lng: -14.4524 },
  'Australia':      { lat: -25.2744, lng: 133.7751 },
  'Canada':         { lat: 56.1304,  lng: -106.3468 },
  'Chile':          { lat: -35.6751, lng: -71.5430 },
};

const FALLBACK_WORLD_CUP_MATCHES = [
  { id: 'wc-1', title: 'United States vs Morocco (Group Stage)' },
  { id: 'wc-2', title: 'Mexico vs Sweden (Group Stage)' },
  { id: 'wc-3', title: 'Canada vs Saudi Arabia (Group Stage)' },
  { id: 'wc-4', title: 'Spain vs Croatia (Group Stage)' },
  { id: 'wc-5', title: 'Brazil vs Japan (Group Stage)' },
  { id: 'wc-6', title: 'Argentina vs Senegal (Group Stage)' },
  { id: 'wc-7', title: 'Germany vs Uruguay (Group Stage)' },
  { id: 'wc-8', title: 'France vs South Korea (Group Stage)' },
];


export default function UploadModal({ isOpen, onClose, matches, currentUser, onUploadSuccess }: UploadModalProps) {
  const [activeTab, setActiveTab] = useState<'video' | 'image' | 'audio'>('video');
  const [selectedMatch, setSelectedMatch] = useState('');
  const [comment, setComment] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Audio recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize selected match
  useEffect(() => {
    const activeMatches = matches && matches.length > 0 ? matches : FALLBACK_WORLD_CUP_MATCHES;
    if (activeMatches.length > 0) {
      const exists = activeMatches.some(m => m.title === selectedMatch);
      if (!selectedMatch || !exists) {
        setSelectedMatch(activeMatches[0].title);
      }
    }
  }, [matches, selectedMatch]);

  const displayMatches = matches && matches.length > 0 ? matches : FALLBACK_WORLD_CUP_MATCHES;

  if (!isOpen) return null;

  // Start Audio Recording
  const startRecording = async () => {
    try {
      setError(null);
      setRecordedAudioUrl(null);
      setRecordedChunks([]);
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(audioUrl);
        
        // Convert to a File object so it can be uploaded
        const audioFile = new File([audioBlob], `voice-reaction-${Date.now()}.webm`, { type: 'audio/webm' });
        setFile(audioFile);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Microphone error:', err);
      setError('Could not access microphone. Please check permissions.');
    }
  };

  // Stop Audio Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setError(null);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError('You must be signed in to upload.');
      return;
    }
    if (!file) {
      setError('Please choose a file or record audio first.');
      return;
    }
    if (!comment.trim()) {
      setError('Please add an emotional reaction comment.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // 1. Upload file directly to Firebase Storage
      const storageRef = ref(storage, `uploads/${Date.now()}-${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);

      // Get user's coordinates
      const coords = COUNTRY_COORDINATES[currentUser.country] || { lat: 0, lng: 0 };

      // 2. Submit celebration details directly to Firestore
      const celebData = {
        username: currentUser.username,
        avatar: currentUser.avatar,
        country: currentUser.country,
        match: selectedMatch || 'Global Fan Reaction',
        type: activeTab,
        url,
        comment: comment.trim(),
        lat: coords.lat,
        lng: coords.lng,
        timestamp: Date.now(),
        reports: 0
      };

      const docRef = await addDoc(collection(db, 'celebrations'), celebData);
      const newCeleb = { id: docRef.id, ...celebData };
      
      onUploadSuccess(newCeleb);
      onClose();
      
      // Reset state
      setComment('');
      setFile(null);
      setRecordedAudioUrl(null);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'An error occurred during upload.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-[90vw] max-w-[460px] rounded-3xl p-6 glass border border-white/10 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(15,15,25,0.95) 0%, rgba(5,5,15,0.95) 100%)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(0, 229, 255, 0.1)'
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">Upload Reaction</h2>
        <p className="text-xs text-white/40 mb-5">Share your real-time emotions on the World Cup Globe.</p>

        {/* Tab Buttons */}
        <div className="flex border-b border-white/5 mb-5">
          {(['video', 'image', 'audio'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setFile(null);
                setError(null);
                setRecordedAudioUrl(null);
              }}
              className={`flex-1 pb-3 text-sm font-semibold capitalize border-b-2 transition-all cursor-pointer ${
                activeTab === tab
                  ? 'border-cyan-400 text-cyan-400 font-bold'
                  : 'border-transparent text-white/40 hover:text-white/60'
              }`}
            >
              {tab === 'video' && '🎥 Video'}
              {tab === 'image' && '📸 Photo'}
              {tab === 'audio' && '🎤 Voice'}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2.5 rounded-xl text-xs mb-4">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-4">
          {/* Media Capture Section */}
          <div className="bg-white/5 border border-white/5 rounded-2xl p-5 flex flex-col items-center justify-center min-h-[140px] text-center">
            {activeTab === 'audio' ? (
              <div className="w-full flex flex-col items-center gap-3">
                {isRecording ? (
                  <>
                    {/* Pulsing record indicator */}
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                      <span className="text-xs text-red-500 uppercase tracking-widest font-bold">RECORDING LIVE VOICE...</span>
                    </div>
                    {/* Animated Spectrogram Wave */}
                    <div className="flex items-center justify-center gap-1.5 h-10 w-full px-8">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ height: [12, 36, 12] }}
                          transition={{
                            duration: 0.6 + Math.random() * 0.4,
                            repeat: Infinity,
                            delay: i * 0.05,
                          }}
                          className="w-1.5 bg-cyan-400 rounded-full"
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="px-5 py-2 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-500 transition-colors cursor-pointer"
                    >
                      ⏹️ STOP RECORDING
                    </button>
                  </>
                ) : recordedAudioUrl ? (
                  <>
                    <p className="text-xs text-white/50 mb-1">🎤 Voice Clip Recorded successfully!</p>
                    <audio src={recordedAudioUrl} controls className="w-full max-w-[280px] h-10 border border-white/10 rounded-xl overflow-hidden filter invert" />
                    <button
                      type="button"
                      onClick={startRecording}
                      className="text-xs text-cyan-400 hover:underline cursor-pointer"
                    >
                      Record Again
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center text-xl mb-1">
                      🎤
                    </div>
                    <p className="text-xs text-white/40 mb-3">Record a short voice cheer, scream, or chant.</p>
                    <button
                      type="button"
                      onClick={startRecording}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs hover:shadow-lg hover:shadow-cyan-500/20 transition-all cursor-pointer"
                    >
                      ⏺️ START RECORDING
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="w-full">
                <input
                  type="file"
                  id="media-file-input"
                  accept={activeTab === 'video' ? 'video/*' : 'image/*'}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="media-file-input"
                  className="flex flex-col items-center justify-center cursor-pointer w-full"
                >
                  <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xl mb-2 hover:bg-white/10 transition-colors">
                    📤
                  </div>
                  {file ? (
                    <div>
                      <p className="text-sm font-semibold text-white max-w-[280px] truncate">{file.name}</p>
                      <p className="text-[10px] text-white/40 mt-0.5">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs font-semibold text-white/60">Choose {activeTab === 'video' ? 'Video File' : 'Photo'}</p>
                      <p className="text-[10px] text-white/30 mt-1">Short clips/reaction photos up to 25MB</p>
                    </>
                  )}
                </label>
              </div>
            )}

          </div>

          {/* Select Match */}
          <div>
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1">Attach to Match</label>
            <select
              value={selectedMatch}
              onChange={(e) => setSelectedMatch(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-neutral-900 border border-white/10 text-white focus:border-cyan-500 focus:outline-none transition-colors text-sm"
            >
              {displayMatches.map((m) => (
                <option key={m.id} value={m.title} className="bg-neutral-900 text-white">
                  {m.title}
                </option>
              ))}
              <option value="Global Fan Celebration" className="bg-neutral-900 text-white">General Celebration</option>
            </select>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1">Fan Reaction Comment</label>
            <textarea
              required
              rows={2}
              placeholder="e.g. Absolute madness! What an incredible goal! 🏆🎉"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:border-cyan-500 focus:outline-none transition-colors text-sm resize-none"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={uploading || isRecording}
            className={`w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-sm tracking-wide shadow-lg transition-all duration-300 flex items-center justify-center gap-2 ${
              uploading || isRecording
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:shadow-cyan-500/35 cursor-pointer active:scale-98'
            }`}
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 rounded-full border border-white/20 border-t-white animate-spin" />
                UPLOADING TO LIVE NETWORK...
              </>
            ) : (
              'UPLOAD CELEBRATION'
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
