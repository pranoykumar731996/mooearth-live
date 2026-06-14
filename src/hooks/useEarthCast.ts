/* eslint-disable react-hooks/set-state-in-effect, @typescript-eslint/no-explicit-any */
// ============================================================
// MooEarth Live — useEarthCast Hook
// Central orchestrator for the cinematic AI narration system.
// Detects events, generates narration, plays audio, manages
// auto-mode, and exposes state for UI components.
// ============================================================

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { WorldEvent } from '@/types';
import { EarthCastEventType, EarthCastContext } from '@/services/earthcast-ai';
import { TrendingCountry } from '@/hooks/useEmotionMap';

export type NarrationState = 'idle' | 'loading' | 'speaking' | 'cooldown';

export interface NarrationEntry {
  id: string;
  text: string;
  eventType: EarthCastEventType;
  country: string;
  emotionColor: string;
  intensity: number;
  timestamp: string;
}

interface UseEarthCastProps {
  events: WorldEvent[];
  celebrations: any[];
  trendingCountries: TrendingCountry[];
  globalEnergyScore: number;
  isMuted: boolean;
  onFlyToCountry?: (country: string) => void;
  playNarrationIntro?: () => void;
  playDeepPulse?: () => void;
  playTensionDrone?: () => void;
}

const COOLDOWN_MS = 30000; // 30 seconds between narrations
// const AUTO_INTERVAL_MS = 25000;
const MAX_HISTORY = 10;

// Detect event type from a football event
function detectEventType(event: WorldEvent, prevEvents: Map<string, WorldEvent>): EarthCastEventType | null {
  if (!event.footballData) return null;
  const prev = prevEvents.get(event.id);
  const fd = event.footballData;
  const pfd = prev?.footballData;

  // New goal detected
  if (fd.goals && fd.goals.length > 0) {
    if (!pfd?.goals || fd.goals.length > pfd.goals.length) {
      return 'goal';
    }
  }

  // New red card
  if (fd.cards) {
    const redCards = fd.cards.filter(c => c.type === 'Red');
    const prevRedCards = pfd?.cards?.filter(c => c.type === 'Red') || [];
    if (redCards.length > prevRedCards.length) {
      return 'red_card';
    }
  }

  // Penalty shootout
  if (fd.status === 'PEN' && pfd?.status !== 'PEN') {
    return 'penalty';
  }

  // Match just ended
  if (fd.status === 'FT' && pfd?.status !== 'FT') {
    return 'match_end';
  }

  // High tension (late minutes, close game)
  if (fd.elapsed >= 85 && fd.status === 'LIVE') {
    const scoreDiff = Math.abs(fd.homeScore - fd.awayScore);
    if (scoreDiff <= 1 && !prev) {
      return 'tension';
    }
  }

  return null;
}

// Build context for narration
function buildContext(
  event: WorldEvent,
  eventType: EarthCastEventType,
  globalEnergyScore: number,
  uploadCount: number,
  trendingMood: string
): EarthCastContext {
  const fd = event.footballData!;
  const lastGoal = fd.goals?.[fd.goals.length - 1];
  const scoringTeam = lastGoal?.team === 'home' ? fd.homeTeam : fd.awayTeam;
  const opponentTeam = lastGoal?.team === 'home' ? fd.awayTeam : fd.homeTeam;

  // Detect upset (simplified: if one team has significantly more goals)
  const isUpset = eventType === 'match_end' && fd.homeScore !== fd.awayScore;

  return {
    eventType,
    country: scoringTeam || fd.homeTeam,
    playerName: lastGoal?.player,
    team: scoringTeam,
    opponentTeam,
    score: `${fd.homeTeam} ${fd.homeScore} - ${fd.awayScore} ${fd.awayTeam}`,
    elapsed: fd.elapsed,
    globalEnergyScore,
    uploadCount,
    trendingMood,
    isUpset,
  };
}

