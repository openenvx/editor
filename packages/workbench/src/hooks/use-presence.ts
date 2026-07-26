import { useEffect, useState } from 'react';

/** Matches overlay-surface exit duration (shadcn animate-out default). */
export const OVERLAY_EXIT_MS = 150;

function exitDelay(ms: number): number {
  if (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    return 0;
  }
  return ms;
}

/**
 * Keep a surface mounted through its CSS exit animation.
 * Returns `present` (should render) and `state` for `data-state`.
 */
export function usePresence(open: boolean, exitMs = OVERLAY_EXIT_MS) {
  const [present, setPresent] = useState(open);
  const [state, setState] = useState<'open' | 'closed'>(
    open ? 'open' : 'closed'
  );

  useEffect(() => {
    if (open) {
      setPresent(true);
      setState('open');
      return;
    }

    setState('closed');
    const id = window.setTimeout(() => {
      setPresent(false);
    }, exitDelay(exitMs));
    return () => window.clearTimeout(id);
  }, [open, exitMs]);

  return { present, state } as const;
}
