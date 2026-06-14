// ============================================================
// MooEarth Live — Procedural Sound Design (Web Audio API)
// Premium, cinematic sound effects and background ambience.
// ============================================================

'use client';

import { useEffect, useRef, useCallback } from 'react';

export function useSoundDesign(isMuted: boolean = true, globalEnergyScore: number = 30) {
  const audioCtx = useRef<AudioContext | null>(null);
  const droneNode = useRef<{
    osc1: OscillatorNode;
    osc2: OscillatorNode;
    lfo: OscillatorNode;
    gainNode: GainNode;
    filter: BiquadFilterNode;
  } | null>(null);

  const stadiumNode = useRef<{
    noiseSource: AudioBufferSourceNode;
    bandpassFilter: BiquadFilterNode;
    lowpassFilter: BiquadFilterNode;
    gainNode: GainNode;
    drumInterval?: ReturnType<typeof setInterval>;
  } | null>(null);

  // Initialize Audio Context on demand
  const getAudioContext = (): AudioContext | null => {
    if (typeof window === 'undefined') return null;
    if (!audioCtx.current) {
      audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioCtx.current;
  };

  // Start space drone loop: Phase 7 Space Atmosphere
  const startDrone = useCallback(() => {
    const ctx = getAudioContext();
    if (!ctx || isMuted) return;

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    if (droneNode.current) return; // Already running

    try {
      const now = ctx.currentTime;

      // 1. Two low-frequency detuned oscillators
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      osc1.type = 'triangle';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(60, now);  // Low B
      osc2.frequency.setValueAtTime(60.5, now); // Detuned to create slow acoustic beating

      // 2. High-cut resonant filter
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(120, now);
      filter.Q.setValueAtTime(1.0, now);

      // 3. LFO to modulate filter cutoff (simulates "breathing" space atmosphere)
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(0.08, now); // Very slow cycle (12 seconds)
      lfoGain.gain.setValueAtTime(40, now);    // Modulates cutoff by +/-40Hz

      // 4. Main drone volume node
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.12, now + 3); // Smooth fade-in over 3 seconds

      // Connect nodes
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency); // Modulates filter cutoff directly!

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Start oscillators
      lfo.start(now);
      osc1.start(now);
      osc2.start(now);

      droneNode.current = { osc1, osc2, lfo, gainNode, filter };
    } catch (e) {
      console.warn('Failed to start audio synthesizer drone:', e);
    }
  }, [isMuted]);

  // Stop space drone loop
  const stopDrone = useCallback(() => {
    if (!droneNode.current) return;

    const ctx = audioCtx.current;
    const node = droneNode.current;
    
    if (ctx && node) {
      const now = ctx.currentTime;
      try {
        node.gainNode.gain.cancelScheduledValues(now);
        node.gainNode.gain.setValueAtTime(node.gainNode.gain.value, now);
        node.gainNode.gain.linearRampToValueAtTime(0, now + 0.5); // Quick fade-out

        setTimeout(() => {
          try {
            node.osc1.stop();
            node.osc2.stop();
            node.lfo.stop();
            node.osc1.disconnect();
            node.osc2.disconnect();
            node.lfo.disconnect();
            node.filter.disconnect();
            node.gainNode.disconnect();
          } catch (err) {}
        }, 600);
      } catch (err) {}
    }
    droneNode.current = null;
  }, []);

  // Modulate stadium crowd ambient noise and rhythmic drum beats based on energy score
  const updateStadiumEnergy = useCallback((energy: number) => {
    const node = stadiumNode.current;
    const ctx = audioCtx.current;
    if (!node || !ctx) return;

    const now = ctx.currentTime;
    const normalizedEnergy = Math.min(Math.max(energy / 100, 0), 1); // 0.0 to 1.0

    // Volume curves: very quiet (0.005) at low energy, noticeable (0.07) at high energy
    const targetVolume = 0.005 + normalizedEnergy * 0.065;
    node.gainNode.gain.cancelScheduledValues(now);
    node.gainNode.gain.linearRampToValueAtTime(targetVolume, now + 1.0); // 1s smooth ramp

    // Filter frequencies: expand frequency spectrum to sound brighter/more energetic
    const targetBandpass = 1000 + normalizedEnergy * 350; // 1000Hz to 1350Hz
    const targetLowpass = 700 + normalizedEnergy * 450;   // 700Hz to 1150Hz
    
    node.bandpassFilter.frequency.cancelScheduledValues(now);
    node.bandpassFilter.frequency.linearRampToValueAtTime(targetBandpass, now + 1.0);
    
    node.lowpassFilter.frequency.cancelScheduledValues(now);
    node.lowpassFilter.frequency.linearRampToValueAtTime(targetLowpass, now + 1.0);

    // Rhythmic Clapping Drums Synthesizer for high energy (>70%)
    if (energy >= 70) {
      if (!node.drumInterval) {
        // Start rhythmic stadium drums: "Boom, Boom, Clap" pattern
        let beat = 0;
        node.drumInterval = setInterval(() => {
          const innerCtx = audioCtx.current;
          if (!innerCtx || isMuted || innerCtx.state !== 'running') return;
          
          const t = innerCtx.currentTime;
          try {
            if (beat === 0 || beat === 1) {
              // "Boom" — Detuned Low Sub Bass Beat (60Hz)
              const osc = innerCtx.createOscillator();
              const oscGain = innerCtx.createGain();
              osc.type = 'sine';
              osc.frequency.setValueAtTime(60, t);
              osc.frequency.exponentialRampToValueAtTime(30, t + 0.15);
              oscGain.gain.setValueAtTime(0.12, t);
              oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
              osc.connect(oscGain);
              oscGain.connect(innerCtx.destination);
              osc.start(t);
              osc.stop(t + 0.15);
            } else if (beat === 2) {
              // "Clap" — Filtered Crowd noise burst (1200Hz)
              const osc = innerCtx.createOscillator();
              const oscGain = innerCtx.createGain();
              osc.type = 'triangle';
              osc.frequency.setValueAtTime(1000, t);
              osc.frequency.exponentialRampToValueAtTime(300, t + 0.12);
              oscGain.gain.setValueAtTime(0.07, t);
              oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
              osc.connect(oscGain);
              oscGain.connect(innerCtx.destination);
              osc.start(t);
              osc.stop(t + 0.12);
            }
            beat = (beat + 1) % 4; // 4-beat cycle
          } catch (err) {}
        }, 500); // 120 bpm (500ms per beat)
      }
    } else {
      if (node.drumInterval) {
        clearInterval(node.drumInterval);
        delete node.drumInterval;
      }
    }
  }, [isMuted]);

  // Start continuous stadium crowd ambience loop
  const startStadiumAmbient = useCallback(() => {
    const ctx = getAudioContext();
    if (!ctx || isMuted) return;

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    if (stadiumNode.current) return; // Already running

    try {
      const now = ctx.currentTime;

      // Generate White Noise Buffer
      const bufferSize = ctx.sampleRate * 2; // 2 seconds loop
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = buffer;
      noiseSource.loop = true;

      // Bandpass filter centered around crowd shouting frequencies (1100Hz)
      const bandpassFilter = ctx.createBiquadFilter();
      bandpassFilter.type = 'bandpass';
      bandpassFilter.frequency.setValueAtTime(1100, now);
      bandpassFilter.Q.setValueAtTime(0.7, now);

      // Lowpass filter to smooth the noise (simulating distance and crowd rumble)
      const lowpassFilter = ctx.createBiquadFilter();
      lowpassFilter.type = 'lowpass';
      lowpassFilter.frequency.setValueAtTime(800, now);

      // Main stadium volume node
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0, now);

      // Connect nodes
      noiseSource.connect(bandpassFilter);
      bandpassFilter.connect(lowpassFilter);
      lowpassFilter.connect(gainNode);
      gainNode.connect(ctx.destination);

      noiseSource.start(now);

      stadiumNode.current = {
        noiseSource,
        bandpassFilter,
        lowpassFilter,
        gainNode,
      };

      // Set initial values based on current energy
      updateStadiumEnergy(globalEnergyScore);

    } catch (e) {
      console.warn('Failed to start stadium ambience synth:', e);
    }
  }, [isMuted, globalEnergyScore, updateStadiumEnergy]);

  // Stop stadium crowd ambient loop
  const stopStadiumAmbient = useCallback(() => {
    if (!stadiumNode.current) return;

    const ctx = audioCtx.current;
    const node = stadiumNode.current;

    if (node.drumInterval) {
      clearInterval(node.drumInterval);
    }

    if (ctx && node) {
      const now = ctx.currentTime;
      try {
        node.gainNode.gain.cancelScheduledValues(now);
        node.gainNode.gain.setValueAtTime(node.gainNode.gain.value, now);
        node.gainNode.gain.linearRampToValueAtTime(0, now + 0.5); // Quick fade-out

        setTimeout(() => {
          try {
            node.noiseSource.stop();
            node.noiseSource.disconnect();
            node.bandpassFilter.disconnect();
            node.lowpassFilter.disconnect();
            node.gainNode.disconnect();
          } catch (err) {}
        }, 600);
      } catch (err) {}
    }
    stadiumNode.current = null;
  }, []);

  // Manage mute state transitions
  useEffect(() => {
    if (isMuted) {
      stopDrone();
      stopStadiumAmbient();
      if (audioCtx.current && audioCtx.current.state === 'running') {
        audioCtx.current.suspend();
      }
    } else {
      const ctx = getAudioContext();
      if (ctx) {
        ctx.resume().then(() => {
          startDrone();
          startStadiumAmbient();
        });
      }
    }
  }, [isMuted, startDrone, stopDrone, startStadiumAmbient, stopStadiumAmbient]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopDrone();
      stopStadiumAmbient();
      if (audioCtx.current && audioCtx.current.state !== 'closed') {
        audioCtx.current.close();
      }
    };
  }, [stopDrone, stopStadiumAmbient]);

  // Update stadium sound profile when global energy score changes
  useEffect(() => {
    if (!isMuted && stadiumNode.current) {
      updateStadiumEnergy(globalEnergyScore);
    }
  }, [globalEnergyScore, isMuted, updateStadiumEnergy]);

  // Phase 7 Hover Sounds: short high-pitched Blips
  const playHoverBlip = useCallback(() => {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx || ctx.state !== 'running') return;
    
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1000, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.08);
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {}
  }, [isMuted]);

  // Phase 7 Cinematic Deep Bass Pulses
  const playDeepPulse = useCallback(() => {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx || ctx.state !== 'running') return;
    
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(90, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 1.2);
      
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(180, ctx.currentTime);
      filter.frequency.linearRampToValueAtTime(40, ctx.currentTime + 1.2);
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 1.2);
    } catch (e) {}
  }, [isMuted]);

  // Phase 7 Upload sweep sound
  const playUploadSuccess = useCallback(() => {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx || ctx.state !== 'running') return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.8);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(300, now);
      filter.frequency.exponentialRampToValueAtTime(1200, now + 0.8);
      filter.Q.setValueAtTime(4.0, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.8);
    } catch (e) {}
  }, [isMuted]);

  // Phase 7 Ambient Stadium cheering (filtered noise)
  const playCrowdCheer = useCallback(() => {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx || ctx.state !== 'running') return;

    try {
      const now = ctx.currentTime;
      const bufferSize = ctx.sampleRate * 2.5; // 2.5 seconds
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // Generate white noise
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = buffer;

      // Resonant bandpass filter centered around crowd shouting frequencies (800Hz - 2kHz)
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, now);
      filter.frequency.exponentialRampToValueAtTime(900, now + 2.0);
      filter.Q.setValueAtTime(0.6, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.4); // Stadium wave rises
      gain.gain.linearRampToValueAtTime(0.06, now + 1.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.5); // Fades away

      noiseSource.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noiseSource.start(now);
      noiseSource.stop(now + 2.5);
    } catch (e) {}
  }, [isMuted]);

  // Phase 7 Goal impact sound (Massive dual sub-bass rumble + crowd roar)
  const playGoalCelebration = useCallback(() => {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx || ctx.state !== 'running') return;

    try {
      const now = ctx.currentTime;

      // Layer 1: Sub-bass rumble
      const sub1 = ctx.createOscillator();
      const sub2 = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const subGain = ctx.createGain();

      sub1.type = 'sine';
      sub2.type = 'triangle';

      sub1.frequency.setValueAtTime(45, now);
      sub2.frequency.setValueAtTime(50, now);

      sub1.frequency.linearRampToValueAtTime(25, now + 2.2);
      sub2.frequency.linearRampToValueAtTime(25, now + 2.2);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(80, now);

      subGain.gain.setValueAtTime(0, now);
      subGain.gain.linearRampToValueAtTime(0.45, now + 0.06);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 2.2);

      sub1.connect(filter);
      sub2.connect(filter);
      filter.connect(subGain);
      subGain.connect(ctx.destination);

      sub1.start(now);
      sub2.start(now);
      sub1.stop(now + 2.2);
      sub2.stop(now + 2.2);

      // Layer 2: Stadium Wave cheering overlay
      playCrowdCheer();
      setTimeout(() => {
        if (!isMuted) playCrowdCheer();
      }, 800);
    } catch (e) {}
  }, [isMuted, playCrowdCheer]);

  // EarthCast: Cinematic narration intro sound (broadcast open chord)
  const playNarrationIntro = useCallback(() => {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx || ctx.state !== 'running') return;

    try {
      const now = ctx.currentTime;

      // Layer 1: Rising shimmer chord (C4 + E4 + G4 harmonics)
      const freqs = [261.6, 329.6, 392.0];
      freqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq * 0.5, now);
        osc.frequency.exponentialRampToValueAtTime(freq, now + 0.8);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, now);
        filter.frequency.exponentialRampToValueAtTime(2000, now + 1.0);
        filter.Q.setValueAtTime(2, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.06, now + 0.15 + i * 0.08);
        gain.gain.linearRampToValueAtTime(0.04, now + 0.8);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 1.5);
      });

      // Layer 2: Sub-bass impact
      const sub = ctx.createOscillator();
      const subGain = ctx.createGain();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(55, now);
      sub.frequency.exponentialRampToValueAtTime(30, now + 1.0);

      subGain.gain.setValueAtTime(0, now);
      subGain.gain.linearRampToValueAtTime(0.2, now + 0.04);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);

      sub.connect(subGain);
      subGain.connect(ctx.destination);
      sub.start(now);
      sub.stop(now + 1.0);
    } catch (e) {}
  }, [isMuted]);

  // EarthCast: Sustained tension drone (for penalty/dramatic moments)
  const playTensionDrone = useCallback(() => {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx || ctx.state !== 'running') return;

    try {
      const now = ctx.currentTime;

      // Low filtered noise bed
      const bufferSize = ctx.sampleRate * 4; // 4 seconds
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(100, now);
      filter.frequency.linearRampToValueAtTime(250, now + 2.0);
      filter.frequency.linearRampToValueAtTime(80, now + 4.0);
      filter.Q.setValueAtTime(3, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.06, now + 1.0);
      gain.gain.linearRampToValueAtTime(0.04, now + 3.0);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 4.0);

      // Subtle detuned oscillator layer
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(40, now);
      osc.frequency.linearRampToValueAtTime(38, now + 4.0);
      oscGain.gain.setValueAtTime(0, now);
      oscGain.gain.linearRampToValueAtTime(0.03, now + 1.5);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 4.0);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.connect(oscGain);
      oscGain.connect(ctx.destination);

      source.start(now);
      source.stop(now + 4.0);
      osc.start(now);
      osc.stop(now + 4.0);
    } catch (e) {}
  }, [isMuted]);

  // ====== PLAY EARTH: Quiz Game Sounds ======

  // Correct answer: bright upward arpeggio chime
  const playCorrectSound = useCallback(() => {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx || ctx.state !== 'running') return;

    try {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0, now + i * 0.08);
        gain.gain.linearRampToValueAtTime(0.12, now + i * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.35);
      });
    } catch (e) {}
  }, [isMuted]);

  // Wrong answer: descending dissonant buzz
  const playWrongSound = useCallback(() => {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx || ctx.state !== 'running') return;

    try {
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(220, now);
      osc1.frequency.exponentialRampToValueAtTime(110, now + 0.5);

      osc2.type = 'square';
      osc2.frequency.setValueAtTime(233, now); // Slightly detuned for dissonance
      osc2.frequency.exponentialRampToValueAtTime(105, now + 0.5);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.linearRampToValueAtTime(200, now + 0.5);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.5);
      osc2.start(now);
      osc2.stop(now + 0.5);
    } catch (e) {}
  }, [isMuted]);

  // Timer tick: short percussive beep (increases pitch as urgency rises)
  const playTimerTick = useCallback((urgency: number = 0) => {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx || ctx.state !== 'running') return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const baseFreq = 600 + urgency * 800; // 600Hz at low urgency, 1400Hz at max
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.06 + urgency * 0.04, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch (e) {}
  }, [isMuted]);

  // Level up: celebratory ascending fanfare
  const playLevelUp = useCallback(() => {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx || ctx.state !== 'running') return;

    try {
      const now = ctx.currentTime;
      const notes = [392, 523.25, 659.25, 783.99, 1046.5, 1318.5]; // G4 → E6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = i < 3 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        gain.gain.setValueAtTime(0, now + i * 0.1);
        gain.gain.linearRampToValueAtTime(0.1, now + i * 0.1 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.6);
      });
    } catch (e) {}
  }, [isMuted]);

  return {
    playHoverBlip,
    playDeepPulse,
    playUploadSuccess,
    playCrowdCheer,
    playGoalCelebration,
    playNarrationIntro,
    playTensionDrone,
    // Play Earth game sounds
    playCorrectSound,
    playWrongSound,
    playTimerTick,
    playLevelUp,
  };
}

