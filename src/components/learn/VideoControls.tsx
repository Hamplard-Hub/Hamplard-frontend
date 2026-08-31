'use client';

import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize, Subtitles,
} from 'lucide-react';
import { cn, formatDuration } from '@/lib/utils';

interface VideoControlsProps {
  playing: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  speed: number;
  subtitlesOn: boolean;
  isFullscreen: boolean;
  hasCaptions: boolean;
  /** Whether autoplay is currently enabled */
  autoplay: boolean;
  /** Called when the user toggles the autoplay switch */
  onAutoplayChange: (enabled: boolean) => void;
  onPlayPause: () => void;
  onSeek: (secs: number) => void;
  onVolume: (vol: number) => void;
  onMute: () => void;
  onSpeed: (rate: number) => void;
  onSubtitles: () => void;
  onFullscreen: () => void;
}

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export function VideoControls({
  playing, currentTime, duration, volume, muted, speed,
  subtitlesOn, isFullscreen, hasCaptions,
  autoplay, onAutoplayChange,
  onPlayPause, onSeek, onVolume, onMute, onSpeed, onSubtitles, onFullscreen,
}: VideoControlsProps) {
  return (
    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 pt-6 pb-2 flex flex-col gap-1.5">
      {/* Seek bar */}
      <input
        type="range"
        min={0}
        max={duration || 0}
        step={0.5}
        value={currentTime}
        onChange={(e) => onSeek(parseFloat(e.target.value))}
        className="w-full h-1 accent-saffron-500 cursor-pointer"
        aria-label="Seek"
      />

      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap">
        {/* Play / Pause */}
        <button
          onClick={onPlayPause}
          className="text-white hover:text-saffron-300 transition-colors p-1"
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing
            ? <Pause className="w-4 h-4 fill-current" />
            : <Play  className="w-4 h-4 fill-current" />
          }
        </button>

        {/* Volume */}
        <button
          onClick={onMute}
          className="text-white hover:text-saffron-300 transition-colors p-1"
          aria-label={muted ? 'Unmute' : 'Mute'}
        >
          {muted || volume === 0
            ? <VolumeX className="w-4 h-4" />
            : <Volume2 className="w-4 h-4" />
          }
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={muted ? 0 : volume}
          onChange={(e) => onVolume(parseFloat(e.target.value))}
          className="hidden md:block w-16 h-1 accent-saffron-500 cursor-pointer"
          aria-label="Volume"
        />

        {/* Time */}
        <span className="hidden sm:block text-white text-[10px] tabular-nums ml-1 select-none">
          {formatDuration(Math.floor(currentTime))} / {formatDuration(Math.floor(duration))}
        </span>

        <div className="flex-1" />

        {/* Speed */}
        <select
          value={speed}
          onChange={(e) => onSpeed(parseFloat(e.target.value))}
          className="hidden md:block bg-transparent text-white text-xs cursor-pointer outline-none border border-white/20 rounded px-1 py-0.5 hover:border-white/50 transition-colors"
          aria-label="Playback speed"
        >
          {SPEEDS.map((s) => (
            <option key={s} value={s} className="bg-ink-900 text-white">
              {s === 1 ? '1×' : `${s}×`}
            </option>
          ))}
        </select>

        {/* Subtitles */}
        <button
          onClick={onSubtitles}
          disabled={!hasCaptions}
          title={!hasCaptions ? 'No captions available' : subtitlesOn ? 'Hide captions' : 'Show captions'}
          className={cn(
            'p-1 transition-colors',
            hasCaptions
              ? subtitlesOn
                ? 'text-saffron-300'
                : 'text-white hover:text-saffron-300'
              : 'text-white/30 cursor-not-allowed',
          )}
          aria-label="Subtitles"
        >
          <Subtitles className="w-4 h-4" />
        </button>

        {/* Autoplay toggle */}
        <button
          onClick={() => onAutoplayChange(!autoplay)}
          className={cn(
            'flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border transition-colors',
            autoplay
              ? 'border-saffron-400 text-saffron-300 bg-saffron-500/20 hover:bg-saffron-500/30'
              : 'border-white/20 text-white/60 hover:text-white hover:border-white/40',
          )}
          aria-pressed={autoplay}
          aria-label={autoplay ? 'Autoplay on — click to turn off' : 'Autoplay off — click to turn on'}
          title="Autoplay next lecture"
        >
          {/* Mini toggle pill */}
          <span
            className={cn(
              'relative inline-flex h-3 w-5 rounded-full transition-colors duration-200',
              autoplay ? 'bg-saffron-500' : 'bg-white/20',
            )}
            aria-hidden="true"
          >
            <span
              className={cn(
                'absolute top-0.5 h-2 w-2 rounded-full bg-white shadow transition-transform duration-200',
                autoplay ? 'translate-x-2.5' : 'translate-x-0.5',
              )}
            />
          </span>
          Autoplay
        </button>

        {/* Fullscreen */}
        <button
          onClick={onFullscreen}
          className="text-white hover:text-saffron-300 transition-colors p-1"
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          {isFullscreen
            ? <Minimize className="w-4 h-4" />
            : <Maximize className="w-4 h-4" />
          }
        </button>
      </div>
    </div>
  );
}
