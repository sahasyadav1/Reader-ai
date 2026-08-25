import { useRef } from 'react';

const DOUBLE_TAP_DELAY_MS = 300;

/**
 * Detects a double-tap (two taps within 300ms) on a plain Pressable/View,
 * per the spec's activation gesture. Kept dependency-free (no gesture
 * handler needed for a simple tap-counting case) so it's easy to drop
 * into any touchable component.
 */
export function useDoubleTap(onDoubleTap: () => void, onSingleTap?: () => void) {
  const lastTap = useRef<number>(0);
  const singleTapTimeout = useRef<ReturnType<typeof setTimeout>>();

  return () => {
    const now = Date.now();
    const gap = now - lastTap.current;

    if (gap < DOUBLE_TAP_DELAY_MS && gap > 0) {
      if (singleTapTimeout.current) clearTimeout(singleTapTimeout.current);
      lastTap.current = 0;
      onDoubleTap();
    } else {
      lastTap.current = now;
      if (onSingleTap) {
        singleTapTimeout.current = setTimeout(() => {
          onSingleTap();
        }, DOUBLE_TAP_DELAY_MS);
      }
    }
  };
}
