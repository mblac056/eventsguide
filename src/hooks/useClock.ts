import { useEffect, useState } from 'react';

/** Returns the current time, refreshed on an interval (default 20s). */
export function useClock(intervalMs = 20_000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
