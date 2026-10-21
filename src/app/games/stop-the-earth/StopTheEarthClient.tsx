// ============================================================
// MooEarth Live — Stop the Earth: Full Game Client Component
// ============================================================
// Complete interactive game UI with 5 screens:
// 1. Landing — game branding, difficulty select, how to play
// 2. Country Select — searchable country picker
// 3. Question Screen — interactive MapLibre map + timer
// 4. Answer Reveal — dual markers, distance line, scoring
// 5. Game Summary — final results + share
//
// All game logic is server-authoritative. This component only
// handles display and user interaction.

'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
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
  CreateSessionResponse,
} from '@/services/stopTheEarth/gameClient';
import GlobalFooter from '@/components/Layout/GlobalFooter';

// ---- Constants ----

const DIFFICULTY_OPTIONS: { value: SteDifficulty; label: string; emoji: string; desc: string }[] = [
  { value: 'easy', label: 'Easy', emoji: '🟢', desc: '50km tolerance · 30s timer · 5 rounds' },
  { value: 'medium', label: 'Medium', emoji: '🟡', desc: '30km tolerance · 20s timer · 7 rounds' },
  { value: 'hard', label: 'Hard', emoji: '🔴', desc: '15km tolerance · 15s timer · 10 rounds' },
];

type GameScreen = 'landing' | 'country-select' | 'question' | 'answer-reveal' | 'summary';

// ---- Main Component ----

