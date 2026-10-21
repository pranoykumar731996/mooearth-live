// ============================================================
// MooEarth Live — Stop the Earth: Full Game Client Component
// ============================================================
// Complete interactive geography guessing game featuring:
// 1. Landing Screen — Difficulty selector, game branding & rules
// 2. Country Picker — Searchable country selector with flags & regions
// 3. Persistent 2D Satellite Gameplay — Real-time high-resolution Esri
//    World Imagery with country borders, labels toggle & fit controls
// 4. Answer Reveal — Dual markers, animated distance line, scoring breakdown
// 5. Game Summary — Detailed metrics, streak record, round history & sharing
//
// All gameplay calculations are server-authoritative and verified.

'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import 'maplibre-gl/dist/maplibre-gl.css';
import { CANONICAL_COUNTRIES, CountryRecord } from '@/data/countries';
import type {
  SteDifficulty,
  SteGameMode,
  SteQuestionResponse,
  SteAnswerResponse,
  SteScoreBreakdown,
  SteRoundResult,
  SteSummaryResponse,
  CountryBounds,
} from '@/engines/game/stopTheEarth/types';
import {
  createSession,
  fetchQuestion,
  submitAnswer,
  getStoredPlayerId,
  saveBestScore,
  getBestScore,
} from '@/services/stopTheEarth/gameClient';
import GlobalFooter from '@/components/Layout/GlobalFooter';

// ---- Constants & Satellite Style ----

const DIFFICULTY_OPTIONS: { value: SteDifficulty; label: string; emoji: string; desc: string }[] = [
  { value: 'easy', label: 'Easy', emoji: '🟢', desc: '50km tolerance · 30s timer · 5 rounds' },
  { value: 'medium', label: 'Medium', emoji: '🟡', desc: '30km tolerance · 20s timer · 7 rounds' },
  { value: 'hard', label: 'Hard', emoji: '🔴', desc: '15km tolerance · 15s timer · 10 rounds' },
];

type GameScreen = 'landing' | 'country-select' | 'question' | 'answer-reveal' | 'summary';

/**
 * 2D Satellite Raster Map Style (Esri World Imagery + World Boundaries & Places)
 * 100% CORS-friendly, zero watermark, high-res global satellite coverage
 */
const SATELLITE_STYLE: any = {
  version: 8,
  sources: {
    'esri-satellite': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
      attribution:
        'Tiles &copy; Esri &mdash; Maxar, Earthstar Geographics, USDA, USGS',
    },
    'esri-labels': {
      type: 'raster',
      tiles: [
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      ],
      tileSize: 256,
    },
  },
  layers: [
    {
      id: 'esri-satellite-layer',
      type: 'raster',
      source: 'esri-satellite',
      minzoom: 0,
      maxzoom: 19,
    },
    {
      id: 'esri-labels-layer',
      type: 'raster',
      source: 'esri-labels',
      minzoom: 0,
      maxzoom: 19,
      layout: {
        visibility: 'visible',
      },
    },
  ],
};

function fitBoundsSafely(map: any, bounds: CountryBounds) {
  if (!map || !bounds) return;
  try {
    if (bounds.sw && bounds.ne) {
      map.fitBounds(
        [
          [bounds.sw.lng, bounds.sw.lat],
          [bounds.ne.lng, bounds.ne.lat],
        ],
        {
          padding: { top: 60, bottom: 60, left: 60, right: 60 },
          duration: 1000,
          maxZoom: 12,
        }
      );
    } else if (bounds.center) {
      map.flyTo({
        center: [bounds.center.lng, bounds.center.lat],
        zoom: bounds.zoom || 5,
        duration: 1000,
      });
    }
  } catch (err) {
    console.warn('fitBoundsSafely error:', err);
  }
}

// ---- Main Component ----

