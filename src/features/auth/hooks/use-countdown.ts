import { useEffect, useState } from 'react';

/** Whole seconds left until `until` (epoch ms), ticking once a second; 0 once it has passed. */
export function useCountdown(until: number): number {
  const [now, setNow] = useState(() => Date.now());
  const remaining = Math.max(0, Math.ceil((until - now) / 1000));

  useEffect(() => {
    if (remaining === 0) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [remaining]);

  return remaining;
}
