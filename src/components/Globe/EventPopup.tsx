// ============================================================
// MooEarth Live — Event Popup (Glassmorphism Card)
// ============================================================

'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WorldEvent } from '@/types';
import { CATEGORY_MAP } from '@/lib/constants';
import FootballMatchCenter from './FootballMatchCenter';
import { CountryFlag } from '@/components/UI/CountryFlag';
import { auth } from '@/lib/firebase';
import { useLanguage } from '@/contexts/LanguageContext';
import { getLocalizedCountryName } from '@/lib/i18n';
import { getCycloneCategoryLabel, getRichterCategoryLabel, getFocalDepthLabel } from '@/components/Globe/WeatherLayers';
import {
  SavedPlace,
  isPlaceSavedLocal,
  saveGuestPlace,
  removeGuestPlace,
  getGuestSavedPlaces,
  updateUserProfile,
} from '@/services/personalizationService';

interface EventPopupProps {
  event: WorldEvent | null;
  onClose: () => void;
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// Simple helper to get a flag emoji for common demo countries
function getFlag(country: string): React.ReactNode {
  const flags: Record<string, string> = {
    'Japan': '🇯🇵', 'India': '🇮🇳', 'United Kingdom': '🇬🇧',
    'United States': '🇺🇸', 'Brazil': '🇧🇷', 'Mexico': '🇲🇽',
    'Spain': '🇪🇸', 'Australia': '🇦🇺', 'South Africa': '🇿🇦',
    'Singapore': '🇸🇬'
  };
  const emoji = flags[country] || '🌍';
  return <CountryFlag flag={emoji} className="w-5 h-3.5 object-cover rounded-[2px] shadow-[0_1px_2px_rgba(0,0,0,0.2)]" />;
}

function getFlagChar(country: string): string {
  const flags: Record<string, string> = {
    'Japan': '🇯🇵', 'India': '🇮🇳', 'United Kingdom': '🇬🇧',
    'United States': '🇺🇸', 'Brazil': '🇧🇷', 'Mexico': '🇲🇽',
    'Spain': '🇪🇸', 'Australia': '🇦🇺', 'South Africa': '🇿🇦',
    'Singapore': '🇸🇬'
  };
  return flags[country] || '🌍';
}

export default function EventPopup({ event, onClose }: EventPopupProps) {
  const { locale, dict, t } = useLanguage();
  const placeId = useMemo(() => {
    if (!event) return null;
    const cleanId = event.id || event.title?.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 50);
    return `article_${cleanId}`;
  }, [event]);

  const [isSaved, setIsSaved] = useState<boolean>(false);