export default function StopTheEarthClient() {
  // Screen state
  const [screen, setScreen] = useState<GameScreen>('landing');
  const [difficulty, setDifficulty] = useState<SteDifficulty>('easy');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMapLoading, setIsMapLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Satellite map controls
  const [showLabels, setShowLabels] = useState(true);

  // Session state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<CountryRecord | null>(null);

  // Question state
  const [currentQuestion, setCurrentQuestion] = useState<SteQuestionResponse | null>(null);
  const [guessCoords, setGuessCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(30);
  const [timerActive, setTimerActive] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(0);

  // Answer state
  const [answerResult, setAnswerResult] = useState<(SteAnswerResponse & { summary?: SteSummaryResponse | null }) | null>(null);

  // Summary state
  const [gameSummary, setGameSummary] = useState<SteSummaryResponse | null>(null);

  // Map & Marker Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const guessMarkerRef = useRef<any>(null);
  const answerMarkerRef = useRef<any>(null);
  const screenRef = useRef<GameScreen>(screen);

  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);

  // ---- Country Data ----

  const sortedCountries = useMemo(() => {
    return [...CANONICAL_COUNTRIES].sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) return sortedCountries;
    const q = searchQuery.toLowerCase().trim();
    return sortedCountries.filter(
      c => c.name.toLowerCase().includes(q) ||
        c.capital.toLowerCase().includes(q) ||
        c.region.toLowerCase().includes(q)
    );
  }, [searchQuery, sortedCountries]);

  // ---- Map Controls ----

  const toggleLabels = useCallback(() => {
    if (!mapRef.current) return;
    const newVis = showLabels ? 'none' : 'visible';
    try {
      mapRef.current.setLayoutProperty('esri-labels-layer', 'visibility', newVis);
      setShowLabels(!showLabels);
    } catch (err) {
      console.warn('Failed to toggle labels layer:', err);
    }
  }, [showLabels]);

  const handleFitCountry = useCallback(() => {
    if (!mapRef.current || !currentQuestion?.bounds) return;
    fitBoundsSafely(mapRef.current, currentQuestion.bounds);
  }, [currentQuestion]);

  // ---- Gameplay Actions ----

  const handleSubmitGuess = async () => {
    if (!guessCoords || !currentQuestion || !sessionId) return;
    setTimerActive(false);
    setIsLoading(true);

    try {
      const responseTimeMs = Date.now() - questionStartTime;
      const result = await submitAnswer(
        sessionId,
        currentQuestion.questionId,
        guessCoords.lat,
        guessCoords.lng,
        responseTimeMs
      );

      setAnswerResult(result);
      setScreen('answer-reveal');

      // Reveal answer on persistent satellite map
      showAnswerOnMap(guessCoords, result.correctCoordinates, result.placeName);

      // Save best score if complete
      if (result.gameComplete && result.summary && selectedCountry) {
        saveBestScore(selectedCountry.name, difficulty, result.totalScore);
        setGameSummary(result.summary);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit answer');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimeoutSubmit = useCallback(async () => {
    if (!currentQuestion || !sessionId) return;
    setTimerActive(false);

    // If user already placed a pin, submit that guess
    if (guessCoords) {
      handleSubmitGuess();
      return;
    }

    // If no pin was placed, submit center point with timeout penalty
    setIsLoading(true);
    try {
      const fallbackLat = currentQuestion.bounds?.center?.lat ?? 0;
      const fallbackLng = currentQuestion.bounds?.center?.lng ?? 0;
      const responseTimeMs = (currentQuestion.timeLimit || 30) * 1000;

      const result = await submitAnswer(
        sessionId,
        currentQuestion.questionId,
        fallbackLat,
        fallbackLng,
        responseTimeMs
      );

      setAnswerResult(result);
      setScreen('answer-reveal');

      // Show answer on map
      showAnswerOnMap({ lat: fallbackLat, lng: fallbackLng }, result.correctCoordinates, result.placeName);

      if (result.gameComplete && result.summary && selectedCountry) {
        saveBestScore(selectedCountry.name, difficulty, result.totalScore);
        setGameSummary(result.summary);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process timeout');
    } finally {
      setIsLoading(false);
    }
  }, [currentQuestion, sessionId, guessCoords, difficulty, selectedCountry]);

  // Timer countdown
  useEffect(() => {
    if (!timerActive || timerSeconds <= 0) return;
    const interval = setInterval(() => {
      setTimerSeconds(prev => {
        if (prev <= 1) {
          setTimerActive(false);
          handleTimeoutSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive, timerSeconds, handleTimeoutSubmit]);

  const handleSelectCountry = async (country: CountryRecord) => {
    setSelectedCountry(country);
    setError(null);
    setIsLoading(true);

    try {
      const playerId = getStoredPlayerId();
      const session = await createSession(country.name, difficulty, 'country-challenge', playerId);
      setSessionId(session.sessionId);

      // Fetch first question
      const question = await fetchQuestion(session.sessionId);
      setCurrentQuestion(question);
      setTimerSeconds(question.timeLimit);
      setTimerActive(true);
      setQuestionStartTime(Date.now());
      setGuessCoords(null);
      setAnswerResult(null);
      setScreen('question');
    } catch (err: any) {
      setError(err.message || 'Failed to start game');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextQuestion = async () => {
    if (!sessionId) return;

    if (answerResult?.gameComplete) {
      setScreen('summary');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const question = await fetchQuestion(sessionId);
      setCurrentQuestion(question);
      setTimerSeconds(question.timeLimit);
      setTimerActive(true);
      setQuestionStartTime(Date.now());
      setGuessCoords(null);
      setAnswerResult(null);
      setScreen('question');

      // Clear markers and distance line on satellite map
      if (guessMarkerRef.current) {
        guessMarkerRef.current.remove();
        guessMarkerRef.current = null;
      }
      if (answerMarkerRef.current) {
        answerMarkerRef.current.remove();
        answerMarkerRef.current = null;
      }
      if (mapRef.current) {
        const lineId = 'ste-distance-line';
        if (mapRef.current.getLayer(lineId)) mapRef.current.removeLayer(lineId);
        if (mapRef.current.getSource(lineId)) mapRef.current.removeSource(lineId);

        // Re-center map to the country bounds smoothly
        if (question.bounds) {
          fitBoundsSafely(mapRef.current, question.bounds);
        }
      }
    } catch (err: any) {
      if ((err as any).exhausted) {
        setScreen('summary');
      } else {
        setError(err.message || 'Failed to get next question');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayAgain = () => {
    // Cleanup map markers and instances
    if (guessMarkerRef.current) {
      guessMarkerRef.current.remove();
      guessMarkerRef.current = null;
    }
    if (answerMarkerRef.current) {
      answerMarkerRef.current.remove();
      answerMarkerRef.current = null;
    }
    if (mapRef.current) {
      try {
        mapRef.current.remove();
      } catch {}
      mapRef.current = null;
    }
    setScreen('landing');
    setSessionId(null);
    setSelectedCountry(null);
    setCurrentQuestion(null);
    setGuessCoords(null);
    setAnswerResult(null);
    setGameSummary(null);
  };

  // ---- Show Answer on Satellite Map ----

  const showAnswerOnMap = useCallback(async (
    guess: { lat: number; lng: number },
    answer: { lat: number; lng: number },
    placeName: string
  ) => {
    const map = mapRef.current;
    if (!map) return;
    const maplibregl = await import('maplibre-gl');

    // 1. Add target marker
    if (answerMarkerRef.current) {
      answerMarkerRef.current.remove();
    }
    const el = document.createElement('div');
    el.className = 'ste-target-marker';
    el.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;pointer-events:none;user-select:none;">
        <div style="background:#10b981;color:#fff;padding:4px 10px;border-radius:12px;font-size:12px;font-weight:700;box-shadow:0 3px 12px rgba(0,0,0,0.6);margin-bottom:2px;white-space:nowrap;letter-spacing:0.3px;display:flex;align-items:center;gap:4px;">
          <span>🎯</span><span>${placeName}</span>
        </div>
        <div style="font-size:34px;filter:drop-shadow(0 0 12px rgba(16,185,129,0.9));line-height:1;">
          📍
        </div>
      </div>
    `;

    answerMarkerRef.current = new maplibregl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat([answer.lng, answer.lat])
      .addTo(map);

    // 2. Add connecting distance line
    const lineId = 'ste-distance-line';
    const geojsonData: any = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: [
          [guess.lng, guess.lat],
          [answer.lng, answer.lat],
        ],
      },
    };

    if (map.getSource(lineId)) {
      (map.getSource(lineId) as any).setData(geojsonData);
    } else {
      map.addSource(lineId, {
        type: 'geojson',
        data: geojsonData,
      });
      map.addLayer({
        id: lineId,
        type: 'line',
        source: lineId,
        paint: {
          'line-color': '#f43f5e',
          'line-width': 3.5,
          'line-dasharray': [3, 2],
        },
      });
    }

    // 3. Fit bounds smoothly to show both markers with comfortable margin
    const bounds = new maplibregl.LngLatBounds();
    bounds.extend([guess.lng, guess.lat]);
    bounds.extend([answer.lng, answer.lat]);
    map.fitBounds(bounds, {
      padding: { top: 90, bottom: 90, left: 90, right: 90 },
      duration: 1400,
      maxZoom: 14,
    });
  }, []);

  // ---- Persistent Satellite Map Initialization ----

  useEffect(() => {
    const isGameplay = screen === 'question' || screen === 'answer-reveal';
    if (!isGameplay) return;
    if (!mapContainerRef.current) return;

    let isDisposed = false;

    async function initSatelliteMap() {
      if (mapRef.current) {
        // Map is already alive; if country or bounds changed, fit bounds
        if (currentQuestion?.bounds) {
          fitBoundsSafely(mapRef.current, currentQuestion.bounds);
        }
        mapRef.current.resize();
        return;
      }

      setIsMapLoading(true);
      const maplibregl = await import('maplibre-gl');
      if (isDisposed || !mapContainerRef.current) return;

      try {
        maplibregl.setWorkerUrl?.('/maplibre-gl-worker.mjs');
      } catch {}

      const bounds = currentQuestion?.bounds;
      const initialCenter: [number, number] = bounds?.center
        ? [bounds.center.lng, bounds.center.lat]
        : [0, 20];
      const initialZoom = bounds?.zoom ?? 4;

      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: SATELLITE_STYLE,
        center: initialCenter,
        zoom: initialZoom,
        attributionControl: false,
        minZoom: 1.5,
        maxZoom: 19,
      });

      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
      map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');

      map.on('load', () => {
        if (isDisposed) return;
        setIsMapLoading(false);
        if (bounds) {
          fitBoundsSafely(map, bounds);
        }
        map.resize();
      });

      // User click on satellite map: places or moves guess marker
      map.on('click', (e) => {
        if (screenRef.current !== 'question') return;
        const { lng, lat } = e.lngLat;
        setGuessCoords({ lat, lng });

        if (guessMarkerRef.current) {
          guessMarkerRef.current.setLngLat([lng, lat]);
        } else {
          const el = document.createElement('div');
          el.className = 'ste-guess-marker';
          el.innerHTML = `
            <div style="display:flex;flex-direction:column;align-items:center;pointer-events:none;user-select:none;">
              <div style="background:#2563eb;color:#fff;padding:3px 8px;border-radius:10px;font-size:11px;font-weight:700;box-shadow:0 2px 8px rgba(0,0,0,0.6);margin-bottom:2px;white-space:nowrap;letter-spacing:0.3px;">
                Your Guess
              </div>
              <div style="font-size:32px;filter:drop-shadow(0 4px 6px rgba(0,0,0,0.7));line-height:1;">
                📍
              </div>
            </div>
          `;
          guessMarkerRef.current = new maplibregl.Marker({
            element: el,
            anchor: 'bottom',
          })
            .setLngLat([lng, lat])
            .addTo(map);
        }
      });

      mapRef.current = map;
    }

    initSatelliteMap();

    return () => {
      isDisposed = true;
    };
  }, [screen, currentQuestion]);

  // Keep map properly sized upon viewport changes
  useEffect(() => {
    if (!mapContainerRef.current) return;
    const ro = new ResizeObserver(() => {
      mapRef.current?.resize();
    });
    ro.observe(mapContainerRef.current);
    return () => ro.disconnect();
  }, [screen]);

  // Cleanup on unmount or return to landing
  useEffect(() => {
    if (screen === 'landing' || screen === 'country-select' || screen === 'summary') {
      if (guessMarkerRef.current) {
        guessMarkerRef.current.remove();
        guessMarkerRef.current = null;
      }
      if (answerMarkerRef.current) {
        answerMarkerRef.current.remove();
        answerMarkerRef.current = null;
      }
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch {}
        mapRef.current = null;
      }
    }
  }, [screen]);

  const isGameplay = screen === 'question' || screen === 'answer-reveal';

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a1a',
      color: '#e8e8f0',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* ---- Global Top Nav Bar ---- */}
      <header style={{
        height: '60px',
        padding: '0 24px',
        background: 'rgba(15, 15, 35, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/games" style={{
            color: '#8888aa',
            textDecoration: 'none',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'color 0.2s',
          }}>
            ← Back to Games
          </Link>
          <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '22px' }}>🌍</span>
            <h1 style={{
              fontSize: '17px',
              fontWeight: 700,
              margin: 0,
              background: 'linear-gradient(135deg, #6dd5ed, #2193b0)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Stop the Earth
            </h1>
          </div>
        </div>

        {currentQuestion && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            fontSize: '14px',
          }}>
            <span style={{
              background: 'rgba(100,200,255,0.1)',
              padding: '4px 10px',
              borderRadius: '20px',
              color: '#6dd5ed',
              fontWeight: 700,
            }}>
              🏆 {currentQuestion.totalScore.toLocaleString()}
            </span>
            {currentQuestion.streak > 0 && (
              <span style={{
                background: 'rgba(255,150,50,0.12)',
                padding: '4px 10px',
                borderRadius: '20px',
                color: '#ff9933',
                fontWeight: 700,
              }}>
                🔥 {currentQuestion.streak} streak
              </span>
            )}
            <span style={{ color: '#8888aa', fontSize: '13px' }}>
              Round {currentQuestion.roundNumber}/{currentQuestion.maxRounds}
            </span>
          </div>
        )}
        {!currentQuestion && <div />}
      </header>

      {/* ---- SCREEN 1: Landing ---- */}
      {screen === 'landing' && (
        <motion.div
          key="landing"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3 }}
          style={{ maxWidth: '720px', margin: '0 auto', padding: '48px 24px', flex: 1 }}
        >
          {/* Hero */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🌍</div>
            <h2 style={{
              fontSize: '36px',
              fontWeight: 800,
              margin: '0 0 12px',
              background: 'linear-gradient(135deg, #6dd5ed, #2193b0, #56ab2f)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Stop the Earth
            </h2>
            <p style={{
              fontSize: '17px',
              color: '#a0a0c0',
              margin: 0,
              lineHeight: 1.6,
            }}>
              Pick a country. Find real places on the <strong>2D Satellite Map</strong>.<br />
              Score points based on precision, speed, and streak bonuses.
            </p>
          </div>

          {/* Difficulty Selector */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '13px', color: '#8888aa', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
              Select Difficulty
            </h3>
            <div style={{ display: 'flex', gap: '12px' }}>
              {DIFFICULTY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setDifficulty(opt.value)}
                  style={{
                    flex: 1,
                    padding: '16px',
                    background: difficulty === opt.value
                      ? 'linear-gradient(135deg, rgba(45,125,180,0.35), rgba(45,125,180,0.18))'
                      : 'rgba(255,255,255,0.04)',
                    border: difficulty === opt.value
                      ? '2px solid rgba(100,200,255,0.6)'
                      : '2px solid rgba(255,255,255,0.08)',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    color: '#e8e8f0',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontSize: '22px', marginBottom: '4px' }}>{opt.emoji}</div>
                  <div style={{ fontSize: '16px', fontWeight: 700 }}>{opt.label}</div>
                  <div style={{ fontSize: '11px', color: '#8888aa', marginTop: '4px', lineHeight: 1.4 }}>{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Start Button */}
          <button
            onClick={() => setScreen('country-select')}
            style={{
              width: '100%',
              padding: '18px',
              background: 'linear-gradient(135deg, #2193b0, #6dd5ed)',
              border: 'none',
              borderRadius: '14px',
              color: '#fff',
              fontSize: '18px',
              fontWeight: 700,
              cursor: 'pointer',
              letterSpacing: '0.5px',
              boxShadow: '0 4px 20px rgba(33,147,176,0.4)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(33,147,176,0.5)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(33,147,176,0.4)';
            }}
          >
            🌍 Choose a Country & Play
          </button>

          {/* How to Play */}
          <div style={{
            marginTop: '40px',
            padding: '24px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px', color: '#a0c4ff' }}>
              How to Play
            </h3>
            {[
              { step: '1', icon: '🌍', text: 'Select any sovereign country from around the world' },
              { step: '2', icon: '🛰️', text: 'Inspect the authentic 2D satellite map of the selected territory' },
              { step: '3', icon: '📍', text: 'Pinpoint your guess on the high-resolution terrain' },
              { step: '4', icon: '🎯', text: 'Reveal true coordinates, distance error, and climb the scoreboard' },
            ].map(item => (
              <div key={item.step} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '12px',
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'rgba(100,200,255,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '17px',
                  flexShrink: 0,
                }}>
                  {item.icon}
                </div>
                <span style={{ fontSize: '14px', color: '#c0c0d8' }}>{item.text}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ---- SCREEN 2: Country Select ---- */}
      {screen === 'country-select' && (
        <motion.div
          key="country-select"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.3 }}
          style={{ maxWidth: '760px', margin: '0 auto', padding: '32px 24px', flex: 1 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <button
              onClick={() => setScreen('landing')}
              style={{
                background: 'none',
                border: 'none',
                color: '#8888aa',
                cursor: 'pointer',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              ← Back
            </button>
            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>
              🌍 Select a Country
            </h2>
            <div style={{
              padding: '4px 12px',
              background: 'rgba(100,200,255,0.1)',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#6dd5ed',
            }}>
              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Mode
            </div>
          </div>

          {/* Search */}
          <div style={{ marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="Search countries, capitals, regions..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 18px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '12px',
                color: '#e8e8f0',
                fontSize: '15px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <div style={{
              padding: '12px 16px',
              background: 'rgba(255,80,80,0.15)',
              border: '1px solid rgba(255,80,80,0.3)',
              borderRadius: '10px',
              color: '#ff8888',
              fontSize: '14px',
              marginBottom: '16px',
            }}>
              {error}
            </div>
          )}

          {/* Country Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
            gap: '10px',
            maxHeight: 'calc(100vh - 270px)',
            overflowY: 'auto',
            paddingRight: '6px',
          }}>
            {filteredCountries.map(country => (
              <button
                key={country.id}
                onClick={() => handleSelectCountry(country)}
                disabled={isLoading}
                style={{
                  padding: '14px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  cursor: isLoading ? 'wait' : 'pointer',
                  textAlign: 'left',
                  color: '#e8e8f0',
                  transition: 'all 0.15s',
                  opacity: isLoading ? 0.5 : 1,
                }}
                onMouseEnter={e => {
                  if (!isLoading) {
                    e.currentTarget.style.background = 'rgba(100,200,255,0.12)';
                    e.currentTarget.style.borderColor = 'rgba(100,200,255,0.35)';
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '24px' }}>{country.flag}</span>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>{country.name}</div>
                    <div style={{ fontSize: '11px', color: '#8888aa' }}>{country.capital} · {country.region}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {isLoading && (
            <div style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 200,
            }}>
              <div style={{
                padding: '24px 44px',
                background: 'rgba(20,20,50,0.95)',
                borderRadius: '16px',
                textAlign: 'center',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              }}>
                <div style={{ fontSize: '36px', marginBottom: '12px', animation: 'spin 2s linear infinite' }}>🌍</div>
                <div style={{ fontSize: '16px', fontWeight: 600 }}>Preparing 2D Satellite View...</div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* ---- SCREEN 3 & 4: Unified Persistent Gameplay View ---- */}
      {isGameplay && currentQuestion && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 60px)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Top Gameplay Bar */}
          <div style={{
            padding: '14px 24px',
            background: screen === 'answer-reveal'
              ? answerResult?.correct
                ? 'rgba(16, 185, 129, 0.15)'
                : 'rgba(239, 68, 68, 0.12)'
              : 'rgba(15, 15, 40, 0.95)',
            borderBottom: `2px solid ${
              screen === 'answer-reveal'
                ? answerResult?.correct
                  ? 'rgba(16, 185, 129, 0.5)'
                  : 'rgba(239, 68, 68, 0.4)'
                : 'rgba(255, 255, 255, 0.08)'
            }`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
            zIndex: 20,
            transition: 'background 0.3s, border-color 0.3s',
          }}>
            {screen === 'question' ? (
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  marginBottom: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <span>{currentQuestion.questionText}</span>
                  {selectedCountry && (
                    <span style={{
                      fontSize: '12px',
                      padding: '2px 8px',
                      background: 'rgba(100,200,255,0.15)',
                      borderRadius: '12px',
                      color: '#6dd5ed',
                    }}>
                      {selectedCountry.flag} {selectedCountry.name}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                  Click the 2D satellite map to place your pin
                </div>
              </div>
            ) : (
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '20px',
                  fontWeight: 800,
                  marginBottom: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <span>{answerResult?.feedback}</span>
                  <span style={{
                    fontSize: '13px',
                    padding: '3px 10px',
                    borderRadius: '12px',
                    background: answerResult?.correct ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)',
                    color: answerResult?.correct ? '#34d399' : '#f87171',
                  }}>
                    {answerResult && answerResult.distanceKm < 1
                      ? `${Math.round(answerResult.distanceKm * 1000)} meters away`
                      : `${answerResult?.distanceKm.toFixed(1)} km away`}
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: '#cbd5e1' }}>
                  Target: <strong>{answerResult?.placeName}</strong>
                </div>
              </div>
            )}

            {/* Right Element: Timer (during question) OR Score Awarded (during reveal) */}
            {screen === 'question' ? (
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: timerSeconds <= 5
                  ? 'rgba(255,80,80,0.2)'
                  : timerSeconds <= 10
                    ? 'rgba(255,200,50,0.15)'
                    : 'rgba(100,200,255,0.1)',
                border: `3px solid ${timerSeconds <= 5 ? '#ff5555' : timerSeconds <= 10 ? '#ffcc33' : '#6dd5ed'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                fontWeight: 800,
                color: timerSeconds <= 5 ? '#ff5555' : timerSeconds <= 10 ? '#ffcc33' : '#e8e8f0',
                flexShrink: 0,
                marginLeft: '16px',
                boxShadow: timerSeconds <= 5 ? '0 0 16px rgba(255,85,85,0.4)' : 'none',
                transition: 'all 0.3s',
              }}>
                {timerSeconds}
              </div>
            ) : (
              <div style={{ textAlign: 'right', marginLeft: '16px' }}>
                <div style={{
                  fontSize: '28px',
                  fontWeight: 900,
                  color: '#6dd5ed',
                  lineHeight: 1,
                  filter: 'drop-shadow(0 2px 8px rgba(109,213,237,0.4))',
                }}>
                  +{answerResult?.scoring.totalScore.toLocaleString()}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                  Total: {answerResult?.totalScore.toLocaleString()} pts
                </div>
              </div>
            )}
          </div>

          {/* Persistent Map Container (MapLibre Canvas) */}
          <div
            ref={mapContainerRef}
            style={{
              flex: 1,
              position: 'relative',
              cursor: screen === 'question' ? 'crosshair' : 'default',
              background: '#0d1117',
            }}
          >
            {/* Floating Satellite Controls HUD */}
            <div style={{
              position: 'absolute',
              top: '14px',
              left: '14px',
              zIndex: 15,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(15, 23, 42, 0.88)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              borderRadius: '10px',
              padding: '6px 12px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
            }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                🛰️ 2D Satellite
              </span>
              <div style={{ width: '1px', height: '14px', background: 'rgba(255,255,255,0.2)' }} />
              <button
                onClick={toggleLabels}
                title="Toggle political boundaries and place names"
                style={{
                  background: showLabels ? 'rgba(56, 189, 248, 0.22)' : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${showLabels ? '#38bdf8' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: '6px',
                  color: showLabels ? '#38bdf8' : '#94a3b8',
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '4px 8px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {showLabels ? '🏷️ Borders: ON' : '🏷️ Borders: OFF'}
              </button>
              <button
                onClick={handleFitCountry}
                title="Recenter and fit country bounds"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                  color: '#e2e8f0',
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '4px 8px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                🎯 Reset View
              </button>
            </div>

            {/* Satellite Loading Spinner */}
            {isMapLoading && (
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(10, 15, 30, 0.75)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
                color: '#e2e8f0',
                gap: '12px',
              }}>
                <div style={{ fontSize: '36px', animation: 'spin 2s linear infinite' }}>🛰️</div>
                <div style={{ fontSize: '15px', fontWeight: 600 }}>Loading 2D Satellite Imagery...</div>
              </div>
            )}
          </div>

          {/* Bottom Bar: Guess / Submit OR Round Score Breakdown / Next */}
          <div style={{
            padding: '14px 24px',
            background: 'rgba(15, 15, 40, 0.95)',
            backdropFilter: 'blur(10px)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
            zIndex: 20,
          }}>
            {screen === 'question' ? (
              <>
                <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                  {guessCoords
                    ? `📍 Guess placed at [${guessCoords.lat.toFixed(3)}°, ${guessCoords.lng.toFixed(3)}°]`
                    : '👆 Click anywhere on the satellite terrain to place your guess'}
                </div>
                <button
                  onClick={handleSubmitGuess}
                  disabled={!guessCoords || isLoading}
                  style={{
                    padding: '12px 32px',
                    background: guessCoords
                      ? 'linear-gradient(135deg, #2193b0, #6dd5ed)'
                      : 'rgba(255,255,255,0.08)',
                    border: 'none',
                    borderRadius: '12px',
                    color: guessCoords ? '#fff' : '#666',
                    fontSize: '15px',
                    fontWeight: 700,
                    cursor: guessCoords ? 'pointer' : 'not-allowed',
                    opacity: isLoading ? 0.5 : 1,
                    boxShadow: guessCoords ? '0 4px 16px rgba(33,147,176,0.4)' : 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  {isLoading ? 'Submitting...' : 'Submit Guess'}
                </button>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#a0a0c0' }}>
                  <span>Base: {answerResult?.scoring.baseScore}</span>
                  <span>Speed: +{answerResult?.scoring.speedBonus}</span>
                  <span>×{answerResult?.scoring.difficultyMultiplier} diff</span>
                  {answerResult?.scoring && answerResult.scoring.streakMultiplier > 1 && (
                    <span style={{ color: '#ff9933' }}>
                      🔥 ×{answerResult.scoring.streakMultiplier.toFixed(1)} streak
                    </span>
                  )}
                </div>
                <button
                  onClick={handleNextQuestion}
                  disabled={isLoading}
                  style={{
                    padding: '12px 32px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    border: 'none',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '15px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(16,185,129,0.3)',
                    opacity: isLoading ? 0.5 : 1,
                    transition: 'all 0.2s',
                  }}
                >
                  {answerResult?.gameComplete ? '📊 See Final Results' : '➡️ Next Question'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ---- SCREEN 5: Summary ---- */}
      {screen === 'summary' && (
        <motion.div
          key="summary"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.35 }}
          style={{ maxWidth: '640px', margin: '0 auto', padding: '48px 24px', flex: 1 }}
        >
          {/* Trophy Header */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ fontSize: '72px', marginBottom: '12px' }}>🏆</div>
            <h2 style={{
              fontSize: '30px',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #ffd700, #ff8c00)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: '0 0 8px',
            }}>
              Game Complete!
            </h2>
            <p style={{ color: '#a0a0c0', fontSize: '16px', margin: 0 }}>
              {selectedCountry?.flag} {selectedCountry?.name} — {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Mode
            </p>
          </div>

          {/* Score Card */}
          <div style={{
            padding: '28px',
            background: 'rgba(255,255,255,0.04)',
            borderRadius: '20px',
            border: '1px solid rgba(255,255,255,0.08)',
            marginBottom: '24px',
          }}>
            <div style={{
              textAlign: 'center',
              marginBottom: '24px',
            }}>
              <div style={{ fontSize: '48px', fontWeight: 900, color: '#6dd5ed' }}>
                {(gameSummary?.totalScore || answerResult?.totalScore || 0).toLocaleString()}
              </div>
              <div style={{ fontSize: '14px', color: '#8888aa' }}>Total Points Earned</div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
            }}>
              {[
                {
                  label: 'Questions',
                  value: `${gameSummary?.questionsCorrect || 0}/${gameSummary?.questionsAnswered || 0}`,
                  emoji: '✅'
                },
                {
                  label: 'Avg Distance',
                  value: `${gameSummary?.avgDistanceKm || 0} km`,
                  emoji: '📏'
                },
                {
                  label: 'Best Guess',
                  value: gameSummary?.bestGuessKm !== null && gameSummary?.bestGuessKm !== undefined
                    ? `${gameSummary.bestGuessKm} km`
                    : '—',
                  emoji: '🎯'
                },
                {
                  label: 'Longest Streak',
                  value: `${gameSummary?.longestStreak || 0}`,
                  emoji: '🔥'
                },
              ].map(stat => (
                <div key={stat.label} style={{
                  padding: '16px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '12px',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '22px', marginBottom: '4px' }}>{stat.emoji}</div>
                  <div style={{ fontSize: '18px', fontWeight: 700 }}>{stat.value}</div>
                  <div style={{ fontSize: '12px', color: '#8888aa' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Round History */}
          {gameSummary?.rounds && gameSummary.rounds.length > 0 && (
            <div style={{
              padding: '20px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.06)',
              marginBottom: '24px',
            }}>
              <h3 style={{ fontSize: '13px', color: '#8888aa', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
                Round by Round Breakdown
              </h3>
              {gameSummary.rounds.map((round, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 0',
                  borderBottom: i < gameSummary.rounds.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '12px', color: '#666', width: '20px' }}>#{i + 1}</span>
                    <span style={{ fontSize: '14px', fontWeight: 600 }}>{round.placeName}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '13px', color: '#a0a0c0' }}>
                      {round.distanceKm !== null ? `${Math.round(round.distanceKm)} km` : '—'}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#6dd5ed', minWidth: '60px', textAlign: 'right' }}>
                      +{round.score}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handlePlayAgain}
              style={{
                flex: 1,
                padding: '16px',
                background: 'linear-gradient(135deg, #2193b0, #6dd5ed)',
                border: 'none',
                borderRadius: '14px',
                color: '#fff',
                fontSize: '16px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(33,147,176,0.3)',
              }}
            >
              🔄 Play Again
            </button>
            <Link href="/games" style={{
              flex: 1,
              padding: '16px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '14px',
              color: '#e8e8f0',
              fontSize: '16px',
              fontWeight: 600,
              textDecoration: 'none',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              🎮 More Games
            </Link>
          </div>
        </motion.div>
      )}

      {(screen === 'landing' || screen === 'summary') && <GlobalFooter />}

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .maplibregl-ctrl-attrib { display: none !important; }
      `}</style>
    </div>
  );
}
