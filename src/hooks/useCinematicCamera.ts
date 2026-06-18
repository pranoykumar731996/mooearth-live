import { useEffect, useRef } from 'react';
import { WorldEvent } from '@/types';

interface CameraControls {
  flyTo: (pov: { lat: number; lng: number; altitude: number }) => void;
  pauseRotation: () => void;
  resumeRotation: () => void;
}

export function useCinematicCamera(
  events: WorldEvent[],
  controls: CameraControls,
  introDone: boolean
) {
  const processedGoalIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!introDone) return;

    events.forEach(event => {
      if (event.footballData && event.footballData.goals && event.footballData.goals.length > 0) {
        // Assume the last goal in the array is the most recent
        const latestGoal = event.footballData.goals[event.footballData.goals.length - 1];
        const goalId = `${event.id}-goal-${latestGoal.time}`;

        if (!processedGoalIds.current.has(goalId)) {
          // New goal detected!
          processedGoalIds.current.add(goalId);

          // Fly the camera to the country
          controls.flyTo({ lat: event.lat, lng: event.lng, altitude: 0.6 });
          controls.pauseRotation();

          // After 8 seconds, zoom back out slightly and resume rotation
          setTimeout(() => {
            controls.flyTo({ lat: event.lat, lng: event.lng, altitude: 1.2 });
            controls.resumeRotation();
          }, 8000);
        }
      }
    });
  }, [events, controls, introDone]);
}
