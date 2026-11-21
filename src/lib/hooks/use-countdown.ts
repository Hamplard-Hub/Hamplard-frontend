'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/** Default number of seconds at which a countdown switches to its warning state. */
export const COUNTDOWN_WARNING_SECONDS = 30;

export interface UseCountdownOptions {
  /**
   * Countdown duration in seconds. `null`, `undefined` or any non-positive
   * value disables the timer, so callers that do not opt in keep the exact
   * behaviour they had before.
   */
  seconds?: number | null;
  /** Called exactly once when the countdown reaches zero. */
  onExpire?: () => void;
  /** Pauses/resumes the countdown. Defaults to `true`. */
  enabled?: boolean;
  /** Threshold (seconds) for `isWarning`. Defaults to 30. */
  warningSeconds?: number;
}

export interface UseCountdownResult {
  /** Seconds remaining, floored at zero. `0` when the timer is disabled. */
  secondsLeft: number;
  /** `true` while at most `warningSeconds` remain and the timer is running. */
  isWarning: boolean;
  /** `true` once the countdown has reached zero. Always `false` when disabled. */
  isExpired: boolean;
  /** `true` when a positive duration was configured. */
  isActive: boolean;
  /** Restart the countdown from its configured duration. */
  restart: () => void;
}

function normalizeSeconds(seconds?: number | null): number | null {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds <= 0) {
    return null;
  }
  return Math.floor(seconds);
}

/**
 * Small countdown hook used by the quiz components.
 *
 * Kept intentionally independent from `CountdownTimer` (which is date based and
 * renders an offer expiry) because assessments need a second-accurate,
 * restartable timer with a sub-30s warning state.
 */
export function useCountdown({
  seconds,
  onExpire,
  enabled = true,
  warningSeconds = COUNTDOWN_WARNING_SECONDS,
}: UseCountdownOptions = {}): UseCountdownResult {
  const total = normalizeSeconds(seconds);
  const [secondsLeft, setSecondsLeft] = useState<number>(total ?? 0);

  const onExpireRef = useRef(onExpire);
  const hasExpiredRef = useRef(false);

  // Keep the latest callback without tearing down the interval on every render.
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  // Re-arm whenever the configured duration changes (including enable/disable).
  useEffect(() => {
    hasExpiredRef.current = false;
    setSecondsLeft(total ?? 0);
  }, [total]);

  const restart = useCallback(() => {
    hasExpiredRef.current = false;
    setSecondsLeft(total ?? 0);
  }, [total]);

  useEffect(() => {
    if (total === null || !enabled || secondsLeft <= 0) return;

    const interval = window.setInterval(() => {
      setSecondsLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [total, enabled, secondsLeft]);

  const isExpired = total !== null && secondsLeft <= 0;

  useEffect(() => {
    if (!isExpired || !enabled || hasExpiredRef.current) return;
    hasExpiredRef.current = true;
    onExpireRef.current?.();
  }, [isExpired, enabled]);

  return {
    secondsLeft: total === null ? 0 : secondsLeft,
    isWarning:
      total !== null &&
      enabled &&
      secondsLeft > 0 &&
      secondsLeft <= warningSeconds,
    isExpired,
    isActive: total !== null,
    restart,
  };
}
