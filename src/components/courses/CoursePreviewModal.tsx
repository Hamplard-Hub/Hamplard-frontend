'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X, Volume2, VolumeX, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CoursePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  courseTitle: string;
  instructorName?: string;
  /** Optional static thumbnail shown when autoplay is blocked or reduced motion is set. */
  posterUrl?: string;
}

/**
 * CoursePreviewModal
 *
 * A modal dialog that displays a free preview video for a course.
 * Features:
 * - Overlay backdrop that dismisses modal on click
 * - Close button (X) in top-right
 * - Keyboard support (ESC to close)
 * - Focus trap to keep focus within modal when open
 * - Responsive: full-screen on mobile, centered on desktop
 * - HTML5 video player with controls
 * - Muted autoplay preview on open with a visible unmute control
 * - Pauses when the modal closes or loses focus
 * - Falls back to a static thumbnail with a manual play button if autoplay is blocked
 * - Respects prefers-reduced-motion by not autoplaying
 */
export function CoursePreviewModal({
  isOpen,
  onClose,
  videoUrl,
  courseTitle,
  instructorName,
  posterUrl,
}: CoursePreviewModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isMuted, setIsMuted] = useState(true);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Autoplay muted preview on open, respecting prefers-reduced-motion.
  // Falls back to a static thumbnail if the browser blocks autoplay.
  useEffect(() => {
    if (!isOpen) return;

    const video = videoRef.current;
    if (!video) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setAutoplayBlocked(true);
      return;
    }

    setAutoplayBlocked(false);
    video.muted = true;
    setIsMuted(true);

    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
        // Autoplay was blocked by the browser — show the static fallback.
        setAutoplayBlocked(true);
      });
    }
  }, [isOpen, videoUrl]);

  // Pause video when modal closes
  useEffect(() => {
    if (!isOpen && videoRef.current) {
      videoRef.current.pause();
    }
  }, [isOpen]);

  // Pause when the modal loses focus (e.g. user switches tabs/windows)
  useEffect(() => {
    if (!isOpen) return;

    const handleBlur = () => {
      videoRef.current?.pause();
    };

    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, [isOpen]);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const nextMuted = !video.muted;
    video.muted = nextMuted;
    setIsMuted(nextMuted);
  }, []);

  const handleManualPlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setAutoplayBlocked(false);
    video.muted = true;
    setIsMuted(true);
    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => setAutoplayBlocked(true));
    }
  }, []);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close if clicking directly on backdrop, not on modal content
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      {/* Portal backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Modal dialog */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="preview-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="w-full h-full md:w-auto md:h-auto md:max-w-4xl md:rounded-2xl md:overflow-hidden bg-black flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-ink-900">
            <div className="flex-1 min-w-0">
              <h2 id="preview-title" className="text-white font-semibold truncate">
                Preview: {courseTitle}
              </h2>
              {instructorName && (
                <p className="text-xs text-ink-300 mt-0.5 truncate">
                  by {instructorName}
                </p>
              )}
            </div>

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close preview modal"
              className={cn(
                'ml-4 flex-shrink-0 rounded-lg p-2',
                'text-ink-300 hover:text-white hover:bg-ink-800',
                'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-hamplard-primary',
                'transition-colors',
              )}
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* Video container */}
          <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
            <video
              ref={videoRef}
              src={videoUrl}
              controls
              muted
              autoPlay
              playsInline
              preload="metadata"
              poster={posterUrl ?? ''}
              className="w-full h-full"
              controlsList="nodownload"
            >
              <track kind="captions" />
              Your browser does not support the video tag.
            </video>

            {/* Static fallback when autoplay is blocked or reduced motion is set */}
            {autoplayBlocked && (
              <div className="absolute inset-0 flex items-center justify-center bg-black">
                {posterUrl ? (
                  <img
                    src={posterUrl}
                    alt={`${courseTitle} preview thumbnail`}
                    className="absolute inset-0 w-full h-full object-cover opacity-70"
                  />
                ) : null}
                <button
                  type="button"
                  onClick={handleManualPlay}
                  aria-label="Play preview video"
                  className={cn(
                    'relative z-10 flex items-center justify-center gap-2 rounded-full',
                    'bg-hamplard-primary px-5 py-3 text-white font-medium',
                    'hover:bg-hamplard-primary/90 transition-colors',
                    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-hamplard-primary',
                  )}
                >
                  <Play className="w-5 h-5" aria-hidden="true" />
                  Play preview
                </button>
              </div>
            )}

            {/* Unmute / mute control */}
            {!autoplayBlocked && (
              <button
                type="button"
                onClick={toggleMute}
                aria-label={isMuted ? 'Unmute preview' : 'Mute preview'}
                aria-pressed={!isMuted}
                className={cn(
                  'absolute bottom-4 right-4 z-10 flex items-center gap-2 rounded-lg px-3 py-2',
                  'bg-black/60 text-white hover:bg-black/80 transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-hamplard-primary',
                )}
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <Volume2 className="w-4 h-4" aria-hidden="true" />
                )}
                <span className="text-xs font-medium">
                  {isMuted ? 'Unmute' : 'Mute'}
                </span>
              </button>
            )}
          </div>

          {/* Info footer */}
          <div className="px-4 py-3 bg-ink-900 border-t border-ink-700">
            <p className="text-xs text-ink-300">
              This is a preview lecture. <span className="text-hamplard-lilac font-medium">Enroll</span> to access the full course.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default CoursePreviewModal;
