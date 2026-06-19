// ============================================================
// MooEarth Live — Mobile Draggable Bottom Sheet Hook
// Google Maps-style sheet with snap states at 20%, 55%, 85%
// Uses Pointer Events (works for both touch AND mouse)
// ============================================================

'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export type SheetSnapState = 'collapsed' | 'half' | 'expanded';

const SNAP_PERCENTS: Record<SheetSnapState, number> = {
  collapsed: 20,
  half: 55,
  expanded: 85,
};

interface UseMobileSheetReturn {
  /** Current snap state name */
  snapState: SheetSnapState;
  /** Current sheet height as a percentage of viewport */
  sheetHeightPercent: number;
  /** Available height for the globe in vh units */
  globeAvailableVh: number;
  /** Set snap state programmatically */
  setSnapState: (state: SheetSnapState) => void;
  /** Pointer event handlers — attach to the ENTIRE drag zone (handle + header) */
  onPointerDown: (e: React.PointerEvent) => void;
  /** Ref to attach to the sheet container */
  sheetRef: React.RefObject<HTMLDivElement | null>;
  /** Whether the sheet is currently being dragged */
  isDragging: boolean;
}

export function useMobileSheet(
  initialState: SheetSnapState = 'collapsed',
  onDismiss?: () => void
): UseMobileSheetReturn {
  const [snapState, setSnapStateInternal] = useState<SheetSnapState>(initialState);
  const [isDragging, setIsDragging] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Drag tracking refs (no React state during drag for 60fps)
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(0);
  const currentDragHeight = useRef(SNAP_PERCENTS[initialState]);
  const isDraggingRef = useRef(false);
  const rafId = useRef<number>(0);
  const activePointerId = useRef<number | null>(null);

  const sheetHeightPercent = SNAP_PERCENTS[snapState];
  const globeAvailableVh = 100 - sheetHeightPercent;

  const setSnapState = useCallback((state: SheetSnapState) => {
    setSnapStateInternal(state);
    currentDragHeight.current = SNAP_PERCENTS[state];
    if (sheetRef.current) {
      sheetRef.current.style.transition = 'height 0.35s cubic-bezier(0.2, 0, 0, 1)';
      sheetRef.current.style.height = `${SNAP_PERCENTS[state]}vh`;
    }
  }, []);

  // Apply height via ref on snap changes (not during drag)
  useEffect(() => {
    if (sheetRef.current && !isDraggingRef.current) {
      sheetRef.current.style.height = `${SNAP_PERCENTS[snapState]}vh`;
    }
  }, [snapState]);

  // ---- Snap logic ----
  const snapToClosest = useCallback((finalHeight: number) => {
    let closestState: SheetSnapState = 'collapsed';
    let closestDist = Infinity;

    (Object.entries(SNAP_PERCENTS) as [SheetSnapState, number][]).forEach(([state, percent]) => {
      const dist = Math.abs(finalHeight - percent);
      if (dist < closestDist) {
        closestDist = dist;
        closestState = state;
      }
    });

    // Dismiss if dragged very low
    if (finalHeight < 10 && onDismiss) {
      onDismiss();
      return;
    }

    // Animate to snap position
    if (sheetRef.current) {
      sheetRef.current.style.transition = 'height 0.35s cubic-bezier(0.2, 0, 0, 1)';
      sheetRef.current.style.height = `${SNAP_PERCENTS[closestState]}vh`;
    }

    currentDragHeight.current = SNAP_PERCENTS[closestState];
    setSnapStateInternal(closestState);
  }, [onDismiss]);

  // We define the move and up handlers inside a useEffect triggered by isDragging.
  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;

      const currentY = e.clientY;
      const deltaY = dragStartY.current - currentY; // positive = dragging up (expanding)
      const viewportHeight = window.innerHeight;
      const deltaPercent = (deltaY / viewportHeight) * 100;
      const newHeight = Math.max(10, Math.min(88, dragStartHeight.current + deltaPercent));

      currentDragHeight.current = newHeight;

      // Update DOM directly via ref — bypass React for 60fps
      if (rafId.current) cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => {
        if (sheetRef.current) {
          sheetRef.current.style.height = `${newHeight}vh`;
        }
      });
    };

    const handlePointerUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      setIsDragging(false);
      activePointerId.current = null;

      if (rafId.current) cancelAnimationFrame(rafId.current);

      snapToClosest(currentDragHeight.current);
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
    document.addEventListener('pointercancel', handlePointerUp);

    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('pointercancel', handlePointerUp);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [isDragging, snapToClosest]);

  // ---- Pointer Down (on drag zone element) ----
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    // Only primary pointer (touch finger or left mouse button)
    if (e.button !== 0) return;

    isDraggingRef.current = true;
    setIsDragging(true);
    dragStartY.current = e.clientY;
    dragStartHeight.current = currentDragHeight.current;
    activePointerId.current = e.pointerId;

    // Capture pointer so we keep receiving events even if finger moves outside element
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    // Remove transition during drag for instant response
    if (sheetRef.current) {
      sheetRef.current.style.transition = 'none';
    }

    e.preventDefault();
  }, []);

  return {
    snapState,
    sheetHeightPercent,
    globeAvailableVh,
    setSnapState,
    onPointerDown,
    sheetRef,
    isDragging,
  };
}
