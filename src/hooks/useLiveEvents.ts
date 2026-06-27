import { useState, useEffect, useRef } from 'react';
import { WorldEvent } from '@/types';

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

export function useLiveEvents(isFocusMode: boolean = false) {
  const [events, setEvents] = useState<WorldEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState<ApiStatus>({
    newsActive: false,
    footballActive: false,
    earthCastActive: false,
  });

  const pendingRefreshRef = useRef(false);
  const hasForceRefreshedRef = useRef(false);
  const lastEventsHashRef = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchEvents(forceRefresh = false) {
      if (isFocusMode) {
        pendingRefreshRef.current = true;
        return;
      }
      try {
        const refreshParam = forceRefresh ? '&refresh=true' : '';
        const response = await fetch(`/api/events?t=${Date.now()}${refreshParam}`);
        if (!response.ok) throw new Error('Failed to fetch live events');
        
        const data = await response.json();
        
        if (isMounted) {
          const newEventsStr = JSON.stringify(data.events || []);
          if (newEventsStr !== lastEventsHashRef.current) {
            setEvents(data.events || []);
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
      if (pendingRefreshRef.current || events.length === 0) {
        fetchEvents();
      }
      
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
  }, [isFocusMode, events.length]);

  return { events, isLoading, apiStatus };
}

