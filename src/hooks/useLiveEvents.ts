import { useState, useEffect } from 'react';
import { WorldEvent } from '@/types';
import { demoEvents } from '@/data/events';

export function useLiveEvents() {
  const [events, setEvents] = useState<WorldEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchEvents() {
      try {
        const response = await fetch('/api/events');
        if (!response.ok) throw new Error('Failed to fetch live events');
        
        const data = await response.json();
        
        if (isMounted) {
          setEvents(data.events);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error fetching live events:', error);
        if (isMounted) {
          // Fallback if the API fails entirely
          if (events.length === 0) setEvents(demoEvents);
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

  return { events, isLoading };
}
