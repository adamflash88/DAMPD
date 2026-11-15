import { useEffect, useState } from 'react';

/** Current time as ISO, refreshed every `intervalMs` (null = don't tick). */
export function useNow(intervalMs: number | null): string {
  const [now, setNow] = useState(() => new Date().toISOString());
  useEffect(() => {
    if (intervalMs === null) return;
    const t = setInterval(() => setNow(new Date().toISOString()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}