export default function StopTheEarthClient() {
  // Screen state
  const [screen, setScreen] = useState<GameScreen>('landing');
  const [difficulty, setDifficulty] = useState<SteDifficulty>('easy');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Map ref
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const guessMarkerRef = useRef<any>(null);
  const answerMarkerRef = useRef<any>(null);
  const lineLayerRef = useRef<string | null>(null);

  // Timer effect
  useEffect(() => {
    if (!timerActive || timerSeconds <= 0) return;
    const interval = setInterval(() => {
      setTimerSeconds(prev => {
        if (prev <= 1) {
          setTimerActive(false);
          // Auto-submit when time runs out
          if (guessCoords && currentQuestion && sessionId) {
            handleSubmitGuess();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive, timerSeconds]);

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

  // ---- Map Initialization ----

  const initializeMap = useCallback(async (bounds: CountryBounds) => {
    if (!mapContainerRef.current) return;

    // Dynamically import MapLibre to avoid SSR issues
    const maplibregl = await import('maplibre-gl');
    try {
      maplibregl.setWorkerUrl?.('/maplibre-gl-worker.mjs');
    } catch {
      // ignore
    }

    // Clean up previous map
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: [bounds.center.lng, bounds.center.lat],
      zoom: bounds.zoom,
      attributionControl: false,
      minZoom: 2,
      maxZoom: 15,
    });

    // Fit to country bounds
    map.fitBounds(
      [[bounds.sw.lng, bounds.sw.lat], [bounds.ne.lng, bounds.ne.lat]],
      { padding: 40, duration: 1000 }
    );

    // Click handler: place/move guess marker
    map.on('click', (e: any) => {
      const { lng, lat } = e.lngLat;
      setGuessCoords({ lat, lng });

      // Remove old guess marker
      if (guessMarkerRef.current) {
        guessMarkerRef.current.remove();
      }

      // Create new guess marker
      const el = document.createElement('div');
      el.className = 'ste-guess-marker';
      el.innerHTML = '📍';
      el.style.cssText = 'font-size:32px;cursor:pointer;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.5));transform:translate(-50%,-100%);';

      guessMarkerRef.current = new maplibregl.Marker({ element: el })
        .setLngLat([lng, lat])
        .addTo(map);
    });

    mapRef.current = map;
  }, []);

  // ---- Show Answer on Map ----

  const showAnswerOnMap = useCallback(async (
    guess: { lat: number; lng: number },
    answer: { lat: number; lng: number }
  ) => {
    if (!mapRef.current) return;
    const maplibregl = await import('maplibre-gl');
    const map = mapRef.current;

    // Add correct answer marker
    const el = document.createElement('div');
    el.innerHTML = '🎯';
    el.style.cssText = 'font-size:36px;filter:drop-shadow(0 2px 8px rgba(0,255,0,0.6));transform:translate(-50%,-100%);';

    if (answerMarkerRef.current) answerMarkerRef.current.remove();
    answerMarkerRef.current = new maplibregl.Marker({ element: el })
      .setLngLat([answer.lng, answer.lat])
      .addTo(map);

    // Add distance line
    const lineId = 'ste-distance-line';
    if (map.getLayer(lineId)) map.removeLayer(lineId);
    if (map.getSource(lineId)) map.removeSource(lineId);

    map.addSource(lineId, {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: [
            [guess.lng, guess.lat],
            [answer.lng, answer.lat],
          ],
        },
      },
    });

    map.addLayer({
      id: lineId,
      type: 'line',
      source: lineId,
      paint: {
        'line-color': '#ff6b6b',
        'line-width': 3,
        'line-dasharray': [4, 4],
      },
    });

    lineLayerRef.current = lineId;

    // Fit to show both markers
    const bounds = new maplibregl.LngLatBounds();
    bounds.extend([guess.lng, guess.lat]);
    bounds.extend([answer.lng, answer.lat]);
    map.fitBounds(bounds, { padding: 80, duration: 1500 });
  }, []);

  // ---- Game Actions ----

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
      setScreen('question');

      // Initialize map with country bounds
      setTimeout(() => {
        initializeMap(question.bounds);
      }, 100);
    } catch (err: any) {
      setError(err.message || 'Failed to start game');
    } finally {
      setIsLoading(false);
    }
  };

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

      // Show answer on map
      showAnswerOnMap(guessCoords, result.correctCoordinates);

      // Save best score
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

  const handleNextQuestion = async () => {
    if (!sessionId) return;

    // If game is complete, go to summary
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

      // Reinitialize map
      setTimeout(() => {
        if (guessMarkerRef.current) { guessMarkerRef.current.remove(); guessMarkerRef.current = null; }
        if (answerMarkerRef.current) { answerMarkerRef.current.remove(); answerMarkerRef.current = null; }
        initializeMap(question.bounds);
      }, 100);
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
    setScreen('landing');
    setSessionId(null);
    setSelectedCountry(null);
    setCurrentQuestion(null);
    setGuessCoords(null);
    setAnswerResult(null);
    setGameSummary(null);
    setError(null);
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }
  };

  // ---- Render ----

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 40%, #0d0d2b 100%)',
      color: '#e8e8f0',
      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    }}>
      {/* Header */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 24px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(10,10,30,0.8)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <Link href="/games" style={{
          color: '#8888aa',
          textDecoration: 'none',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          ← Back to Games
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>🌍</span>
          <h1 style={{
            fontSize: '18px',
            fontWeight: 700,
            margin: 0,
            background: 'linear-gradient(135deg, #6dd5ed, #2193b0)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Stop the Earth
          </h1>
        </div>
        {currentQuestion && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            fontSize: '14px',
          }}>
            <span>🏆 {currentQuestion.totalScore.toLocaleString()}</span>
            {currentQuestion.streak > 0 && (
              <span>🔥 {currentQuestion.streak}</span>
            )}
            <span style={{ color: '#8888aa' }}>
              {currentQuestion.roundNumber}/{currentQuestion.maxRounds}
            </span>
          </div>
        )}
        {!currentQuestion && <div />}
      </header>

      <AnimatePresence mode="wait">
        {/* ---- SCREEN: Landing ---- */}
        {screen === 'landing' && (
          <motion.div
            key="landing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            style={{ maxWidth: '720px', margin: '0 auto', padding: '48px 24px' }}
          >
            {/* Hero */}
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
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
                fontSize: '18px',
                color: '#a0a0c0',
                margin: 0,
                lineHeight: 1.6,
              }}>
                Pick a country. Find real places on the map.<br />
                Score points based on how close you get.
              </p>
            </div>

            {/* Difficulty Selector */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '14px', color: '#8888aa', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
                Difficulty
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
                        ? 'linear-gradient(135deg, rgba(45,125,180,0.3), rgba(45,125,180,0.15))'
                        : 'rgba(255,255,255,0.04)',
                      border: difficulty === opt.value
                        ? '2px solid rgba(100,200,255,0.5)'
                        : '2px solid rgba(255,255,255,0.08)',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      color: '#e8e8f0',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ fontSize: '20px', marginBottom: '4px' }}>{opt.emoji}</div>
                    <div style={{ fontSize: '16px', fontWeight: 700 }}>{opt.label}</div>
                    <div style={{ fontSize: '11px', color: '#8888aa', marginTop: '4px' }}>{opt.desc}</div>
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
              🌍 Choose a Country
            </button>

            {/* How to Play */}
            <div style={{
              marginTop: '48px',
              padding: '24px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: '#a0c4ff' }}>
                How to Play
              </h3>
              {[
                { step: '1', icon: '🌍', text: 'Select any country from the list' },
                { step: '2', icon: '📍', text: 'Read the question — find the place on the map' },
                { step: '3', icon: '🖱️', text: 'Click the map to place your guess' },
                { step: '4', icon: '🎯', text: 'See how close you were and earn points' },
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
                    fontSize: '18px',
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

        {/* ---- SCREEN: Country Select ---- */}
        {screen === 'country-select' && (
          <motion.div
            key="country-select"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 24px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <button
                onClick={() => setScreen('landing')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#8888aa',
                  cursor: 'pointer',
                  fontSize: '14px',
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
                color: '#6dd5ed',
              }}>
                {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
              </div>
            </div>

            {/* Search */}
            <div style={{ marginBottom: '20px' }}>
              <input
                type="text"
                placeholder="Search countries..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px 18px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  color: '#e8e8f0',
                  fontSize: '16px',
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
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '10px',
              maxHeight: 'calc(100vh - 280px)',
              overflowY: 'auto',
              paddingRight: '8px',
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
                      e.currentTarget.style.background = 'rgba(100,200,255,0.1)';
                      e.currentTarget.style.borderColor = 'rgba(100,200,255,0.3)';
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
                      <div style={{ fontSize: '11px', color: '#8888aa' }}>{country.region}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {isLoading && (
              <div style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 200,
              }}>
                <div style={{
                  padding: '24px 48px',
                  background: 'rgba(20,20,50,0.95)',
                  borderRadius: '16px',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '32px', marginBottom: '12px', animation: 'spin 2s linear infinite' }}>🌍</div>
                  <div style={{ fontSize: '16px', fontWeight: 600 }}>Loading game...</div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ---- SCREEN: Question ---- */}
        {screen === 'question' && currentQuestion && (
          <motion.div
            key="question"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              height: 'calc(100vh - 65px)',
            }}
          >
            {/* Question Bar */}
            <div style={{
              padding: '16px 24px',
              background: 'rgba(15,15,40,0.95)',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  marginBottom: '4px',
                }}>
                  {currentQuestion.questionText}
                </div>
                <div style={{ fontSize: '12px', color: '#8888aa' }}>
                  Click the map to place your guess
                </div>
              </div>

              {/* Timer */}
              <div style={{
                width: '60px',
                height: '60px',
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
                color: timerSeconds <= 5 ? '#ff5555' : '#e8e8f0',
                flexShrink: 0,
                marginLeft: '16px',
                transition: 'all 0.3s',
              }}>
                {timerSeconds}
              </div>
            </div>

            {/* Map */}
            <div
              ref={mapContainerRef}
              style={{
                flex: 1,
                position: 'relative',
                cursor: 'crosshair',
              }}
            />

            {/* Submit Bar */}
            <div style={{
              padding: '16px 24px',
              background: 'rgba(15,15,40,0.95)',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}>
              <div style={{ fontSize: '13px', color: '#8888aa' }}>
                {guessCoords
                  ? `📍 Guess: ${guessCoords.lat.toFixed(2)}°, ${guessCoords.lng.toFixed(2)}°`
                  : '👆 Click the map to place your guess'}
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
                  fontSize: '16px',
                  fontWeight: 700,
                  cursor: guessCoords ? 'pointer' : 'not-allowed',
                  opacity: isLoading ? 0.5 : 1,
                  transition: 'all 0.2s',
                }}
              >
                {isLoading ? 'Submitting...' : 'Submit Guess'}
              </button>
            </div>
          </motion.div>
        )}

        {/* ---- SCREEN: Answer Reveal ---- */}
        {screen === 'answer-reveal' && answerResult && (
          <motion.div
            key="answer-reveal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              height: 'calc(100vh - 65px)',
            }}
          >
            {/* Result Header */}
            <div style={{
              padding: '16px 24px',
              background: answerResult.correct
                ? 'rgba(34,197,94,0.12)'
                : 'rgba(255,100,100,0.08)',
              borderBottom: `2px solid ${answerResult.correct ? 'rgba(34,197,94,0.4)' : 'rgba(255,100,100,0.3)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}>
              <div>
                <div style={{ fontSize: '22px', fontWeight: 800, marginBottom: '4px' }}>
                  {answerResult.feedback}
                </div>
                <div style={{ fontSize: '14px', color: '#a0a0c0' }}>
                  {answerResult.placeName} — {answerResult.distanceKm < 1
                    ? `${Math.round(answerResult.distanceKm * 1000)} meters`
                    : `${answerResult.distanceKm.toFixed(1)} km`} away
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontSize: '28px',
                  fontWeight: 800,
                  color: '#6dd5ed',
                }}>
                  +{answerResult.scoring.totalScore.toLocaleString()}
                </div>
                <div style={{ fontSize: '12px', color: '#8888aa' }}>
                  Total: {answerResult.totalScore.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Map (shows both markers + line) */}
            <div
              ref={mapContainerRef}
              style={{
                flex: 1,
                position: 'relative',
              }}
            />

            {/* Score Breakdown + Next */}
            <div style={{
              padding: '16px 24px',
              background: 'rgba(15,15,40,0.95)',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#a0a0c0' }}>
                <span>Base: {answerResult.scoring.baseScore}</span>
                <span>Speed: +{answerResult.scoring.speedBonus}</span>
                <span>×{answerResult.scoring.difficultyMultiplier} diff</span>
                {answerResult.scoring.streakMultiplier > 1 && (
                  <span>×{answerResult.scoring.streakMultiplier.toFixed(1)} streak</span>
                )}
              </div>
              <button
                onClick={handleNextQuestion}
                disabled={isLoading}
                style={{
                  padding: '12px 32px',
                  background: 'linear-gradient(135deg, #2193b0, #6dd5ed)',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '16px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  opacity: isLoading ? 0.5 : 1,
                }}
              >
                {answerResult.gameComplete ? '📊 See Results' : '➡️ Next Question'}
              </button>
            </div>
          </motion.div>
        )}

        {/* ---- SCREEN: Summary ---- */}
        {screen === 'summary' && (
          <motion.div
            key="summary"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            style={{ maxWidth: '600px', margin: '0 auto', padding: '48px 24px' }}
          >
            {/* Trophy */}
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ fontSize: '72px', marginBottom: '12px' }}>🏆</div>
              <h2 style={{
                fontSize: '28px',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #ffd700, #ff8c00)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: '0 0 8px',
              }}>
                Game Complete!
              </h2>
              <p style={{ color: '#a0a0c0', fontSize: '16px', margin: 0 }}>
                {selectedCountry?.flag} {selectedCountry?.name} — {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
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
                <div style={{ fontSize: '14px', color: '#8888aa' }}>Total Points</div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
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
                    value: gameSummary?.bestGuessKm !== null
                      ? `${gameSummary?.bestGuessKm} km`
                      : '—',
                    emoji: '🎯'
                  },
                  {
                    label: 'Best Streak',
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
                    <div style={{ fontSize: '24px', marginBottom: '4px' }}>{stat.emoji}</div>
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
                <h3 style={{ fontSize: '14px', color: '#8888aa', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
                  Round History
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
                      <span style={{ fontSize: '14px' }}>{round.placeName}</span>
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
      </AnimatePresence>

      {(screen === 'landing' || screen === 'summary') && <GlobalFooter />}

      {/* MapLibre CSS */}
      <style>{`
        @import url('https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css');
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .maplibregl-ctrl-attrib { display: none !important; }
      `}</style>
    </div>
  );
}
