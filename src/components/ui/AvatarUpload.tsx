'use client';

/**
 * AvatarUpload
 *
 * No external crop library — uses a plain drag-to-pan / pinch-to-zoom
 * canvas crop UI built from scratch with pointer events.
 *
 * Flow:
 *  1. User clicks "Change photo" → file picker opens
 *  2. After file selection the crop UI (canvas) appears
 *  3. User drags to position and zooms (slider, pinch, or scroll wheel),
 *     then clicks "Crop". "Cancel" discards the file and keeps the old avatar.
 *  4. The exact 1:1 region is exported (≤ EXPORT_MAX_SIZE px) and previewed
 *  5. User clicks "Save" → XHR upload with progress bar
 *  6. On success the auth-store is patched → Header avatar updates instantly
 */

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { Camera, X, Check, Loader2, ZoomIn, ZoomOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { uploadsApi, usersApi } from '@/lib/api/services';
import { useAuthStore } from '@/lib/hooks/use-auth-store';

/* ─── constants ─────────────────────────────────────────────────────────── */

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ACCEPT_ATTR    = 'image/jpeg,image/png,image/webp';
const ACCEPT_TYPES   = new Set(['image/jpeg', 'image/png', 'image/webp']);

/** Size (px) of the square crop canvas's drawing buffer */
const CANVAS_SIZE = 320;
/** Max edge (px) of the exported square crop; smaller crops are never upscaled */
export const EXPORT_MAX_SIZE = 512;
/** Zoom is a multiplier on the "cover" scale that just fills the crop area */
export const MIN_ZOOM = 1;
export const MAX_ZOOM = 4;
/** Pixels moved per arrow-key press when panning with the keyboard */
const KEYBOARD_PAN_STEP = 10;

/* ─── helpers ────────────────────────────────────────────────────────────── */

/** Clamp a value between min and max */
function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

interface Offset { x: number; y: number }

/**
 * Keep the scaled image covering the whole crop square, so no empty edges
 * ever end up in the saved avatar.
 */
export function clampOffset(
  offset: Offset,
  imgWidth: number,
  imgHeight: number,
  scale: number,
  canvasSize: number = CANVAS_SIZE,
): Offset {
  const minX = Math.min(canvasSize - imgWidth  * scale, 0);
  const minY = Math.min(canvasSize - imgHeight * scale, 0);
  return { x: clamp(offset.x, minX, 0), y: clamp(offset.y, minY, 0) };
}

/**
 * Return the offset that keeps the image point under (anchorX, anchorY)
 * fixed when the scale changes from `prevScale` to `nextScale`.
 */
export function zoomAround(
  offset: Offset,
  prevScale: number,
  nextScale: number,
  anchorX: number,
  anchorY: number,
): Offset {
  const ratio = nextScale / prevScale;
  return {
    x: anchorX - (anchorX - offset.x) * ratio,
    y: anchorY - (anchorY - offset.y) * ratio,
  };
}

/**
 * Map the visible crop square back onto the source image. `size` is the
 * edge length (in source pixels) of the 1:1 region the user selected.
 */
export function getSourceCropRect(
  offset: Offset,
  scale: number,
  canvasSize: number = CANVAS_SIZE,
) {
  return {
    x: -offset.x / scale,
    y: -offset.y / scale,
    size: canvasSize / scale,
  };
}

/**
 * Render the image translated + scaled with a circular guide overlay.
 * The whole square is what gets saved; the circle shows how it will look
 * once rendered as a round avatar.
 */
function drawCropPreview(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  offsetX: number,
  offsetY: number,
  scale: number,
  canvasSize: number,
) {
  ctx.clearRect(0, 0, canvasSize, canvasSize);
  ctx.drawImage(img, offsetX, offsetY, img.naturalWidth * scale, img.naturalHeight * scale);

  // Dim everything outside the circle
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.beginPath();
  ctx.rect(0, 0, canvasSize, canvasSize);
  ctx.arc(canvasSize / 2, canvasSize / 2, canvasSize / 2 - 2, 0, Math.PI * 2, true);
  ctx.fill();
  ctx.restore();

  // Circle border
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth   = 2;
  ctx.beginPath();
  ctx.arc(canvasSize / 2, canvasSize / 2, canvasSize / 2 - 2, 0, Math.PI * 2);
  ctx.stroke();
}

/**
 * Export exactly the selected square region to a JPEG Blob, resized down to
 * at most EXPORT_MAX_SIZE px per edge.
 */
function exportCrop(
  img: HTMLImageElement,
  offset: Offset,
  scale: number,
  canvasSize: number,
): Promise<Blob> {
  const rect = getSourceCropRect(offset, scale, canvasSize);
  const outSize = Math.max(1, Math.round(Math.min(EXPORT_MAX_SIZE, rect.size)));

  const offCanvas = document.createElement('canvas');
  offCanvas.width  = outSize;
  offCanvas.height = outSize;

  const ctx = offCanvas.getContext('2d');
  if (!ctx) return Promise.reject(new Error('Canvas not supported'));

  // JPEG has no alpha: flatten transparent PNG/WebP pixels onto white
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, outSize, outSize);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, rect.x, rect.y, rect.size, rect.size, 0, 0, outSize, outSize);

  return new Promise<Blob>((resolve, reject) => {
    offCanvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Canvas export failed'))),
      'image/jpeg',
      0.9,
    );
  });
}

