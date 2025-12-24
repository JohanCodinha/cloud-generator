import { useEffect, useRef, useCallback } from 'react';
import { calculateGlobalOffset, calculateCirclePosition, calculateAnimatedRadius } from '../utils/geometry';

/**
 * Hook to manage animation loop for circles
 */
export const useAnimation = (config, setCircles, setGlobalAnimOffset) => {
  const requestRef = useRef();
  const timeRef = useRef(0);

  const animate = useCallback(() => {
    if (config.animate) {
      timeRef.current += 0.016 * config.globalSpeed;

      const globalOffset = calculateGlobalOffset(timeRef.current, config);
      setGlobalAnimOffset(globalOffset);

      setCircles(prevCircles => {
        // Pre-calculate radius
        const sizedCircles = prevCircles.map(c => {
          const newR = calculateAnimatedRadius(c, timeRef.current, config);
          return { ...c, currentR: newR };
        });

        // Calculate positions
        return sizedCircles.map(c => {
          const pos = calculateCirclePosition(c, timeRef.current, config, globalOffset);
          return { ...c, x: pos.x, y: pos.y };
        });
      });
    }
    requestRef.current = requestAnimationFrame(animate);
  }, [config, setCircles, setGlobalAnimOffset]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [animate]);

  // Sync Global Offset when config changes (to update visuals even when paused)
  useEffect(() => {
    const offset = calculateGlobalOffset(timeRef.current, config);
    setGlobalAnimOffset(offset);
  }, [config, setGlobalAnimOffset]);

  return { timeRef };
};
