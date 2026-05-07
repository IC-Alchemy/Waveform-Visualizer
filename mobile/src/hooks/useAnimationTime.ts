import { useEffect, useRef, useState } from "react";

export function useAnimationTime(isActive = true) {
  const [time, setTime] = useState(0);
  const lastNowRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const tick = (now: number) => {
      const lastNow = lastNowRef.current ?? now;
      const dt = Math.min((now - lastNow) * 0.001, 0.05);
      lastNowRef.current = now;
      setTime((current) => current + dt);
      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
      lastNowRef.current = null;
    };
  }, [isActive]);

  return time;
}
