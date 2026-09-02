'use client';

import React, {
  useRef, useState, useEffect, useCallback,
  forwardRef, useImperativeHandle
} from 'react';
import { Loader2 } from 'lucide-react';
import { VideoControls } from './VideoControls';

// ── Types ──────────────────────────────────────────────────────────
interface VideoPlayerProps {
  /** URL of the video to play */
  src: string;
  /** URL of the WebVTT subtitle track (optional) */
  captionsUrl?: string;
  /** enrollment id — used when saving progress to the API */
  enrollmentId?: string;
  /** lesson id — used when saving progress to the API */
  lessonId?: string;
  /** Called with the current watched seconds whenever progress is saved */
  onProgress?: (watchedSecs: number) => void;
  /** Called once when the video reaches ≥95% of its duration */
  onComplete?: () => void;
  /** Called when the video element fires its 'ended' event */
  onEnded?: () => void;
  /** Whether autoplay-next is currently enabled */
  autoplay?: boolean;
  /** Called when the user toggles the autoplay switch in the controls */
  onAutoplayChange?: (enabled: boolean) => void;
  /** Class name applied to the outermost wrapper */
  className?: string;
}

// ── Constants ─────────────────────────────────────────────────────
const AUTOSAVE_INTERVAL_MS  = 30_000; // save every 30 s
const COMPLETION_THRESHOLD  = 0.95;   // 95 %

// ── Component ─────────────────────────────────────────────────────
export const VideoPlayer = forwardRef<
  HTMLVideoElement,
  VideoPlayerProps
