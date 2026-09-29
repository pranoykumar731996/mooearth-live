import { useState, useEffect, useRef } from 'react';
import { WorldEvent, EventCategory } from '@/types';

export interface ApiStatus {
  newsActive: boolean;
  footballActive: boolean;
  earthCastActive: boolean;
  freshness?: Record<string, {
    lastRetrieved: string;
    ageMinutes: number;
    status: 'Live' | 'Recent' | 'Stale';
    apiResponseAgeSeconds: number;
  }>;
}

export function useLiveEvents(isFocusMode: boolean = false, activeCategory?: EventCategory | null) {
  const [events, setEvents] = useState<WorldEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState<ApiStatus>({
    newsActive: false,
    footballActive: false,
    earthCastActive: false,
  });

  const categoryCacheRef = useRef<Record<string, { events: WorldEvent[]; status: ApiStatus; timestamp: number }>>({});
  const pendingRefreshRef = useRef(false);
  const hasForceRefreshedRef = useRef(false);
  const lastEventsHashRef = useRef<string | null>(null);

  const categoryKey = activeCategory || 'all';

  useEffect(() => {
    let isMounted = true;

    async function fetchEvents(forceRefresh = false) {
      if (isFocusMode) {
        pendingRefreshRef.current = true;
        return;
      }

      // If we have cached events (< 60s) for this category and not forcing refresh, apply them immediately
      const cached = categoryCacheRef.current[categoryKey];
      if (cached && !forceRefresh && (Date.now() - cached.timestamp < 60000)) {
        setEvents(cached.events);
        setApiStatus(cached.status);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(events.length === 0);
        const catParam = activeCategory ? `&category=${activeCategory}` : '';
        const refreshParam = forceRefresh ? '&refresh=true' : '';
        const response = await fetch(`/api/events?t=${Date.now()}${catParam}${refreshParam}`);
        if (!response.ok) throw new Error('Failed to fetch live events');
        
        const data = await response.json();
        
        if (isMounted) {
          const newEvents = data.events || [];
          const newEventsStr = JSON.stringify(newEvents);
          if (newEventsStr !== lastEventsHashRef.current) {
            setEvents(newEvents);
            lastEventsHashRef.current = newEventsStr;
          }
          if (data.status) {
            setApiStatus(data.status);
            
            if (data.status.freshness && !forceRefresh && !hasForceRefreshedRef.current) {
              const values = Object.values(data.status.freshness) as any[];
              const hasStale = values.some((val: any) => val.status === 'Stale');
              if (hasStale) {
                console.log('useLiveEvents: Stale category detected, forcing refresh...');
                hasForceRefreshedRef.current = true;
                // Re-fetch immediately with refresh=true
                fetchEvents(true);
              }
            }
          }

          // Cache this category's events
          categoryCacheRef.current[categoryKey] = {
            events: newEvents,
            status: data.status || apiStatus,
            timestamp: Date.now(),
          };

          setIsLoading(false);
          pendingRefreshRef.current = false;
        }
      } catch (error) {
        console.error('Error fetching live events:', error);
        if (isMounted) {
          setApiStatus({
            newsActive: false,
            footballActive: false,
            earthCastActive: false,
          });
          setIsLoading(false);
        }
      }
    }

    if (!isFocusMode) {
      fetchEvents();
      
      const intervalId = setInterval(() => {
        // Reset the force-refresh flag every polling cycle so we can try again if still stale
        hasForceRefreshedRef.current = false;
        fetchEvents();
      }, 60000);

      return () => {
        isMounted = false;
        clearInterval(intervalId);
      };
    } else {
      return () => {
        isMounted = false;
      };
    }
  }, [isFocusMode, activeCategory, categoryKey]);

  return { events, isLoading, apiStatus };
}

