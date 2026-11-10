'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSentryHealthReport } from '@/services/sentryWatchdog';

interface HealthCheckItem {
  name: string;
  category: 'clouds' | 'winds' | 'weather' | 'time' | 'games';
  target: string;
  passed: boolean;
  latencyMs: number;
  details: string;
}

interface PlatformHealthData {
  ok: boolean;
  status: 'HEALTHY' | 'DEGRADED';
  timestamp: string;
  durationMs: number;
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
  categories: {
    clouds: HealthCheckItem[];
    winds: HealthCheckItem[];
    weather: HealthCheckItem[];
    time: HealthCheckItem[];
    games: HealthCheckItem[];
  };
  checks: HealthCheckItem[];
}

interface LegacyHealthCheck {
  name: string;
  status: 'PASS' | 'FAIL' | 'PENDING' | 'SKIPPED';
  message: string;
  timestamp: string;
  details?: string[];
}

export default function ProductionHealthDashboard() {
  const [platformHealth, setPlatformHealth] = useState<PlatformHealthData | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | 'clouds' | 'winds' | 'weather' | 'time' | 'games'>('all');
  const [isAuditing, setIsAuditing] = useState(false);
  const [lastAuditTime, setLastAuditTime] = useState<string | null>(null);

  // Legacy suite state
  const [legacyChecks, setLegacyChecks] = useState<LegacyHealthCheck[]>([]);
  const [isLegacyRunning, setIsLegacyRunning] = useState(false);
  const [showLegacySuite, setShowLegacySuite] = useState(false);

  // 1. Fetch 24-Hour Autonomous Platform Health
  const runPlatformAudit = useCallback(async () => {
    setIsAuditing(true);
    try {
      const res = await fetch('/api/cron/daily-health-check', {
        method: 'POST',
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (res.ok) {
        const data: PlatformHealthData = await res.json();
        setPlatformHealth(data);
        setLastAuditTime(new Date().toLocaleTimeString());
      } else {
        // Fallback to GET on /api/health/status
        const fallbackRes = await fetch('/api/health/status');
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          setPlatformHealth({
            ok: fallbackData.status === 'HEALTHY',
            status: fallbackData.status,
            timestamp: fallbackData.lastChecked,
            durationMs: fallbackData.durationMs,
            summary: {
              total: fallbackData.summary.totalChecks,
              passed: fallbackData.summary.passedChecks,
              failed: fallbackData.summary.failedChecks,
            },
            categories: fallbackData.categories,
            checks: fallbackData.checks,
          });
          setLastAuditTime(new Date().toLocaleTimeString());
        }
      }
    } catch (err) {
      console.error('Failed to run platform audit:', err);
    } finally {
      setIsAuditing(false);
    }
  }, []);

  // 2. Fetch initial health on mount and refresh every 60s
  useEffect(() => {
    runPlatformAudit();
    const timer = setInterval(runPlatformAudit, 60000);
    return () => clearInterval(timer);
  }, [runPlatformAudit]);

  // 3. Optional secondary suite (News, Sentry, Game engine)
  const runLegacySuite = useCallback(async () => {
    setIsLegacyRunning(true);
    const checks: LegacyHealthCheck[] = [];

    const runItem = async (name: string, fn: () => Promise<{ pass: boolean; message: string; details?: string[] }>) => {
      try {
        const res = await fn();
        return { name, status: (res.pass ? 'PASS' : 'FAIL') as LegacyHealthCheck['status'], message: res.message, timestamp: new Date().toISOString(), details: res.details };
      } catch (e: any) {
        return { name, status: 'FAIL' as LegacyHealthCheck['status'], message: e.message || 'Error', timestamp: new Date().toISOString() };
      }
    };

    checks.push(await runItem('News & Event Telemetry', async () => {
      const res = await fetch('/api/events');
      if (!res.ok) return { pass: false, message: `HTTP ${res.status}` };
      const d = await res.json();
      return { pass: Boolean(d.events && d.events.length > 0), message: `${d.events?.length || 0} events verified` };
    }));

    checks.push(await runItem('Game Engine Status', async () => {
      const res = await fetch('/api/game/health');
      if (!res.ok) return { pass: false, message: `HTTP ${res.status}` };
      const d = await res.json();
      return { pass: d.status === 'HEALTHY', message: `Engine HEALTHY (${d.registeredChallengeTypes} challenge types)` };
    }));

    checks.push(await runItem('Sentry Watchdog & Auto-Heal', async () => {
      const sentryReport = getSentryHealthReport();
      return {
        pass: sentryReport.status === 'HEALTHY' || sentryReport.status === 'HEALED',
        message: `Watchdog: ${sentryReport.status} (${sentryReport.autoHealsApplied} auto-heals applied)`,
      };
    }));

    setLegacyChecks(checks);
    setIsLegacyRunning(false);
  }, []);

  const getDomainIcon = (cat: string) => {
    switch (cat) {
      case 'clouds': return '🛰️';
      case 'winds': return '💨';
      case 'weather': return '⛈️';
      case 'time': return '⏰';
      case 'games': return '🎮';
      default: return '🌐';
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'clouds': return '#38bdf8'; // Sky blue
      case 'winds': return '#34d399';  // Emerald
      case 'weather': return '#fbbf24';// Amber
      case 'time': return '#a78bfa';   // Violet
      case 'games': return '#f43f5e';  // Rose
      default: return '#06b6d4';       // Cyan
    }
  };

  const filteredChecks = platformHealth?.checks.filter(
    (c) => activeCategoryFilter === 'all' || c.category === activeCategoryFilter
  ) || [];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#070a13', color: '#e5e7eb', fontFamily: "'Inter', -apple-system, sans-serif", padding: '2rem 1.5rem' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>

      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        {/* Header Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.75rem' }}>🛡️</span>
              <h1 style={{ fontSize: '1.85rem', fontWeight: 800, background: 'linear-gradient(135deg, #00f2fe, #4facfe, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0, letterSpacing: '-0.02em' }}>
                MooEarth Live — 24-Hour Autonomous Platform Sentinel
              </h1>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '6px', margin: 0 }}>
              Automated 24-Hour Verification Suite across Clouds, Winds, Weather, Solar Time, and Geography Games
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={runPlatformAudit}
              disabled={isAuditing}
              style={{
                padding: '10px 22px',
                borderRadius: '10px',
                border: 'none',
                background: isAuditing ? '#334155' : 'linear-gradient(135deg, #06b6d4, #3b82f6, #8b5cf6)',
                color: 'white',
                fontWeight: 700,
                cursor: isAuditing ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 15px rgba(6, 182, 212, 0.25)',
                transition: 'all 0.2s ease',
              }}
            >
              {isAuditing ? (
                <>
                  <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span>
                  <span>Auditing Subsystems...</span>
                </>
              ) : (
                <>
                  <span>⚡</span>
                  <span>Run 24h Autonomous Audit Now</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Top Metrics Row */}
        {platformHealth && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {/* Status Card */}
            <div style={{ background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(12px)', borderRadius: '14px', padding: '1.25rem', border: `1px solid ${platformHealth.ok ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}` }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', fontWeight: 600 }}>
                Platform Status
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: platformHealth.ok ? '#10b981' : '#ef4444' }} />
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: platformHealth.ok ? '#10b981' : '#ef4444' }}>
                  {platformHealth.status}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                {platformHealth.summary.passed} of {platformHealth.summary.total} Subsystem Probes Passing
              </div>
            </div>

            {/* Daily Schedule Card */}
            <div style={{ background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(12px)', borderRadius: '14px', padding: '1.25rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', fontWeight: 600 }}>
                24-Hour Autonomous Cron
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#38bdf8', marginTop: '6px' }}>
                Every 24h
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                Schedule: 00:00 UTC (Vercel Cron Active)
              </div>
            </div>

            {/* Audit Duration */}
            <div style={{ background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(12px)', borderRadius: '14px', padding: '1.25rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', fontWeight: 600 }}>
                Audit Latency
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#a78bfa', marginTop: '6px' }}>
                {platformHealth.durationMs} ms
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                Full 5-Domain End-to-End Scan
              </div>
            </div>

            {/* Last Verified Timestamp */}
            <div style={{ background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(12px)', borderRadius: '14px', padding: '1.25rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', fontWeight: 600 }}>
                Last Verified
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f1f5f9', marginTop: '6px' }}>
                {lastAuditTime || new Date(platformHealth.timestamp).toLocaleTimeString()}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                {new Date(platformHealth.timestamp).toISOString().split('T')[0]} (Live Production)
              </div>
            </div>
          </div>
        )}

        {/* 5 Core Domain Cards */}
        {platformHealth && (
          <div style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🌐</span>
              <span>Subsystem Health Breakdown (5 Pillars)</span>
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1rem' }}>
              {/* 1. Clouds */}
              <div style={{ background: '#0f172a', borderRadius: '12px', padding: '1.25rem', borderLeft: '4px solid #38bdf8', borderTop: '1px solid rgba(255, 255, 255, 0.06)', borderRight: '1px solid rgba(255, 255, 255, 0.06)', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '1.25rem' }}>🛰️</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
                    {platformHealth.categories.clouds.filter(c => c.passed).length}/{platformHealth.categories.clouds.length} PASS
                  </span>
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f8fafc' }}>Clouds & Satellite</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
                  NASA GIBS VIIRS WMTS, Geostationary Clean IR, and Cloud Tile Stream
                </div>
              </div>

              {/* 2. Winds */}
              <div style={{ background: '#0f172a', borderRadius: '12px', padding: '1.25rem', borderLeft: '4px solid #34d399', borderTop: '1px solid rgba(255, 255, 255, 0.06)', borderRight: '1px solid rgba(255, 255, 255, 0.06)', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '1.25rem' }}>💨</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', backgroundColor: 'rgba(52, 211, 153, 0.15)', color: '#34d399' }}>
                    {platformHealth.categories.winds.filter(c => c.passed).length}/{platformHealth.categories.winds.length} PASS
                  </span>
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f8fafc' }}>Winds & Gestures</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
                  GFS 10,512 Vector Assimilation, 85% Ocean / 15% Land Bias (Windy Parity)
                </div>
              </div>

              {/* 3. Weather */}
              <div style={{ background: '#0f172a', borderRadius: '12px', padding: '1.25rem', borderLeft: '4px solid #fbbf24', borderTop: '1px solid rgba(255, 255, 255, 0.06)', borderRight: '1px solid rgba(255, 255, 255, 0.06)', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '1.25rem' }}>⛈️</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', backgroundColor: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24' }}>
                    {platformHealth.categories.weather.filter(c => c.passed).length}/{platformHealth.categories.weather.length} PASS
                  </span>
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f8fafc' }}>Weather & Storms</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
                  JTWC/NHC Cyclones, 12 Doppler Radar Frames, and Air Quality Telemetry
                </div>
              </div>

              {/* 4. Time */}
              <div style={{ background: '#0f172a', borderRadius: '12px', padding: '1.25rem', borderLeft: '4px solid #a78bfa', borderTop: '1px solid rgba(255, 255, 255, 0.06)', borderRight: '1px solid rgba(255, 255, 255, 0.06)', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '1.25rem' }}>⏰</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', backgroundColor: 'rgba(167, 139, 250, 0.15)', color: '#a78bfa' }}>
                    {platformHealth.categories.time.filter(c => c.passed).length}/{platformHealth.categories.time.length} PASS
                  </span>
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f8fafc' }}>Time & Solar Engine</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
                  Strict Zero Past Hours Invariant across 5 World Continents & Timezones
                </div>
              </div>

              {/* 5. Games */}
              <div style={{ background: '#0f172a', borderRadius: '12px', padding: '1.25rem', borderLeft: '4px solid #f43f5e', borderTop: '1px solid rgba(255, 255, 255, 0.06)', borderRight: '1px solid rgba(255, 255, 255, 0.06)', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '1.25rem' }}>🎮</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', backgroundColor: 'rgba(244, 63, 94, 0.15)', color: '#f43f5e' }}>
                    {platformHealth.categories.games.filter(c => c.passed).length}/{platformHealth.categories.games.length} PASS
                  </span>
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f8fafc' }}>Geography Games</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
                  195 Sovereign Capitals Exact Coordinates (0.00 km error) & Question Bank
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Probes Table */}
        <div style={{ background: 'rgba(15, 23, 42, 0.6)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '1.5rem', marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
              Autonomous Sentinel Probes ({filteredChecks.length})
            </h2>

            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {(['all', 'clouds', 'winds', 'weather', 'time', 'games'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategoryFilter(cat)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    backgroundColor: activeCategoryFilter === cat ? '#3b82f6' : 'rgba(255, 255, 255, 0.06)',
                    color: activeCategoryFilter === cat ? '#ffffff' : '#94a3b8',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {cat.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filteredChecks.map((check, idx) => (
              <div
                key={idx}
                style={{
                  background: '#0a0f1d',
                  borderRadius: '10px',
                  padding: '1rem 1.25rem',
                  border: `1px solid ${check.passed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.3)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1, minWidth: '280px' }}>
                  <span style={{ fontSize: '1.25rem', marginTop: '2px' }}>
                    {check.passed ? '✅' : '❌'}
                  </span>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.925rem', color: '#f1f5f9' }}>
                        {check.name}
                      </span>
                      <span
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: `${getCategoryColor(check.category)}20`,
                          color: getCategoryColor(check.category),
                          textTransform: 'uppercase',
                        }}
                      >
                        {getDomainIcon(check.category)} {check.category}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px', fontFamily: 'monospace' }}>
                      Target: {check.target}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>
                      {check.details}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '4px 8px', borderRadius: '6px' }}>
                    ⏱️ {check.latencyMs} ms
                  </span>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      padding: '4px 10px',
                      borderRadius: '6px',
                      backgroundColor: check.passed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.2)',
                      color: check.passed ? '#10b981' : '#ef4444',
                    }}
                  >
                    {check.passed ? 'PASS' : 'FAIL'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Collapsible Secondary App Diagnostics (News, Sentry, Engine) */}
        <div style={{ background: 'rgba(15, 23, 42, 0.4)', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.06)', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#f8fafc' }}>
                Secondary App Integrity Suite
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                News telemetry, Sentry error watchdog, and Play Earth quiz engine checks
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={runLegacySuite}
                disabled={isLegacyRunning}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: '#e2e8f0',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: isLegacyRunning ? 'not-allowed' : 'pointer',
                }}
              >
                {isLegacyRunning ? 'Running...' : 'Run Secondary Suite'}
              </button>
              <button
                onClick={() => setShowLegacySuite(!showLegacySuite)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  background: 'transparent',
                  color: '#94a3b8',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                {showLegacySuite ? 'Hide ▲' : 'Show ▼'}
              </button>
            </div>
          </div>

          {showLegacySuite && (
            <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {legacyChecks.length === 0 ? (
                <div style={{ color: '#64748b', fontSize: '0.8rem', padding: '1rem 0' }}>
                  Click &quot;Run Secondary Suite&quot; to audit News and Sentry watchdog.
                </div>
              ) : (
                legacyChecks.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0a0f1d', padding: '8px 12px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.85rem', color: '#e2e8f0' }}>{item.name} — <span style={{ color: '#94a3b8' }}>{item.message}</span></div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: item.status === 'PASS' ? '#10b981' : '#ef4444' }}>{item.status}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
