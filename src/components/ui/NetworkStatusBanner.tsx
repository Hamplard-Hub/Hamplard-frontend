'use client';

import { useEffect, useState } from 'react';
import { WifiOff, X } from 'lucide-react';
import { useToastContext } from '@/components/ui/ToastProvider';

export function NetworkStatusBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);
  const toast = useToastContext();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Set initial status if already offline on mount
    if (!navigator.onLine) {
      setIsOffline(true);
      setWasOffline(true);
      pauseAllVideos();
    }

    const handleOffline = () => {
      setIsOffline(true);
      setWasOffline(true);
      setIsDismissed(false);
      pauseAllVideos();
    };

    const handleOnline = () => {
      setIsOffline(false);
      if (wasOffline) {
        toast.success({
          title: 'Back online!',
          description: 'Internet connection restored.',
          duration: 3000,
        });
        // Auto-dismiss offline notice state
        const timer = setTimeout(() => {
          setWasOffline(false);
          setIsDismissed(false);
        }, 3000);
        return () => clearTimeout(timer);
      }
    };

    function pauseAllVideos() {
      try {
        const videos = document.querySelectorAll('video');
        videos.forEach((video) => {
          if (!video.paused) {
            video.pause();
          }
        });
      } catch {
        // Ignore video query errors in non-DOM environments
      }
    }

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [toast, wasOffline]);

  if (!isOffline || isDismissed) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="assertive"
      className="sticky top-0 z-[100] flex items-center justify-between border-b border-rose-200 bg-rose-600 px-4 py-2.5 text-white shadow-md transition-all duration-300"
    >
      <div className="mx-auto flex items-center gap-2 text-sm font-medium">
        <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>You are offline. Some features may be unavailable.</span>
      </div>
      <button
        type="button"
        className="rounded-full p-1 text-white/80 transition hover:bg-rose-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
        aria-label="Dismiss offline banner"
        onClick={() => setIsDismissed(true)}
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