export function useEarthCast({
  events,
  celebrations,
  trendingCountries,
  globalEnergyScore,
  isMuted,
  onFlyToCountry,
  playNarrationIntro,
  playTensionDrone,
}: UseEarthCastProps) {
  // Core state
  const [isEarthCastActive, setIsEarthCastActive] = useState(false);
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [narrationState, setNarrationState] = useState<NarrationState>('idle');
  const [currentNarration, setCurrentNarration] = useState<NarrationEntry | null>(null);
  const [narrationHistory, setNarrationHistory] = useState<NarrationEntry[]>([]);
  const [activeCountry, setActiveCountry] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [aiStats, setAiStats] = useState<any | null>(null);

  // Refs for tracking
  const processedEventIds = useRef<Set<string>>(new Set());
  const previousEvents = useRef<Map<string, WorldEvent>>(new Map());
  const cooldownTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoModeTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastNarrationTime = useRef<number>(0);
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Toggle EarthCast on/off
  const toggleEarthCast = useCallback(() => {
    setIsEarthCastActive(prev => !prev);
  }, []);

  // Toggle auto mode
  const toggleAutoMode = useCallback(() => {
    setIsAutoMode(prev => !prev);
  }, []);

  // Stop any playing audio
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    if (speechSynthRef.current && typeof window !== 'undefined') {
      window.speechSynthesis?.cancel();
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  // Audio level monitoring loop (for waveform visualization)
  const startAudioLevelMonitor = useCallback(() => {
    if (!analyserRef.current) return;
    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      analyser.getByteFrequencyData(dataArray);
      // Average of lower frequencies for a smooth level
      let sum = 0;
      const count = Math.min(32, dataArray.length);
      for (let i = 0; i < count; i++) {
        sum += dataArray[i];
      }
      setAudioLevel(sum / (count * 255));
      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
  }, []);

  // Play TTS audio (base64 MP3)
  const playTTSAudio = useCallback((audioBase64: string): Promise<void> => {
    return new Promise((resolve) => {
      try {
        const audioData = Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0));
        const blob = new Blob([audioData], { type: 'audio/mp3' });
        const url = URL.createObjectURL(blob);

        const audio = new Audio(url);
        audio.volume = isMuted ? 0 : 0.85;
        audioRef.current = audio;

        // Set up AnalyserNode for waveform visualization
        try {
          if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
          }
          const ctx = audioContextRef.current;
          if (ctx.state === 'suspended') ctx.resume();

          const source = ctx.createMediaElementSource(audio);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 128;
          analyser.smoothingTimeConstant = 0.8;

          source.connect(analyser);
          analyser.connect(ctx.destination);
          analyserRef.current = analyser;
        } catch (audioCtxError) {
          // AnalyserNode setup failed — audio still plays, just no waveform
          console.warn('Audio analyser setup failed:', audioCtxError);
        }

        audio.onended = () => {
          URL.revokeObjectURL(url);
          setAudioLevel(0);
          if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
          resolve();
        };

        audio.onerror = () => {
          URL.revokeObjectURL(url);
          setAudioLevel(0);
          resolve();
        };

        audio.play().then(() => {
          startAudioLevelMonitor();
        }).catch(() => {
          // Autoplay blocked — fall back to speech synthesis
          URL.revokeObjectURL(url);
          resolve();
        });
      } catch {
        resolve();
      }
    });
  }, [isMuted, startAudioLevelMonitor]);

  // Helper to map country names to primary spoken language codes
  const getCountryLanguageCode = (countryName?: string): string => {
    if (!countryName) return 'en';
    const c = countryName.toLowerCase();
    if (c.includes('brazil') || c.includes('portugal') || c.includes('angola')) return 'pt';
    if (
      c.includes('spain') ||
      c.includes('mexico') ||
      c.includes('argentina') ||
      c.includes('colombia') ||
      c.includes('chile') ||
      c.includes('uruguay') ||
      c.includes('paraguay') ||
      c.includes('ecuador') ||
      c.includes('honduras') ||
      c.includes('costa rica') ||
      c.includes('panama')
    ) return 'es';
    if (
      c.includes('france') ||
      c.includes('belgium') ||
      c.includes('senegal') ||
      c.includes('cameroon') ||
      c.includes('ivory coast') ||
      c.includes('haiti')
    ) return 'fr';
    if (c.includes('germany') || c.includes('austria') || c.includes('switzerland')) return 'de';
    if (c.includes('italy')) return 'it';
    if (c.includes('japan')) return 'ja';
    if (c.includes('south korea') || c.includes('korea')) return 'ko';
    return 'en';
  };

  // Fallback: browser speech synthesis
  const playSpeechSynthesis = useCallback((text: string, eventType?: string, intensity?: number, country?: string): Promise<void> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !window.speechSynthesis || isMuted) {
        resolve();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Commentary styling: Dynamic pitch & rate based on event type and intensity
      if (eventType === 'goal' || eventType === 'penalty' || eventType === 'upset' || (intensity && intensity > 0.8)) {
        utterance.rate = 1.15;  // Fast, exciting sports commentator pace
        utterance.pitch = 1.1;  // Higher excitement pitch
      } else if (eventType === 'red_card' || eventType === 'tension') {
        utterance.rate = 0.98;  // Dramatically measured pace
        utterance.pitch = 0.95; // Deep, tense pitch
      } else {
        utterance.rate = 1.05;  // Conversational commentary pace
        utterance.pitch = 1.0;  // Standard pitch
      }
      
      utterance.volume = 1.0;

      // Select voice based on country accent language
      const targetLang = getCountryLanguageCode(country);
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v => 
        v.lang.startsWith(targetLang) && 
        (v.name.toLowerCase().includes('natural') || v.name.toLowerCase().includes('neural'))
      ) || voices.find(v =>
        v.lang.startsWith(targetLang) && 
        v.name.toLowerCase().includes('google')
      ) || voices.find(v =>
        v.lang.startsWith(targetLang)
      ) || voices.find(v => 
        v.lang.startsWith('en') && 
        (v.name.toLowerCase().includes('natural') || v.name.toLowerCase().includes('neural'))
      ) || voices.find(v =>
        v.lang.startsWith('en') && 
        v.name.toLowerCase().includes('google')
      ) || voices.find(v => v.lang.startsWith('en'));

      if (preferred) utterance.voice = preferred;

      speechSynthRef.current = utterance;

      // Simulate audio level for waveform vis
      let simInterval: ReturnType<typeof setInterval> | null = null;
      utterance.onstart = () => {
        simInterval = setInterval(() => {
          setAudioLevel(0.3 + Math.random() * 0.4);
        }, 100);
      };

      utterance.onend = () => {
        if (simInterval) clearInterval(simInterval);
        setAudioLevel(0);
        resolve();
      };

      utterance.onerror = () => {
        if (simInterval) clearInterval(simInterval);
        setAudioLevel(0);
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  }, [isMuted]);

  // Core narration pipeline
  const triggerNarration = useCallback(async (context: EarthCastContext) => {
    // Check cooldown
    const now = Date.now();
    if (now - lastNarrationTime.current < COOLDOWN_MS) return;
    if (narrationState !== 'idle') return;

    lastNarrationTime.current = now;
    setNarrationState('loading');

    // Play intro sound or tension drone based on event type
    if (!isMuted) {
      if ((context.eventType === 'penalty' || context.eventType === 'tension' || context.eventType === 'red_card') && playTensionDrone) {
        playTensionDrone();
      } else if (playNarrationIntro) {
        playNarrationIntro();
      }
    }

    // Fly camera to the country
    setActiveCountry(context.country);
    if (onFlyToCountry) onFlyToCountry(context.country);

    try {
      // Call the API
      const response = await fetch('/api/earthcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context }),
      });

      if (!response.ok) throw new Error(`API returned ${response.status}`);

      const data = await response.json();
      const narration = data.narration;

      if (data.stats) {
        setAiStats(data.stats);
      }

      const entry: NarrationEntry = {
        id: `ec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        text: narration.text,
        eventType: narration.eventType,
        country: narration.country,
        emotionColor: narration.emotionColor,
        intensity: narration.intensity,
        timestamp: narration.timestamp,
      };

      setCurrentNarration(entry);
      setNarrationState('speaking');

      // Add to history
      setNarrationHistory(prev => [entry, ...prev].slice(0, MAX_HISTORY));

      // Play audio
      if (narration.audioBase64 && !isMuted) {
        await playTTSAudio(narration.audioBase64);
      } else if (!isMuted) {
        await playSpeechSynthesis(narration.text, narration.eventType, narration.intensity, narration.country);
      } else {
        // Muted: just show text for ~6 seconds
        await new Promise<void>(resolve => setTimeout(resolve, 6000));
      }

      // Narration complete → cooldown
      setNarrationState('cooldown');
      setCurrentNarration(null);
      setActiveCountry(null);

      cooldownTimer.current = setTimeout(() => {
        setNarrationState('idle');
      }, 5000); // 5s visual cooldown indicator

    } catch (error) {
      console.error('EarthCast narration failed:', error);
      setNarrationState('idle');
      setCurrentNarration(null);
      setActiveCountry(null);
    }
  }, [narrationState, isMuted, playNarrationIntro, onFlyToCountry, playTTSAudio, playSpeechSynthesis]);

  // ============================================================
  // EVENT DETECTION — Watch for new goals, cards, match endings
  // ============================================================
  useEffect(() => {
    if (!isEarthCastActive || narrationState !== 'idle') return;

    const footballEvents = events.filter(e => e.category === 'football' && e.footballData);

    for (const event of footballEvents) {
      const eventType = detectEventType(event, previousEvents.current);

      if (eventType) {
        const eventKey = `${event.id}-${eventType}-${event.footballData?.homeScore}-${event.footballData?.awayScore}`;
        if (processedEventIds.current.has(eventKey)) continue;
        processedEventIds.current.add(eventKey);

        const trendingMood = trendingCountries[0]?.mood || 'electric';
        const context = buildContext(
          event,
          eventType,
          globalEnergyScore,
          celebrations.length,
          trendingMood
        );

        triggerNarration(context);
        break; // Only one narration per cycle
      }
    }

    // Update previous events snapshot
    const newMap = new Map<string, WorldEvent>();
    footballEvents.forEach(e => newMap.set(e.id, e));
    previousEvents.current = newMap;

  }, [events, isEarthCastActive, narrationState, celebrations.length, globalEnergyScore, trendingCountries, triggerNarration]);

  // ============================================================
  // AUTO MODE — Periodic atmospheric narrations (Disabled in production launch)
  // ============================================================
  useEffect(() => {
    // Disabled: EarthCast narration should ONLY trigger from real live match events.
    return;
  }, []);

  // Manual narration trigger for a selected match
  const narrateMatch = useCallback((event: WorldEvent) => {
    if (!isEarthCastActive) return;
    if (!event.footballData) return;
    
    const fd = event.footballData;
    let eventType: EarthCastEventType = 'tension';
    
    if (fd.status === 'FT') {
      eventType = 'match_end';
    } else if (fd.status === 'LIVE') {
      eventType = fd.goals && fd.goals.length > 0 ? 'goal' : 'tension';
    } else if (fd.status === 'NS') {
      eventType = 'tension';
    }
    
    const trendingMood = trendingCountries[0]?.mood || 'electric';
    const context = buildContext(
      event,
      eventType,
      globalEnergyScore,
      celebrations.length,
      trendingMood
    );
    
    // Bypass cooldown for manual click interaction
    lastNarrationTime.current = 0;
    triggerNarration(context);
  }, [isEarthCastActive, trendingCountries, globalEnergyScore, celebrations.length, triggerNarration]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAudio();
      if (cooldownTimer.current) clearTimeout(cooldownTimer.current);
      if (autoModeTimer.current) clearInterval(autoModeTimer.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [stopAudio]);

  // Stop audio if EarthCast is deactivated
  useEffect(() => {
    if (!isEarthCastActive) {
      stopAudio();
      setNarrationState('idle');
      setCurrentNarration(null);
      setActiveCountry(null);
      setIsAutoMode(false);
    }
  }, [isEarthCastActive, stopAudio]);

  // Fetch initial AI statistics from the server when EarthCast is enabled
  useEffect(() => {
    if (!isEarthCastActive) return;
    
    fetch('/api/earthcast')
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setAiStats(data);
        }
      })
      .catch(err => console.warn('Failed to fetch initial AI stats:', err));
  }, [isEarthCastActive]);

  return {
    isEarthCastActive,
    isAutoMode,
    narrationState,
    currentNarration,
    narrationHistory,
    activeCountry,
    audioLevel,
    aiStats,
    toggleEarthCast,
    toggleAutoMode,
    stopAudio,
    narrateMatch,
  };
}
