import { useEffect, useRef, useState } from "react";

export function useAnimationTime(active: boolean) {
  const [time, setTime] = useState(0);
  const lastRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const tick = (now: number) => {
      if (active) {
        const last = lastRef.current ?? now;
        const dt = Math.min((now - last) * 0.001, 0.05);
        setTime((value) => value + dt);
      }
      lastRef.current = now;
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [active]);

  return time;
}