  useEffect(() => {
    if (!placeId) return;
    setIsSaved(isPlaceSavedLocal(placeId));

    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.key === 'saved_places') {
        setIsSaved(isPlaceSavedLocal(placeId));
      }
    };
    window.addEventListener('mooearth_personalization_update', handleSync);
    return () => window.removeEventListener('mooearth_personalization_update', handleSync);
  }, [placeId]);

  const handleToggleBookmark = () => {
    if (!event || !placeId) return;
    if (isSaved) {
      removeGuestPlace(placeId);
      if (auth?.currentUser?.uid) {
        const currentSaved = getGuestSavedPlaces();
        updateUserProfile(auth.currentUser.uid, { savedPlaces: currentSaved });
      }
      setIsSaved(false);
    } else {
      const cleanTitle = (event.title || '').replace(/<[^>]*>/g, '').trim();
      const place: SavedPlace = {
        id: placeId,
        type: 'article',
        name: cleanTitle,
        country: event.country,
        category: event.category,
        url: event.source,
        coordinates: {
          lat: Number(event.lat) || 0,
          lng: Number(event.lng) || 0,
        },
        flag: getFlagChar(event.country),
        savedAt: Date.now(),
        articleId: event.id,
      };
      saveGuestPlace(place);
      if (auth?.currentUser?.uid) {
        const currentSaved = getGuestSavedPlaces();
        updateUserProfile(auth.currentUser.uid, { savedPlaces: currentSaved });
      }
      setIsSaved(true);
    }
  };

  const handleShare = async () => {
    if (!event) return;
    const cleanTitle = (event.title || '').replace(/<[^>]*>/g, '').trim();
    const url = event.source || (typeof window !== 'undefined' ? window.location.href : '');
    try {
      if (navigator.share) {
        await navigator.share({
          title: cleanTitle,
          text: `Read "${cleanTitle}" on MooEarth Live!`,
          url,
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      }
    } catch {}
  };
  // Keyboard Escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <AnimatePresence>
      {event && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer z-0"
            onClick={onClose}
          />

          <motion.div
            id="event-popup"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-[90vw] max-w-[460px] rounded-3xl p-6 glass pointer-events-auto relative z-10"
            style={{
              background: 'linear-gradient(135deg, rgba(10,10,20,0.95) 0%, rgba(20,20,35,0.85) 100%)',
              boxShadow: `0 0 80px ${CATEGORY_MAP[event.category]?.glowColor || 'rgba(0,229,255,0.5)'}, 0 25px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)`,
              maxHeight: '70vh',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Close button */}
            <button
              id="event-popup-close"
              onClick={onClose}
              className="absolute top-4 right-4 w-9 h-9 rounded-full
                         flex items-center justify-center
                         bg-white/10 hover:bg-white/20 text-white/70 hover:text-white
                         transition-all duration-200 cursor-pointer z-[60] border border-white/10"
              aria-label="Close popup"
              title="Close popup (Esc)"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Country & Category */}
            <div className="flex flex-col gap-1 mb-4 shrink-0 pr-8">
              <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                <span>{dict.eventPopup?.discoveredNation || 'Country'}:</span>
                <span className="text-white font-extrabold mr-1.5">{getLocalizedCountryName(event.country, locale)}</span>
                <span className="text-white/20">|</span>
                <span className="ml-1.5">Category:</span>
                <span className="text-white font-extrabold flex items-center gap-1">
                  <span>{CATEGORY_MAP[event.category]?.emoji || '📰'}</span>
                  <span>{CATEGORY_MAP[event.category]?.label || event.category}</span>
                </span>
              </div>
              <span className="text-[10px] text-white/40 font-medium" suppressHydrationWarning>{formatRelativeTime(event.publishedAt)}</span>
            </div>

            {/* Scrollable Container */}
            <div 
              className="pr-1 mb-5 scrollbar-thin space-y-4"
              style={{
                flex: '1 1 auto',
                overflowY: 'auto',
                minHeight: 0
              }}
            >
              {event.category === 'football' ? (
                <FootballMatchCenter event={event} />
              ) : (
                <>
                  {/* Title */}
                  <h2 className="text-2xl font-bold text-white leading-tight pr-8 tracking-tight">
                    {event.title}
                  </h2>

                  {/* Location */}
                  <div className="flex items-center gap-2 text-sm text-white/50">
                    <span className="text-base">{getFlag(event.country)}</span>
                    <span className="font-medium text-white/70">{event.city}, {getLocalizedCountryName(event.country, locale)}</span>
                  </div>

                  {/* Scientific Telemetry Box if available */}
                  {event.planetaryTelemetry && (
                    <div className="grid grid-cols-2 gap-2 my-2 p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 text-xs">
                      {typeof event.planetaryTelemetry.magnitude === 'number' && (
                        <div className="flex flex-col">
                          <span className="text-white/40 uppercase tracking-wider text-[10px]">
                            {event.category === 'seismic' ? 'Richter Magnitude' : 'Intensity'}
                          </span>
                          <span className="font-black text-rose-400 text-sm">
                            {event.category === 'seismic' ? `M ${event.planetaryTelemetry.magnitude.toFixed(1)}` : `${event.planetaryTelemetry.magnitude}`}
                          </span>
                          {event.category === 'seismic' && (
                            <span className="text-[10px] text-rose-300/80 font-medium leading-tight mt-0.5">
                              {getRichterCategoryLabel(event.planetaryTelemetry.magnitude)}
                            </span>
                          )}
                        </div>
                      )}
                      {typeof event.planetaryTelemetry.depthKm === 'number' && (
                        <div className="flex flex-col">
                          <span className="text-white/40 uppercase tracking-wider text-[10px]">Focal Depth</span>
                          <span className="font-black text-cyan-300 text-sm">{event.planetaryTelemetry.depthKm.toFixed(1)} km</span>
                          <span className="text-[10px] text-cyan-200/70 font-medium leading-tight mt-0.5">
                            {getFocalDepthLabel(event.planetaryTelemetry.depthKm)}
                          </span>
                        </div>
                      )}
                      {event.planetaryTelemetry.tsunamiWarning !== undefined && (
                        <div className="flex flex-col">
                          <span className="text-white/40 uppercase tracking-wider text-[10px]">Tsunami Status</span>
                          <span className={`font-bold text-xs mt-0.5 flex items-center gap-1 ${event.planetaryTelemetry.tsunamiWarning ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {event.planetaryTelemetry.tsunamiWarning ? '⚠️ NOAA Advisory Active' : '✅ No Alert'}
                          </span>
                        </div>
                      )}
                      {typeof event.planetaryTelemetry.kpIndex === 'number' && (
                        <div className="flex flex-col">
                          <span className="text-white/40 uppercase tracking-wider text-[10px]">Planetary Kp Index</span>
                          <span className="font-black text-purple-400 text-sm">Kp {event.planetaryTelemetry.kpIndex}</span>
                        </div>
                      )}
                      {typeof event.planetaryTelemetry.windSpeedKph === 'number' && (
                        <div className="flex flex-col">
                          <span className="text-white/40 uppercase tracking-wider text-[10px]">
                            {event.planetaryTelemetry.stormWarningType ? 'Peak Wind Gusts' : 'Sustained Winds'}
                          </span>
                          <span className="font-black text-cyan-300 text-sm">
                            {event.planetaryTelemetry.windSpeedKph} km/h{' '}
                            <span className="text-white/40 text-[10px] font-normal">
                              ({Math.round(event.planetaryTelemetry.windSpeedKph / 1.852)} kts)
                            </span>
                          </span>
                        </div>
                      )}
                      {event.planetaryTelemetry.stormWarningType ? (
                        <div className="flex flex-col">
                          <span className="text-white/40 uppercase tracking-wider text-[10px]">Warning Type</span>
                          <span className="font-extrabold text-amber-300 text-xs flex items-center gap-1">
                            <span>{event.planetaryTelemetry.stormWarningType === 'tornado' ? '🌪️ Tornado Warning' : '⛈️ Severe Thunderstorm'}</span>
                          </span>
                        </div>
                      ) : (
                        typeof event.planetaryTelemetry.windSpeedKph === 'number' && (
                          <div className="flex flex-col">
                            <span className="text-white/40 uppercase tracking-wider text-[10px]">Storm Category</span>
                            <span className="font-extrabold text-amber-300 text-xs flex items-center gap-1">
                              <span>🌀</span>
                              <span>{getCycloneCategoryLabel(event.planetaryTelemetry.windSpeedKph)}</span>
                            </span>
                          </div>
                        )
                      )}
                      {typeof event.planetaryTelemetry.lightningStrikeRatePerMin === 'number' && (
                        <div className="flex flex-col">
                          <span className="text-white/40 uppercase tracking-wider text-[10px]">Lightning Activity</span>
                          <span className="font-black text-amber-400 text-sm flex items-center gap-1">
                            <span>⚡</span>
                            <span>{event.planetaryTelemetry.lightningStrikeRatePerMin} / min</span>
                          </span>
                          {typeof event.planetaryTelemetry.peakCurrentKa === 'number' && (
                            <span className="text-[10px] text-amber-200/70 font-medium">
                              Peak {event.planetaryTelemetry.peakCurrentKa > 0 ? `+${event.planetaryTelemetry.peakCurrentKa}` : event.planetaryTelemetry.peakCurrentKa} kA
                            </span>
                          )}
                        </div>
                      )}
                      {typeof event.planetaryTelemetry.radarReflectivityDbz === 'number' && (
                        <div className="flex flex-col">
                          <span className="text-white/40 uppercase tracking-wider text-[10px]">Doppler Echo</span>
                          <span className="font-black text-rose-400 text-sm flex items-center gap-1">
                            <span>📡</span>
                            <span>{event.planetaryTelemetry.radarReflectivityDbz} dBZ</span>
                          </span>
                          {typeof event.planetaryTelemetry.hailSizeMm === 'number' && (
                            <span className="text-[10px] text-cyan-200/70 font-medium">
                              Hail: {event.planetaryTelemetry.hailSizeMm} mm
                            </span>
                          )}
                        </div>
                      )}
                      {event.planetaryTelemetry.sensorSource && (
                        <div className="col-span-2 pt-1 border-t border-white/5 flex items-center justify-between text-[10px] text-white/50">
                          <span>Observation Network:</span>
                          <span className="font-semibold text-white/70">{event.planetaryTelemetry.sensorSource}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Summary Briefing */}
                  <div className="rounded-2xl p-5 border border-white/5 relative overflow-hidden"
                    style={{ background: 'rgba(0,229,255,0.03)' }}
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyan-400 to-blue-600" />
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">
                        {event.planetaryTelemetry ? 'Scientific Briefing' : t('articleViewer.aiSummaryBadge', 'AI Summary')}
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    </div>
                    <p className="text-sm text-white/80 leading-relaxed font-medium">
                      {event.summary}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Actions - Locked at the bottom */}
            {event.category !== 'football' && (
              <div className="flex items-center gap-3 shrink-0 pt-1">
                <a
                  id="event-popup-source"
                  href={event.url || (event.source.startsWith('http') ? event.source : 'https://earthquake.usgs.gov')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold
                             bg-gradient-to-r from-cyan-500/20 to-blue-500/20
                             border border-cyan-500/30 text-cyan-400
                             hover:border-cyan-400/50 hover:shadow-[0_0_25px_rgba(0,229,255,0.2)]
                             transition-all duration-300 group"
                >
                  <span>{dict.eventPopup?.readCoverage || 'Read Source'}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:translate-x-1 transition-transform">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </a>
                
                {/* Bookmark */}
                <button
                  onClick={handleToggleBookmark}
                  className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                    isSaved
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                      : 'bg-white/5 hover:bg-white/10 border-white/5 text-white/60 hover:text-white'
                  }`}
                  title={isSaved ? (dict.eventPopup?.saved || 'Saved') : (dict.eventPopup?.saveStory || 'Save story to bookmarks')}
                  aria-label={isSaved ? 'Remove bookmark' : (dict.eventPopup?.saveStory || 'Bookmark story')}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                </button>
                
                {/* Share */}
                <button
                  onClick={handleShare}
                  className="w-12 h-12 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-center text-white/60 hover:text-white transition-colors cursor-pointer"
                  title={dict.eventPopup?.share || 'Share story'}
                  aria-label={dict.eventPopup?.share || 'Share story'}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
