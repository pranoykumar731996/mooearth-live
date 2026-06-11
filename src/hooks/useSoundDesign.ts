// ============================================================
// MooEarth Live — Procedural Sound Design (Web Audio API)
// Premium, cinematic sound effects and background ambience.
// ============================================================

'use client';

import { useEffect, useRef, useCallback } from 'react';

export function useSoundDesign(isMuted: boolean = true) {
  const audioCtx = useRef<AudioContext | null>(null);
  const droneNode = useRef<{
    osc1: OscillatorNode;
    osc2: OscillatorNode;
    lfo: OscillatorNode;
    gainNode: GainNode;
    filter: BiquadFilterNode;
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

  // Manage mute state transitions
  useEffect(() => {
    if (isMuted) {
      stopDrone();
      if (audioCtx.current && audioCtx.current.state === 'running') {
        audioCtx.current.suspend();
      }
    } else {
      const ctx = getAudioContext();
      if (ctx) {
        ctx.resume().then(() => {
          startDrone();
        });
      }
    }
  }, [isMuted, startDrone, stopDrone]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopDrone();
      if (audioCtx.current && audioCtx.current.state !== 'closed') {
        audioCtx.current.close();
      }
    };
  }, [stopDrone]);

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

  return {
    playHoverBlip,
    playDeepPulse,
    playUploadSuccess,
    playCrowdCheer,
    playGoalCelebration,
    playNarrationIntro,
    playTensionDrone,
  };
}
