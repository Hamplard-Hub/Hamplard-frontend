'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LightboxImage {
  src: string;
  alt?: string;
  title?: string;
  description?: string;
}

export interface LightboxProps {
  images: LightboxImage[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

export function Lightbox({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
}: LightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchDeltaX, setTouchDeltaX] = useState<number>(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  // Sync index when initialIndex changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setScale(1);
      triggerRef.current = document.activeElement as HTMLElement | null;
    } else {
      triggerRef.current?.focus();
    }
  }, [isOpen, initialIndex]);

  const handleNext = useCallback(() => {
    setScale(1);
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const handlePrev = useCallback(() => {
    setScale(1);
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const handleZoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev + 0.5, 3.5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((prev) => Math.max(prev - 0.5, 1));
  }, []);

  const handleResetZoom = useCallback(() => {
    setScale(1);
  }, []);

  const handleToggleZoom = useCallback(() => {
    setScale((prev) => (prev > 1.2 ? 1 : 2));
  }, []);

  // Keyboard navigation & lock body scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === '0') {
        e.preventDefault();
        handleResetZoom();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, handleNext, handlePrev, handleZoomIn, handleZoomOut, handleResetZoom, onClose]);

  // Touch Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (scale > 1) return; // Don't swipe while zoomed in
    setTouchStartX(e.touches[0].clientX);
    setTouchDeltaX(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null || scale > 1) return;
    setTouchDeltaX(e.touches[0].clientX - touchStartX);
  };

  const handleTouchEnd = () => {
    if (touchStartX === null || scale > 1) return;
    if (touchDeltaX > 50) {
      handlePrev();
    } else if (touchDeltaX < -50) {
      handleNext();
    }
    setTouchStartX(null);
    setTouchDeltaX(0);
  };

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex];

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Image gallery lightbox"
      className="fixed inset-0 z-50 flex flex-col bg-black/95 text-white backdrop-blur-md transition-opacity duration-300 select-none"
    >
      {/* Top bar: counter & controls */}
      <div className="flex items-center justify-between px-4 py-3 sm:px-6 bg-gradient-to-b from-black/80 to-transparent z-10">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono tracking-wider text-slate-300 bg-white/10 px-2.5 py-1 rounded-full">
            {currentIndex + 1} / {images.length}
          </span>
          {currentImage.title && (
            <h3 className="text-sm font-medium text-slate-200 truncate max-w-xs sm:max-w-md">
              {currentImage.title}
            </h3>
          )}
        </div>

        {/* Zoom and close controls */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center bg-white/10 rounded-lg p-1 gap-1">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={scale <= 1}
              className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              title="Zoom Out (-)"
              aria-label="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-slate-300 px-1">
              {Math.round(scale * 100)}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={scale >= 3.5}
              className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              title="Zoom In (+)"
              aria-label="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            {scale !== 1 && (
              <button
                type="button"
                onClick={handleResetZoom}
                className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                title="Reset Zoom (0)"
                aria-label="Reset Zoom"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 text-slate-200 hover:text-white hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
            title="Close Lightbox (Esc)"
            aria-label="Close Lightbox"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div
        className="relative flex-1 flex items-center justify-center overflow-hidden p-4 sm:p-8 cursor-grab active:cursor-grabbing"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={handleToggleZoom}
      >
        {/* Navigation arrow Left */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-4 z-10 p-3 rounded-full bg-black/40 text-white/80 hover:text-white hover:bg-black/70 border border-white/10 backdrop-blur-sm transition-all focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Displayed Image */}
        <div
          className="transition-transform duration-200 ease-out flex items-center justify-center max-w-full max-h-full"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentImage.src}
            alt={currentImage.alt || currentImage.title || `Gallery image ${currentIndex + 1}`}
            className="max-h-[75vh] max-w-[90vw] object-contain rounded-lg shadow-2xl transition-all"
            draggable={false}
          />
        </div>

        {/* Navigation arrow Right */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-4 z-10 p-3 rounded-full bg-black/40 text-white/80 hover:text-white hover:bg-black/70 border border-white/10 backdrop-blur-sm transition-all focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Next image"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Caption & Thumbnail bar */}
      <div className="bg-gradient-to-t from-black/90 to-transparent p-4 sm:px-6 flex flex-col items-center gap-3">
        {currentImage.description && (
          <p className="text-xs text-slate-300 max-w-xl text-center leading-relaxed">
            {currentImage.description}
          </p>
        )}

        {/* Thumbnail Strip */}
        {images.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto max-w-full py-1 px-2 scrollbar-none">
            {images.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setScale(1);
                  setCurrentIndex(idx);
                }}
                className={cn(
                  'relative h-12 w-12 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all',
                  idx === currentIndex
                    ? 'border-indigo-500 scale-105 shadow-md shadow-indigo-500/20'
                    : 'border-white/20 opacity-60 hover:opacity-100 hover:border-white/50',
                )}
                aria-label={`Jump to image ${idx + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.src}
                  alt={img.alt || `Thumbnail ${idx + 1}`}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export interface StepGalleryProps {
  images: LightboxImage[];
  className?: string;
}

export function StepImageGallery({ images, className = '' }: StepGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);

  if (!images || images.length === 0) return null;

  return (
    <>
      <div className={cn('grid grid-cols-2 sm:grid-cols-3 gap-2.5 my-3', className)}>
        {images.map((img, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setSelectedIdx(idx);
              setLightboxOpen(true);
            }}
            className="group relative aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label={`View full-size image: ${img.title || `Image ${idx + 1}`}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.src}
              alt={img.alt || img.title || `Gallery preview ${idx + 1}`}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <span className="p-2 rounded-full bg-black/60 text-white backdrop-blur-sm shadow-sm">
                <Maximize2 className="w-4 h-4" />
              </span>
            </div>
          </button>
        ))}
      </div>

      <Lightbox
        images={images}
        initialIndex={selectedIdx}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}

export default Lightbox;
