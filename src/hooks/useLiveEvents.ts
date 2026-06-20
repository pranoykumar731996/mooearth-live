import { useState, useEffect, useRef } from 'react';
import { WorldEvent } from '@/types';

export interface ApiStatus {
  newsActive: boolean;
  footballActive: boolean;
  earthCastActive: boolean;
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

  useEffect(() => {
    let isMounted = true;

    async function fetchEvents() {
      if (isFocusMode) {
        pendingRefreshRef.current = true;
        return;
      }
      try {
        const response = await fetch(`/api/events?t=${Date.now()}`);
        if (!response.ok) throw new Error('Failed to fetch live events');
        
        const data = await response.json();
        
        if (isMounted) {
          setEvents(data.events || []);
          if (data.status) {
            setApiStatus(data.status);
          }
          setIsLoading(false);
          pendingRefreshRef.current = false;
        }
      } catch (error) {
        console.error('Error fetching live events:', error);
        if (isMounted) {
          // Keep events empty, but mark API statuses as inactive
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
      // If we exited Focus Mode and have a pending refresh, or have no events loaded, refresh immediately
      if (pendingRefreshRef.current || events.length === 0) {
        fetchEvents();
      }
      
      // Poll every 60 seconds
      const intervalId = setInterval(fetchEvents, 60000);

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

