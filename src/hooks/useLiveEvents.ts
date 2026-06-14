import { useState, useEffect } from 'react';
import { WorldEvent } from '@/types';

export interface ApiStatus {
  newsActive: boolean;
  footballActive: boolean;
  earthCastActive: boolean;
}

export function useLiveEvents() {
  const [events, setEvents] = useState<WorldEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState<ApiStatus>({
    newsActive: false,
    footballActive: false,
    earthCastActive: false,
  });

  useEffect(() => {
    let isMounted = true;

    async function fetchEvents() {
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

    // Initial fetch
    fetchEvents();

    // Poll every 60 seconds
    const intervalId = setInterval(fetchEvents, 60000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  return { events, isLoading, apiStatus };
}