/* ─── types ─────────────────────────────────────────────────────────────── */

interface Props {
  currentAvatarUrl?: string | null;
  userName?: string | null;
  onSaved?: (url: string) => void;
}

/* ─── component ─────────────────────────────────────────────────────────── */

export function AvatarUpload({ currentAvatarUrl, userName, onSaved }: Props) {
  const updateUser = useAuthStore((s) => s.updateUser);
  const inputRef   = useRef<HTMLInputElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);

  /* ── loaded image ── */
  const imgRef    = useRef<HTMLImageElement | null>(null);
  const rawSrcRef = useRef<string | null>(null);

  /* ── crop pan/zoom state ── */
  const offsetRef    = useRef<Offset>({ x: 0, y: 0 });
  /** Scale at which the image just covers the crop square (zoom = 1) */
  const baseScaleRef = useRef(1);
  const zoomRef      = useRef(1);
  const dragRef      = useRef<{ startX: number; startY: number; ox: number; oy: number } | null>(null);
  /** Active pointers, used to detect two-finger pinch gestures */
  const pointersRef  = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchRef     = useRef<{ startDist: number; startZoom: number } | null>(null);

  /* ── react state ── */
  const [showCropper, setShowCropper]   = useState(false);
  const [zoom, setZoom]                 = useState(1);
  const [previewSrc, setPreviewSrc]     = useState<string | null>(null);
  const [croppedBlob, setCroppedBlob]   = useState<Blob | null>(null);
  const [progress, setProgress]         = useState(0);
  const [uploading, setUploading]       = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [saved, setSaved]               = useState(false);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const img    = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const scale = baseScaleRef.current * zoomRef.current;
    drawCropPreview(ctx, img, offsetRef.current.x, offsetRef.current.y, scale, CANVAS_SIZE);
  }, []);

  /* ── redraw when zoom changes or the cropper (re)mounts its canvas ── */
  useLayoutEffect(() => {
    if (showCropper) redraw();
  }, [zoom, showCropper, redraw]);

  /* ── release object URLs on unmount ── */
  const previewSrcRef = useRef<string | null>(null);
  previewSrcRef.current = previewSrc;
  useEffect(() => () => {
    if (rawSrcRef.current) URL.revokeObjectURL(rawSrcRef.current);
    if (previewSrcRef.current) URL.revokeObjectURL(previewSrcRef.current);
  }, []);

  /**
   * Apply a new zoom level, keeping the point under (anchorX, anchorY)
   * (canvas coordinates) fixed, and re-clamp so the crop stays covered.
   */
  const applyZoom = useCallback((nextZoom: number, anchorX = CANVAS_SIZE / 2, anchorY = CANVAS_SIZE / 2) => {
    const img = imgRef.current;
    if (!img) return;
    const z = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);
    const prevScale = baseScaleRef.current * zoomRef.current;
    const nextScale = baseScaleRef.current * z;
    offsetRef.current = clampOffset(
      zoomAround(offsetRef.current, prevScale, nextScale, anchorX, anchorY),
      img.naturalWidth,
      img.naturalHeight,
      nextScale,
    );
    zoomRef.current = z;
    setZoom(z);
    redraw();
  }, [redraw]);

  /** Convert a client (CSS px) point to canvas-buffer coordinates */
  function toCanvasPoint(clientX: number, clientY: number) {
    const canvas = canvasRef.current;
    const rect = canvas?.getBoundingClientRect();
    if (!rect || !rect.width || !rect.height) return { x: clientX, y: clientY };
    return {
      x: ((clientX - rect.left) * CANVAS_SIZE) / rect.width,
      y: ((clientY - rect.top) * CANVAS_SIZE) / rect.height,
    };
  }

  /** CSS px → canvas px ratio (the canvas shrinks on narrow screens) */
  function cssToCanvasRatio() {
    const width = canvasRef.current?.getBoundingClientRect().width;
    return width ? CANVAS_SIZE / width : 1;
  }

  function panBy(dx: number, dy: number, from: Offset = offsetRef.current) {
    const img = imgRef.current;
    if (!img) return;
    offsetRef.current = clampOffset(
      { x: from.x + dx, y: from.y + dy },
      img.naturalWidth,
      img.naturalHeight,
      baseScaleRef.current * zoomRef.current,
    );
    redraw();
  }

  /* ── file selection ── */
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    if (!ACCEPT_TYPES.has(file.type)) {
      setError('Only JPEG, PNG, and WebP images are supported.');
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError('Image must be 5 MB or smaller.');
      return;
    }

    setError(null);
    setSaved(false);
    setPreviewSrc(null);
    setCroppedBlob(null);

    if (rawSrcRef.current) URL.revokeObjectURL(rawSrcRef.current);
    const src = URL.createObjectURL(file);
    rawSrcRef.current = src;

    const img = new Image();
    img.onload = () => {
      imgRef.current = img;

      // Centre the image at the scale where it just covers the crop square
      const coverScale = Math.max(CANVAS_SIZE / img.naturalWidth, CANVAS_SIZE / img.naturalHeight);
      baseScaleRef.current = coverScale;
      zoomRef.current = MIN_ZOOM;

      offsetRef.current = {
        x: (CANVAS_SIZE - img.naturalWidth  * coverScale) / 2,
        y: (CANVAS_SIZE - img.naturalHeight * coverScale) / 2,
      };

      setZoom(MIN_ZOOM);
      setShowCropper(true);
    };
    img.onerror = () => setError('Failed to load image.');
    img.src = src;
  }

  /* ── canvas pointer events (drag to pan, two-finger pinch to zoom) ── */
  function pinchDistance() {
    const [p1, p2] = Array.from(pointersRef.current.values());
    return Math.hypot(p2.x - p1.x, p2.y - p1.y);
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    canvasRef.current?.setPointerCapture?.(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointersRef.current.size === 2) {
      dragRef.current = null;
      pinchRef.current = { startDist: pinchDistance(), startZoom: zoomRef.current };
      return;
    }

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      ox: offsetRef.current.x,
      oy: offsetRef.current.y,
    };
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!pointersRef.current.has(e.pointerId)) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pinchRef.current && pointersRef.current.size === 2) {
      const { startDist, startZoom } = pinchRef.current;
      if (!startDist) return;
      const [p1, p2] = Array.from(pointersRef.current.values());
      const mid = toCanvasPoint((p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
      applyZoom(startZoom * (pinchDistance() / startDist), mid.x, mid.y);
      return;
    }

    if (!dragRef.current) return;
    const ratio = cssToCanvasRatio();
    panBy(
      (e.clientX - dragRef.current.startX) * ratio,
      (e.clientY - dragRef.current.startY) * ratio,
      { x: dragRef.current.ox, y: dragRef.current.oy },
    );
  }

  function handlePointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = null;
    dragRef.current = null;
  }

  function handleWheel(e: React.WheelEvent<HTMLCanvasElement>) {
    const point = toCanvasPoint(e.clientX, e.clientY);
    applyZoom(zoomRef.current * (e.deltaY < 0 ? 1.1 : 1 / 1.1), point.x, point.y);
  }

  function handleCanvasKeyDown(e: React.KeyboardEvent<HTMLCanvasElement>) {
    const moves: Record<string, [number, number]> = {
      ArrowLeft:  [KEYBOARD_PAN_STEP, 0],
      ArrowRight: [-KEYBOARD_PAN_STEP, 0],
      ArrowUp:    [0, KEYBOARD_PAN_STEP],
      ArrowDown:  [0, -KEYBOARD_PAN_STEP],
    };
    if (moves[e.key]) {
      e.preventDefault();
      panBy(...moves[e.key]);
    } else if (e.key === '+' || e.key === '=') {
      e.preventDefault();
      applyZoom(zoomRef.current + 0.1);
    } else if (e.key === '-') {
      e.preventDefault();
      applyZoom(zoomRef.current - 0.1);
    }
  }

  /* ── "Crop" button ── */
  async function handleCrop() {
    const img = imgRef.current;
    if (!img) return;
    setError(null);
    try {
      const blob = await exportCrop(
        img,
        offsetRef.current,
        baseScaleRef.current * zoomRef.current,
        CANVAS_SIZE,
      );
      setCroppedBlob(blob);
      const prev = URL.createObjectURL(blob);
      setPreviewSrc(prev);
      setShowCropper(false);

      // Cleanup raw src
      if (rawSrcRef.current) {
        URL.revokeObjectURL(rawSrcRef.current);
        rawSrcRef.current = null;
      }
      imgRef.current = null;
    } catch {
      setError('Crop failed — please try a different image.');
    }
  }

  /* ── "Cancel crop" button ── */
  function handleCancelCrop() {
    setShowCropper(false);
    pointersRef.current.clear();
    pinchRef.current = null;
    dragRef.current = null;
    if (rawSrcRef.current) { URL.revokeObjectURL(rawSrcRef.current); rawSrcRef.current = null; }
    imgRef.current = null;
  }

  /* ── "Save" button ── */
  async function handleSave() {
    if (!croppedBlob) return;
    setError(null);
    setProgress(0);
    setUploading(true);
    try {
      const file = new File([croppedBlob], 'avatar.jpg', { type: 'image/jpeg' });
      const { url } = await uploadsApi.uploadAvatar(file, setProgress);

      // Patch auth store → Header re-renders immediately
      updateUser({ avatarUrl: url });

      if (previewSrc) URL.revokeObjectURL(previewSrc);
      setPreviewSrc(null);
      setCroppedBlob(null);
      setSaved(true);
      onSaved?.(url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }

  /* ── discard preview ── */
  function handleDiscard() {
    if (previewSrc) URL.revokeObjectURL(previewSrc);
    setPreviewSrc(null);
    setCroppedBlob(null);
    setProgress(0);
    setError(null);
  }

  const displayUrl = previewSrc ?? currentAvatarUrl ?? null;
  const initials   = userName?.charAt(0)?.toUpperCase() ?? 'U';

  /* ─── render ─────────────────────────────────────────────────────────── */
  return (
    <div className="flex flex-col items-center gap-4 w-full">

      {/* ── Avatar ring ── */}
      <div className="relative">
        <div className="h-24 w-24 rounded-full overflow-hidden ring-4 ring-white shadow-md bg-hamplard-lilac flex items-center justify-center">
          {displayUrl ? (
            <img src={displayUrl} alt="Avatar preview" className="h-full w-full object-cover" />
          ) : (
            <span className="text-3xl font-bold text-hamplard-primary">{initials}</span>
          )}
        </div>

        <button
          type="button"
          onClick={() => { setSaved(false); inputRef.current?.click(); }}
          aria-label="Change profile photo"
          className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-hamplard-primary text-white shadow ring-2 ring-white transition hover:bg-hamplard-mid"
        >
          <Camera className="h-3.5 w-3.5" />
        </button>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_ATTR}
          className="sr-only"
          onChange={handleFileChange}
          aria-hidden="true"
        />
      </div>

      {/* ── Canvas crop UI ── */}
      {showCropper && (
        <div
          role="dialog"
          aria-label="Crop profile photo"
          onKeyDown={(e) => {
            if (e.key === 'Escape') handleCancelCrop();
          }}
          className="w-full rounded-2xl overflow-hidden border border-ink-100 bg-[#111] shadow-lg"
        >

          {/* Canvas */}
          <div className="flex justify-center p-4 bg-[#111]">
            <canvas
              ref={canvasRef}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              tabIndex={0}
              aria-label="Crop area. Drag or use arrow keys to reposition; pinch, scroll, or plus and minus keys to zoom."
              className="aspect-square w-full cursor-grab touch-none active:cursor-grabbing focus:outline-none focus-visible:ring-2 focus-visible:ring-hamplard-primary"
              style={{ maxWidth: CANVAS_SIZE }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onWheel={handleWheel}
              onKeyDown={handleCanvasKeyDown}
            />
          </div>

          {/* Zoom slider */}
          <div className="flex items-center gap-3 bg-[#1a1a2e] px-5 py-3">
            <ZoomOut className="h-4 w-4 text-white/50 shrink-0" />
            <input
              type="range"
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={0.01}
              value={zoom}
              onChange={(e) => applyZoom(Number(e.target.value))}
              className="flex-1 accent-hamplard-primary"
              aria-label="Zoom"
              aria-valuetext={`${Math.round(zoom * 100)}%`}
            />
            <ZoomIn className="h-4 w-4 text-white/50 shrink-0" />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 bg-[#1a1a2e] border-t border-white/10 px-5 py-3">
            <button
              type="button"
              onClick={handleCancelCrop}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition"
            >
              <X className="h-3.5 w-3.5" />
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCrop}
              className="inline-flex items-center gap-1.5 rounded-lg bg-hamplard-primary px-4 py-1.5 text-xs font-semibold text-white hover:bg-hamplard-mid transition"
            >
              <Check className="h-3.5 w-3.5" />
              Crop
            </button>
          </div>
        </div>
      )}

      {/* ── Preview + save ── */}
      {croppedBlob && previewSrc && !showCropper && (
        <div className="w-full rounded-xl border border-ink-100 bg-white p-4 shadow-sm">
          <p className="mb-3 text-xs font-semibold text-ink-500 uppercase tracking-wide">Preview</p>
          <div className="flex items-center gap-4">
            <img
              src={previewSrc}
              alt="Cropped preview"
              className="h-16 w-16 rounded-full object-cover ring-2 ring-hamplard-lilac shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink-800">Looks good?</p>
              <p className="text-xs text-ink-400">Click Save to update your avatar.</p>

              {uploading && (
                <div
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Upload progress"
                  className="mt-2 h-1.5 w-full rounded-full bg-ink-100 overflow-hidden"
                >
                  <div
                    className="h-full rounded-full bg-hamplard-primary transition-all duration-150"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={handleDiscard}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-ink-500 hover:text-ink-800 hover:bg-ink-50 transition disabled:opacity-40"
            >
              <X className="h-3.5 w-3.5" />
              Discard
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-hamplard-primary px-4 py-1.5 text-xs font-semibold text-white hover:bg-hamplard-mid transition disabled:opacity-60"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Uploading {progress}%
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Save
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Success ── */}
      {saved && (
        <p className="text-xs font-medium text-leaf-700 bg-leaf-50 border border-leaf-200 px-3 py-1.5 rounded-full inline-flex items-center gap-1.5">
          <Check className="h-3.5 w-3.5" />
          Avatar updated
        </p>
      )}

      {/* ── Error ── */}
      {error && (
        <p className="w-full rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}

      <p className="text-[11px] text-ink-400">JPEG, PNG or WebP · max 5 MB</p>
    </div>
  );
}