>(function videoPlayer({
  src,
  captionsUrl,
  enrollmentId,
  lessonId,
  onProgress,
  onComplete,
  onEnded,
  autoplay = false,
  onAutoplayChange,
  className = '',
}, ref) {
  // ── Refs ──────────────────────────────────────────────────────
  const videoRef      = useRef<HTMLVideoElement | null>(null);
  useImperativeHandle(ref, () => videoRef.current!, [])
  const wrapperRef    = useRef<HTMLDivElement | null>(null);
  const saveTimerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const completedRef  = useRef(false);        // fire onComplete only once
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── State ─────────────────────────────────────────────────────
  const [playing,      setPlaying]      = useState(false);
  const [currentTime,  setCurrentTime]  = useState(0);
  const [duration,     setDuration]     = useState(0);
  const [volume,       setVolume]       = useState(1);
  const [muted,        setMuted]        = useState(false);
  const [speed,        setSpeed]        = useState(1);
  const [subtitlesOn,  setSubtitlesOn]  = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [buffering,    setBuffering]    = useState(false);
  const [showControls, setShowControls] = useState(true);

  // ── Save progress helper ──────────────────────────────────────
  const saveProgress = useCallback(async () => {
    const vid = videoRef.current;
    if (!vid || !enrollmentId || !lessonId) return;
    const watched = Math.floor(vid.currentTime);
    try {
      // Dynamic import keeps the heavy API client out of the initial bundle
      const { lessonsApi } = await import('@/lib/api/services');
      await lessonsApi.updateProgress(lessonId, enrollmentId, watched);
      onProgress?.(watched);
    } catch {
      // silently swallow — progress save should never crash the player
    }
  }, [enrollmentId, lessonId, onProgress]);

  // ── Auto-save every 30 s ──────────────────────────────────────
  useEffect(() => {
    saveTimerRef.current = setInterval(saveProgress, AUTOSAVE_INTERVAL_MS);
    return () => {
      if (saveTimerRef.current) clearInterval(saveTimerRef.current);
    };
  }, [saveProgress]);

  // ── Sync subtitle track visibility ───────────────────────────
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    const track = vid.textTracks[0];
    if (track) {
      track.mode = subtitlesOn ? 'showing' : 'hidden';
    }
  }, [subtitlesOn]);

  // ── Fullscreen change listener ────────────────────────────────
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // ── Keyboard shortcuts ────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Only act when the wrapper (or something inside it) has focus,
      // OR when no interactive element outside the player is focused.
      const tag = (document.activeElement as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const vid = videoRef.current;
      if (!vid) return;

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          handleMute();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handleSeek(Math.max(0, vid.currentTime - 10));
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleSeek(Math.min(vid.duration || Infinity, vid.currentTime + 10));
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Auto-hide controls after 3 s of inactivity ───────────────
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) {
        setShowControls(false);
      }
    }, 3000);
  }, []);

  useEffect(() => () => {
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
  }, []);

  // ── Video event handlers ──────────────────────────────────────
  const handleTimeUpdate = () => {
    const vid = videoRef.current;
    if (!vid) return;
    setCurrentTime(vid.currentTime);

    // Completion detection
    if (
      !completedRef.current &&
      vid.duration > 0 &&
      vid.currentTime / vid.duration >= COMPLETION_THRESHOLD
    ) {
      completedRef.current = true;
      onComplete?.();
    }
  };

  const handleLoadedMetadata = () => {
    const vid = videoRef.current;
    if (vid) setDuration(vid.duration);
  };

  const handlePlay  = () => setPlaying(true);
  const handlePause = () => {
    setPlaying(false);
    saveProgress(); // save on every pause
  };
  const handleWaiting = () => setBuffering(true);
  const handlePlaying = () => setBuffering(false);
  const handleEnded   = () => {
    setPlaying(false);
    saveProgress();
    onEnded?.();
  };

  // ── Control callbacks (passed to VideoControls) ───────────────
  const togglePlayPause = () => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) { vid.play(); } else { vid.pause(); }
  };

  const handleSeek = (secs: number) => {
    const vid = videoRef.current;
    if (vid) vid.currentTime = secs;
  };

  const handleVolume = (vol: number) => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.volume = vol;
    setVolume(vol);
    if (vol > 0) setMuted(false);
  };

  const handleMute = () => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.muted = !vid.muted;
    setMuted(vid.muted);
  };

  const handleSpeed = (rate: number) => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.playbackRate = rate;
    setSpeed(rate);
  };

  const handleSubtitles = () => setSubtitlesOn((s) => !s);

  const toggleFullscreen = async () => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    if (!document.fullscreenElement) {
      await wrapper.requestFullscreen().catch(() => {});
    } else {
      await document.exitFullscreen().catch(() => {});
    }
  };

  // ── Render ────────────────────────────────────────────────────
  return (
    <div
      ref={wrapperRef}
      className={`relative group bg-black rounded-2xl overflow-hidden select-none ${className}`}
      onMouseMove={resetControlsTimer}
      onMouseEnter={resetControlsTimer}
      // Clicking on the video area (outside controls) toggles play/pause
      onClick={(e) => {
        // Don't fire if a child control was clicked
        if ((e.target as HTMLElement).closest('[data-controls]')) return;
        togglePlayPause();
      }}
      role="region"
      aria-label="Video player"
      // Let the wrapper receive keyboard events
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === ' ') e.preventDefault(); // prevent page scroll
      }}
    >
      {/* The actual <video> element */}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption -- captions handled via <track> */}
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full"
        preload="metadata"
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={handlePlay}
        onPause={handlePause}
        onWaiting={handleWaiting}
        onPlaying={handlePlaying}
        onEnded={handleEnded}
        {...({ controlsList: 'nodownload' } as React.VideoHTMLAttributes<HTMLVideoElement>)}
      >
        {captionsUrl && (
          <track
            kind="subtitles"
            src={captionsUrl}
            default={subtitlesOn}
            label="Subtitles"
          />
        )}
      </video>

      {/* Buffering spinner */}
      {buffering && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Loader2 className="w-10 h-10 text-white/70 animate-spin" />
        </div>
      )}

      {/* Custom controls overlay */}
      <div
        data-controls
        className={`transition-opacity duration-300 ${
          showControls || !playing ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <VideoControls
          playing={playing}
          currentTime={currentTime}
          duration={duration}
          volume={volume}
          muted={muted}
          speed={speed}
          subtitlesOn={subtitlesOn}
          isFullscreen={isFullscreen}
          hasCaptions={!!captionsUrl}
          autoplay={autoplay}
          onAutoplayChange={onAutoplayChange ?? (() => {})}
          onPlayPause={togglePlayPause}
          onSeek={handleSeek}
          onVolume={handleVolume}
          onMute={handleMute}
          onSpeed={handleSpeed}
          onSubtitles={handleSubtitles}
          onFullscreen={toggleFullscreen}
        />
      </div>
    </div>
  );
});

