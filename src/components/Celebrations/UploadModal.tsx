'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WorldEvent } from '@/types';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc } from 'firebase/firestore';
import { storage, db } from '@/lib/firebase';
import { trackEvent } from '@/services/analytics';
import { shareContent } from '@/utils/share';
import { BRANDING } from '@/config/branding';

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
  const [selectedMatch, setSelectedMatch] = useState(() => {
    const activeMatches = matches && matches.length > 0 ? matches : FALLBACK_WORLD_CUP_MATCHES;
    return activeMatches.length > 0 ? activeMatches[0].title : '';
  });
  const [matchSearch, setMatchSearch] = useState(() => {
    const activeMatches = matches && matches.length > 0 ? matches : FALLBACK_WORLD_CUP_MATCHES;
    return activeMatches.length > 0 ? activeMatches[0].title : '';
  });
  const [isMatchDropdownOpen, setIsMatchDropdownOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedCeleb, setUploadedCeleb] = useState<any | null>(null);
  const [showShareToast, setShowShareToast] = useState(false);

  const handleShareReaction = async () => {
    if (!uploadedCeleb) return;

    let refQuery = '';
    if (typeof window !== 'undefined') {
      try {
        const cachedUser = localStorage.getItem('mooearth_user');
        if (cachedUser) {
          const parsed = JSON.parse(cachedUser);
          if (parsed && parsed.username) {
            refQuery = `&ref=${encodeURIComponent(parsed.username)}`;
          }
        }
      } catch (err) {}
    }

    const shareUrl = `/?reaction=${uploadedCeleb.id}${refQuery}`;
    const didShare = await shareContent({
      title: `Fan Reaction — ${BRANDING.name}`,
      text: `🌍 Check out my live reaction for ${uploadedCeleb.country} on MooEarth Live!`,
      url: shareUrl
    });

    if (!didShare) {
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 2000);
    }
  };

  // Audio recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Camera & Video Capture states
  const [cameraActive, setCameraActive] = useState(false);
  const [recordingVideo, setRecordingVideo] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);

  const videoStreamRef = useRef<MediaStream | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const videoRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const stopAllStreams = () => {
    // Stop audio stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    // Stop video stream
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach((track) => track.stop());
      videoStreamRef.current = null;
    }
    // Stop recording intervals
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    setIsRecording(false);
    setRecordingVideo(false);
    setCameraActive(false);
    setRecordingDuration(0);
  };

  useEffect(() => {
    if (!isOpen) {
      stopAllStreams();
      setFile(null);
      setError(null);
      setRecordedAudioUrl(null);
      setLocalPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setMatchSearch('');
      setIsMatchDropdownOpen(false);
    }
    return () => {
      stopAllStreams();
    };
  }, [isOpen]);

  const resetMedia = () => {
    setFile(null);
    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl);
    }
    setLocalPreviewUrl(null);
    setRecordedAudioUrl(null);
    stopAllStreams();
  };

  const startCamera = async (forVideo: boolean) => {
    try {
      setError(null);
      stopAllStreams();

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: forVideo
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoStreamRef.current = stream;
      setCameraActive(true);
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Could not access camera. Please check permissions or verify camera is connected.');
      setCameraActive(false);
    }
  };

  const videoRefCallback = (el: HTMLVideoElement | null) => {
    videoElementRef.current = el;
    if (el && videoStreamRef.current) {
      el.srcObject = videoStreamRef.current;
    }
  };

  const takePhoto = () => {
    if (!videoElementRef.current || !videoStreamRef.current) return;

    const video = videoElementRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          const photoFile = new File([blob], `live-photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
          setFile(photoFile);

          const previewUrl = URL.createObjectURL(blob);
          setLocalPreviewUrl(previewUrl);
          stopAllStreams();
        }
      }, 'image/jpeg', 0.95);
    }
  };

  const startVideoRecording = () => {
    if (!videoStreamRef.current) return;

    let options = { mimeType: 'video/webm;codecs=vp9' };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = { mimeType: 'video/webm;codecs=vp8' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: 'video/webm' };
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options = { mimeType: 'video/mp4' };
        }
      }
    }

    try {
      const mediaRecorder = new MediaRecorder(videoStreamRef.current, options);
      videoRecorderRef.current = mediaRecorder;

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const videoBlob = new Blob(chunks, { type: options.mimeType });
        const ext = options.mimeType.includes('mp4') ? 'mp4' : 'webm';
        const videoFile = new File([videoBlob], `live-video-${Date.now()}.${ext}`, { type: options.mimeType });
        setFile(videoFile);

        const previewUrl = URL.createObjectURL(videoBlob);
        setLocalPreviewUrl(previewUrl);
        stopAllStreams();
      };

      mediaRecorder.start();
      setRecordingVideo(true);
      setRecordingDuration(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => {
          if (prev >= 59) {
            stopVideoRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Failed to start MediaRecorder:', err);
      setError('Failed to start video recording. Your browser might not support this encoding.');
    }
  };

  const stopVideoRecording = () => {
    if (videoRecorderRef.current && videoRecorderRef.current.state !== 'inactive') {
      videoRecorderRef.current.stop();
    }
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    setRecordingVideo(false);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const [worldCupMatches, setWorldCupMatches] = useState<any[]>([]);

  const getDisplayMatches = () => {
    const combined: any[] = [];
    const seen = new Set<string>();

    // Add props matches first
    if (matches && matches.length > 0) {
      matches.forEach((m) => {
        if (m.title && !seen.has(m.title)) {
          seen.add(m.title);
          combined.push({
            id: m.id,
            title: m.title
          });
        }
      });
    }

    // Add fetched world cup matches formatted with date
    if (worldCupMatches.length > 0) {
      worldCupMatches.forEach((m) => {
        const dateStr = new Date(m.kickoff).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        const title = `${m.homeTeam} vs ${m.awayTeam} (World Cup — ${dateStr})`;
        if (!seen.has(title)) {
          seen.add(title);
          combined.push({
            id: m.id,
            title: title
          });
        }
      });
    }

    // If still empty, use formatted fallbacks
    if (combined.length === 0) {
      return FALLBACK_WORLD_CUP_MATCHES;
    }

    return combined;
  };

  const displayMatches = getDisplayMatches();

  const filteredDisplayMatches = displayMatches.filter((m) =>
    m.title.toLowerCase().includes(matchSearch.toLowerCase())
  );

  const handleSelectMatchOption = (title: string) => {
    setSelectedMatch(title);
    setMatchSearch(title);
    setIsMatchDropdownOpen(false);
  };

  // Fetch real World Cup matches list on open
  useEffect(() => {
    if (isOpen) {
      // Sync initial search with default selection
      const activeMatches = getDisplayMatches();
      if (activeMatches.length > 0) {
        setSelectedMatch(activeMatches[0].title);
        setMatchSearch(activeMatches[0].title);
      }

      fetch('/api/worldcup/matches')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setWorldCupMatches(data);
          }
        })
        .catch((err) => console.error('Failed to fetch world cup matches in modal:', err));
    }
  }, [isOpen]);

  useEffect(() => {
    if (displayMatches.length > 0 && !selectedMatch) {
      setSelectedMatch(displayMatches[0].title);
      setMatchSearch(displayMatches[0].title);
    }
  }, [worldCupMatches, matches, selectedMatch]);

  const [prevMatches, setPrevMatches] = useState<any[]>([]);
  if (JSON.stringify(displayMatches) !== JSON.stringify(prevMatches)) {
    setPrevMatches(displayMatches);
    if (displayMatches.length > 0) {
      const exists = displayMatches.some((m) => m.title === selectedMatch);
      if (!selectedMatch || !exists) {
        setSelectedMatch(displayMatches[0].title);
        setMatchSearch(displayMatches[0].title);
      }
    }
  }

  if (!isOpen) return null;

  // Start Audio Recording
  const startRecording = async () => {
    try {
      setError(null);
      setRecordedAudioUrl(null);
      
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
      setLocalPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(selected);
      });
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
      let url;
      try {
        // 1. Upload file directly to Firebase Storage
        const storageRef = ref(storage, `uploads/${Date.now()}-${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        url = await getDownloadURL(snapshot.ref);
      } catch (storageErr) {
        console.warn('Failed to upload to Firebase Storage, trying local upload API fallback:', storageErr);
        // Local upload API fallback
        const formData = new FormData();
        formData.append('file', file);

        const uploadRes = await fetch('/api/celebrations/upload', {
          method: 'POST',
          body: formData
        });
        if (!uploadRes.ok) {
          const uploadErr = await uploadRes.json();
          throw new Error(uploadErr.error || 'Failed to upload file to local network storage.');
        }
        const uploadData = await uploadRes.json();
        url = uploadData.url;
      }

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

      let newCeleb;
      try {
        const docRef = await addDoc(collection(db, 'celebrations'), celebData);
        newCeleb = { id: docRef.id, ...celebData };
      } catch (firestoreErr) {
        console.warn('Failed to add celebration to Firestore, trying local API fallback:', firestoreErr);
        const res = await fetch('/api/celebrations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(celebData)
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to submit celebration to local network.');
        }
        const data = await res.json();
        newCeleb = data.celebration;
      }
      
      trackEvent('upload', 'success', activeTab);
      onUploadSuccess(newCeleb);
      setUploadedCeleb(newCeleb);
    } catch (err: any) {
      trackEvent('upload', 'failure', activeTab, 1, { error: err.message || 'Unknown' });
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
        {!uploadedCeleb && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}

        {uploadedCeleb ? (
          <div className="text-center py-6 space-y-6">
            {/* Toast Alert */}
            <AnimatePresence>
              {showShareToast && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute top-16 left-4 right-4 z-[110] py-2.5 px-4 rounded-xl bg-cyan-500/20 border border-cyan-500/35 text-center text-xs font-bold text-cyan-200 shadow-lg"
                >
                  📋 Link copied to clipboard!
                </motion.div>
              )}
            </AnimatePresence>

            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-3xl mx-auto shadow-[0_0_30px_rgba(16,185,129,0.2)]">
              🎉
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Celebration Uploaded!</h2>
              <p className="text-xs text-white/50 px-6 leading-relaxed">
                Your live {uploadedCeleb.type} reaction has been pinned to {uploadedCeleb.country} on the global map.
              </p>
            </div>
            
            <div className="flex flex-col gap-2 pt-4">
              <button
                onClick={handleShareReaction}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-sm tracking-wider cursor-pointer hover:scale-[1.02] transition-all flex items-center justify-center gap-1.5"
              >
                📤 Share Reaction Link
              </button>
              <button
                type="button"
                onClick={() => {
                  setUploadedCeleb(null);
                  resetMedia();
                  onClose();
                }}
                className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 font-bold text-sm tracking-wider cursor-pointer transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">Upload Reaction</h2>
            <p className="text-xs text-white/40 mb-5">Share your real-time emotions on the World Cup Globe.</p>

        {/* Tab Buttons */}
        <div className="flex border-b border-white/5 mb-5">
          {(['video', 'image', 'audio'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                stopAllStreams();
                setActiveTab(tab);
                setFile(null);
                setError(null);
                setRecordedAudioUrl(null);
                setLocalPreviewUrl((prev) => {
                  if (prev) URL.revokeObjectURL(prev);
                  return null;
                });
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
                            duration: 0.6 + ((i * 13) % 10) * 0.04,
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
            ) : file && localPreviewUrl ? (
              <div className="w-full flex flex-col items-center gap-3">
                <div className="relative w-full max-h-[220px] rounded-xl overflow-hidden bg-black/40 border border-white/10 flex items-center justify-center">
                  {activeTab === 'video' ? (
                    <video src={localPreviewUrl} controls className="w-full max-h-[220px]" />
                  ) : (
                    <img src={localPreviewUrl} alt="Captured preview" className="w-full max-h-[220px] object-contain" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={resetMedia}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center justify-center gap-1 cursor-pointer font-semibold"
                >
                  🗑️ Retake / Choose Different
                </button>
              </div>
            ) : cameraActive ? (
              <div className="w-full flex flex-col items-center gap-3">
                <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black/60 border border-cyan-500/30 shadow-[0_0_20px_rgba(0,229,255,0.1)]">
                  <video
                    ref={videoRefCallback}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform scale-x-[-1]"
                  />
                  {recordingVideo && (
                    <div className="absolute top-3 left-3 bg-red-600/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 animate-pulse shadow-md">
                      <span className="w-2 h-2 bg-white rounded-full animate-ping" />
                      <span>REC {formatDuration(recordingDuration)}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 w-full">
                  {activeTab === 'video' ? (
                    recordingVideo ? (
                      <button
                        type="button"
                        onClick={stopVideoRecording}
                        className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        ⏹️ Stop Recording
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={startVideoRecording}
                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold text-xs hover:shadow-lg hover:shadow-red-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        ⏺️ Start Recording
                      </button>
                    )
                  ) : (
                    <button
                      type="button"
                      onClick={takePhoto}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs hover:shadow-lg hover:shadow-cyan-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      📸 Take Photo
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={stopAllStreams}
                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full flex flex-col gap-4 py-2">
                <div className="grid grid-cols-2 gap-3 w-full">
                  {/* Option A: Capture Live */}
                  <button
                    type="button"
                    onClick={() => startCamera(activeTab === 'video')}
                    className="flex flex-col items-center justify-center p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 hover:border-cyan-400/50 hover:bg-cyan-500/15 group transition-all duration-300 cursor-pointer shadow-[0_4px_15px_rgba(0,0,0,0.2)]"
                  >
                    <div className="w-10 h-10 rounded-full bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center text-lg mb-2 group-hover:scale-110 transition-transform">
                      {activeTab === 'video' ? '🎥' : '📸'}
                    </div>
                    <span className="text-xs font-bold text-cyan-400 group-hover:text-cyan-300 transition-colors">Capture Live</span>
                    <span className="text-[9px] text-white/40 mt-1 leading-tight">Use device camera</span>
                  </button>

                  {/* Option B: Choose File */}
                  <div className="relative">
                    <input
                      type="file"
                      id="media-file-input"
                      accept={activeTab === 'video' ? 'video/*' : 'image/*'}
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="media-file-input"
                      className="flex flex-col items-center justify-center p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 group transition-all duration-300 cursor-pointer h-full text-center"
                    >
                      <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-lg mb-2 group-hover:scale-110 transition-transform">
                        📤
                      </div>
                      <span className="text-xs font-bold text-white/70 group-hover:text-white transition-colors">Choose File</span>
                      <span className="text-[9px] text-white/40 mt-1 leading-tight">Up to 25MB</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Select Match (Searchable) */}
          <div className="relative">
            <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-1">
              Attach to Match
            </label>
            <div className="relative">
              <input
                type="text"
                value={matchSearch}
                onFocus={() => setIsMatchDropdownOpen(true)}
                onChange={(e) => {
                  setMatchSearch(e.target.value);
                  setIsMatchDropdownOpen(true);
                }}
                placeholder="Search match (e.g. Argentina, Mexico...)"
                className="w-full px-4 py-2.5 pr-10 rounded-xl bg-neutral-900 border border-white/10 text-white focus:border-cyan-500 focus:outline-none transition-colors text-sm"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                {matchSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setMatchSearch('');
                      setSelectedMatch('');
                      setIsMatchDropdownOpen(true);
                    }}
                    className="text-white/40 hover:text-white/70 transition-colors p-0.5 text-xs font-bold"
                  >
                    ✕
                  </button>
                )}
                <span className="text-white/30 text-xs">🔍</span>
              </div>
            </div>

            {/* Match Dropdown List */}
            <AnimatePresence>
              {isMatchDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsMatchDropdownOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute left-0 right-0 mt-1.5 max-h-[180px] overflow-y-auto rounded-xl bg-neutral-950 border border-white/10 shadow-2xl z-50 divide-y divide-white/5 scrollbar-thin scrollbar-thumb-white/10"
                    style={{
                      background: 'rgba(15, 15, 25, 0.98)',
                      backdropFilter: 'blur(12px)'
                    }}
                  >
                    {filteredDisplayMatches.length > 0 ? (
                      filteredDisplayMatches.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => handleSelectMatchOption(m.title)}
                          className={`w-full px-4 py-2.5 text-left text-xs transition-colors hover:bg-white/10 flex items-center justify-between ${
                            selectedMatch === m.title ? 'text-cyan-400 font-bold bg-cyan-500/5' : 'text-white/80'
                          }`}
                        >
                          <span className="truncate pr-2">{m.title}</span>
                          {selectedMatch === m.title && <span className="text-cyan-400">✓</span>}
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-center text-xs text-white/40">
                        No matches found.
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => handleSelectMatchOption('Global Fan Celebration')}
                      className={`w-full px-4 py-2.5 text-left text-xs transition-colors hover:bg-white/10 flex items-center justify-between ${
                        selectedMatch === 'Global Fan Celebration' ? 'text-cyan-400 font-bold bg-cyan-500/5' : 'text-white/80'
                      }`}
                    >
                      <span>🌍 Global Fan Celebration</span>
                      {selectedMatch === 'Global Fan Celebration' && <span className="text-cyan-400">✓</span>}
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
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
            disabled={uploading || isRecording || cameraActive || recordingVideo || !file}
            className={`w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-sm tracking-wide shadow-lg transition-all duration-300 flex items-center justify-center gap-2 ${
              uploading || isRecording || cameraActive || recordingVideo || !file
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:shadow-cyan-500/35 cursor-pointer active:scale-98'
            }`}
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 rounded-full border border-white/20 border-t-white animate-spin" />
                UPLOADING TO LIVE NETWORK...
              </>
            ) : !file ? (
              'CHOOSE OR CAPTURE MEDIA FIRST'
            ) : (
              'UPLOAD CELEBRATION'
            )}
          </button>
        </form>
          </>
        )}
      </motion.div>
    </div>
  );
}
