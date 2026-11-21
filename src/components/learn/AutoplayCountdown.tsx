'use client';

import { useEffect, useRef, useState } from 'react';
import { X, SkipForward } from 'lucide-react';

interface AutoplayCountdownProps {
  /** Title of the next lecture */
  nextTitle: string;
  /** Seconds to count down before auto-navigating (default: 5) */
  seconds?: number;
  /** Called when the countdown reaches 0 */
  onComplete: () => void;
  /** Called when the user clicks Cancel */
  onCancel: () => void;
}

export function AutoplayCountdown({
  nextTitle,
  seconds = 5,
  onComplete,
  onCancel,
}: AutoplayCountdownProps) {
  const [remaining, setRemaining] = useState(seconds);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (remaining <= 0) {
      onCompleteRef.current();
      return;
    }
    const id = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(id);
  }, [remaining]);

  /** Arc maths for the SVG countdown ring */
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const progress = remaining / seconds;
  const dashOffset = circumference * (1 - progress);

  return (
    <div
      className="absolute inset-0 z-20 flex items-end justify-center pb-16"
      aria-live="polite"
      aria-label={`Autoplay next lecture in ${remaining} seconds`}
    >
      {/* Frosted backdrop strip */}
      <div className="mx-4 w-full max-w-sm rounded-2xl bg-black/70 backdrop-blur-sm px-4 py-3 flex items-center gap-3 shadow-xl border border-white/10">
        {/* Countdown ring */}
        <div className="relative flex-shrink-0 w-12 h-12">
          <svg className="w-12 h-12 -rotate-90" viewBox="0 0 56 56" aria-hidden="true">
            {/* Track */}
            <circle
              cx="28"
              cy="28"
              r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="3"
            />
            {/* Progress */}
            <circle
              cx="28"
              cy="28"
              r={radius}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          {/* Number */}
          <span className="absolute inset-0 flex items-center justify-center text-white text-sm font-bold tabular-nums">
            {remaining}
          </span>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-white/70 text-[11px] uppercase tracking-wider font-medium">
            Up next
          </p>
          <p className="text-white text-sm font-semibold truncate leading-snug mt-0.5">
            {nextTitle}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Play now */}
          <button
            onClick={onComplete}
            className="flex items-center gap-1.5 rounded-full bg-saffron-500 hover:bg-saffron-400 active:bg-saffron-600 text-white text-xs font-medium px-3 py-1.5 transition-colors"
            aria-label="Play next lecture now"
          >
            <SkipForward className="w-3.5 h-3.5" />
            Play
          </button>
          {/* Cancel */}
          <button
            onClick={onCancel}
            className="p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Cancel autoplay"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default AutoplayCountdown;
