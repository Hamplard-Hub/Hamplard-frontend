'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface CountdownTimerProps {
  expiresAt: Date;
  label?: string;
  onExpire?: () => void;
  className?: string;
}

interface TimeUnits {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const CountdownTimer = React.forwardRef<HTMLDivElement, CountdownTimerProps>(
  ({ expiresAt, label = 'Offer expires in', onExpire, className }, ref) => {
    const [time, setTime] = useState<TimeUnits>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [isExpired, setIsExpired] = useState(false);
    const [mounted, setMounted] = useState(false);
    const onExpireRef = useRef(onExpire);
    const lastExpiryRef = useRef<number | null>(null);
    const hasExpiredRef = useRef(false);
    const expiryTime = expiresAt.getTime();

    onExpireRef.current = onExpire;

    useEffect(() => {
      setMounted(true);
      if (lastExpiryRef.current !== expiryTime) {
        lastExpiryRef.current = expiryTime;
        hasExpiredRef.current = false;
      }

      let interval: ReturnType<typeof setInterval> | undefined;
      let timeout: ReturnType<typeof setTimeout> | undefined;

      const expire = () => {
        if (hasExpiredRef.current) return;
        hasExpiredRef.current = true;
        if (interval !== undefined) clearInterval(interval);
        if (timeout !== undefined) clearTimeout(timeout);
        setIsExpired(true);
        setTime({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        onExpireRef.current?.();
      };

      const calculateTimeRemaining = () => {
        const difference = expiryTime - Date.now();

        if (difference <= 0) {
          expire();
          return;
        }

        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);

        setTime({ days, hours, minutes, seconds });
        setIsExpired(false);
      };

      // Calculate immediately on mount
      calculateTimeRemaining();

      const remaining = expiryTime - Date.now();
      if (remaining > 0) {
        interval = setInterval(calculateTimeRemaining, 1000);
        timeout = setTimeout(expire, remaining);
      }

      return () => {
        if (interval !== undefined) clearInterval(interval);
        if (timeout !== undefined) clearTimeout(timeout);
      };
    }, [expiryTime]);

    if (!mounted) {
      return null;
    }

    return (
      <div
        ref={ref}
        role="timer"
        aria-live="off"
        className={cn('flex flex-col items-center gap-2', className)}
      >
        {label && !isExpired && (
          <p className="text-sm font-medium text-ink-600">{label}</p>
        )}

        {isExpired ? (
          <p className="text-lg font-semibold text-rose-600">Offer ended</p>
        ) : (
          <div className="flex gap-1 md:gap-2">
            <TimeUnit value={time.days} label="Days" />
            <Separator />
            <TimeUnit value={time.hours} label="Hours" />
            <Separator />
            <TimeUnit value={time.minutes} label="Minutes" />
            <Separator />
            <TimeUnit value={time.seconds} label="Seconds" />
          </div>
        )}
      </div>
    );
  },
);

CountdownTimer.displayName = 'CountdownTimer';

interface TimeUnitProps {
  value: number;
  label: string;
}

const TimeUnit = ({ value, label }: TimeUnitProps) => (
  <div className="flex flex-col items-center">
    <span className="text-2xl md:text-3xl font-bold text-hamplard-primary">
      {String(value).padStart(2, '0')}
    </span>
    <span className="text-xs md:text-sm font-medium text-ink-500 uppercase">{label}</span>
  </div>
);

const Separator = () => (
  <div className="flex items-center justify-center pb-3 md:pb-4">
    <span className="text-xl md:text-2xl font-bold text-ink-300">:</span>
  </div>
);

export { CountdownTimer };
export type { CountdownTimerProps };
