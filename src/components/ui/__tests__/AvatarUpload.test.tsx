import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  AvatarUpload,
  clampOffset,
  zoomAround,
  getSourceCropRect,
  EXPORT_MAX_SIZE,
  MIN_ZOOM,
  MAX_ZOOM,
} from '../AvatarUpload';

const uploadAvatar = vi.fn();
const updateUser = vi.fn();

vi.mock('@/lib/api/services', () => ({
  uploadsApi: { uploadAvatar: (...args: unknown[]) => uploadAvatar(...args) },
  usersApi: {},
}));

vi.mock('@/lib/hooks/use-auth-store', () => ({
  useAuthStore: (selector: (s: { updateUser: typeof updateUser }) => unknown) => selector({ updateUser }),
}));

// ── Browser API fakes (jsdom has no canvas, image decoding or object URLs) ──

let imageSize = { width: 800, height: 600 };

class FakeImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  naturalWidth = 0;
  naturalHeight = 0;
  set src(_value: string) {
    this.naturalWidth = imageSize.width;
    this.naturalHeight = imageSize.height;
    setTimeout(() => this.onload?.(), 0);
  }
}

interface ExportCanvas {
  width: number;
  height: number;
  drawImage: ReturnType<typeof vi.fn>;
}
let exportCanvases: ExportCanvas[] = [];

function fakeContext(canvas: HTMLCanvasElement) {
  const ctx = {
    canvas,
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    drawImage: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    rect: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    clip: vi.fn(),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    imageSmoothingQuality: 'low',
  };
  if (canvas.isConnected) {
    ctx.drawImage.mockImplementation(() => { onscreenDraws++; });
  } else {
    // Off-screen export canvases are never attached to the document
    exportCanvases.push({
      get width() { return canvas.width; },
      get height() { return canvas.height; },
      drawImage: ctx.drawImage,
    });
  }
  return ctx;
}

let urlCounter = 0;
/** drawImage calls made on the on-screen crop canvas */
let onscreenDraws = 0;

beforeEach(() => {
  imageSize = { width: 800, height: 600 };
  exportCanvases = [];
  urlCounter = 0;
  onscreenDraws = 0;
  uploadAvatar.mockReset();
  updateUser.mockReset();

  vi.stubGlobal('Image', FakeImage);
  URL.createObjectURL = vi.fn(() => `blob:mock-${++urlCounter}`);
  URL.revokeObjectURL = vi.fn();
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function (this: HTMLCanvasElement) {
    return fakeContext(this) as unknown as CanvasRenderingContext2D;
  } as never);
  HTMLCanvasElement.prototype.toBlob = function (cb: BlobCallback, type?: string) {
    cb(new Blob(['x'], { type }));
  };
  // The crop canvas renders at its full 320px buffer size in tests
  vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockReturnValue({
    left: 0, top: 0, width: 320, height: 320, right: 320, bottom: 320, x: 0, y: 0, toJSON: () => ({}),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function getFileInput(container: HTMLElement) {
  return container.querySelector('input[type="file"]') as HTMLInputElement;
}

async function openCropper(container: HTMLElement, file = new File(['img'], 'me.png', { type: 'image/png' })) {
  fireEvent.change(getFileInput(container), { target: { files: [file] } });
  return screen.findByRole('dialog', { name: 'Crop profile photo' });
}

// ── Pure helpers ────────────────────────────────────────────────────────────

describe('crop geometry helpers', () => {
  it('clampOffset keeps the image covering the crop square', () => {
    // 800×600 at scale 0.6 → 480×360 on a 320 canvas
    expect(clampOffset({ x: 50, y: 50 }, 800, 600, 0.6, 320)).toEqual({ x: 0, y: 0 });
    expect(clampOffset({ x: -500, y: -500 }, 800, 600, 0.6, 320)).toEqual({ x: -160, y: -40 });
    expect(clampOffset({ x: -100, y: -10 }, 800, 600, 0.6, 320)).toEqual({ x: -100, y: -10 });
  });

  it('zoomAround keeps the anchor point fixed', () => {
    const next = zoomAround({ x: -40, y: 0 }, 1, 2, 160, 160);
    // Image point under the anchor: (160 - -40) / 1 = 200 → at scale 2 must sit at 160
    expect(160 - next.x).toBe(200 * 2);
    expect(next).toEqual({ x: -240, y: -160 });
  });

  it('getSourceCropRect maps the visible square back to source pixels', () => {
    expect(getSourceCropRect({ x: -80, y: -40 }, 0.5, 320)).toEqual({ x: 160, y: 80, size: 640 });
  });
});

// ── Component ───────────────────────────────────────────────────────────────

describe('AvatarUpload cropping', () => {
  it('opens a 1:1 crop dialog with a bounded zoom slider after choosing a file', async () => {
    const { container } = render(<AvatarUpload currentAvatarUrl="https://cdn/old.jpg" userName="Ada" />);

    await openCropper(container);

    const canvas = container.querySelector('canvas')!;
    expect(canvas.width).toBe(canvas.height);
    const slider = screen.getByRole('slider', { name: 'Zoom' });
    expect(slider).toHaveAttribute('min', String(MIN_ZOOM));
    expect(slider).toHaveAttribute('max', String(MAX_ZOOM));
    expect(slider).toHaveValue(String(MIN_ZOOM));
  });

  it('rejects unsupported file types', () => {
    const { container } = render(<AvatarUpload />);
    fireEvent.change(getFileInput(container), {
      target: { files: [new File(['x'], 'a.gif', { type: 'image/gif' })] },
    });
    expect(screen.getByText(/Only JPEG, PNG, and WebP/)).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('Cancel discards the file and leaves the previous avatar untouched', async () => {
    const { container } = render(<AvatarUpload currentAvatarUrl="https://cdn/old.jpg" />);

    await openCropper(container);
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByAltText('Avatar preview')).toHaveAttribute('src', 'https://cdn/old.jpg');
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-1');
    expect(uploadAvatar).not.toHaveBeenCalled();
  });

  it('Escape also cancels the crop', async () => {
    const { container } = render(<AvatarUpload currentAvatarUrl="https://cdn/old.jpg" />);
    const dialog = await openCropper(container);

    fireEvent.keyDown(dialog, { key: 'Escape' });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('exports exactly the centred square region by default, capped in size', async () => {
    const { container } = render(<AvatarUpload />);
    await openCropper(container);

    fireEvent.click(screen.getByRole('button', { name: /^crop$/i }));
    await waitFor(() => expect(exportCanvases).toHaveLength(1));

    // 800×600 image: the centred 600×600 square, starting at x = 100
    const [out] = exportCanvases;
    expect(out.width).toBe(EXPORT_MAX_SIZE);
    expect(out.height).toBe(EXPORT_MAX_SIZE);
    const [, sx, sy, sw, sh, dx, dy, dw, dh] = out.drawImage.mock.calls[0];
    expect(sx).toBeCloseTo(100);
    expect(sy).toBeCloseTo(0);
    expect(sw).toBeCloseTo(600);
    expect(sh).toBeCloseTo(600);
    expect([dx, dy, dw, dh]).toEqual([0, 0, EXPORT_MAX_SIZE, EXPORT_MAX_SIZE]);

    // The cropped result is shown in the avatar preview
    expect(await screen.findByAltText('Cropped preview')).toHaveAttribute('src', 'blob:mock-2');
    expect(screen.getByAltText('Avatar preview')).toHaveAttribute('src', 'blob:mock-2');
  });

  it('never upscales small images beyond their source resolution', async () => {
    imageSize = { width: 200, height: 200 };
    const { container } = render(<AvatarUpload />);
    await openCropper(container);

    fireEvent.click(screen.getByRole('button', { name: /^crop$/i }));
    await waitFor(() => expect(exportCanvases).toHaveLength(1));

    expect(exportCanvases[0].width).toBe(200);
  });

  it('reflects drag repositioning and zoom in the exported region', async () => {
    const { container } = render(<AvatarUpload />);
    await openCropper(container);
    const canvas = container.querySelector('canvas')!;

    // Zoom to 2× around the centre: cover scale is 320/600, so the square is 300px of source
    fireEvent.change(screen.getByRole('slider', { name: 'Zoom' }), { target: { value: '2' } });

    // Drag far to the right/bottom: clamps to the image's top-left corner
    fireEvent.pointerDown(canvas, { pointerId: 1, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(canvas, { pointerId: 1, clientX: 2000, clientY: 2000 });
    fireEvent.pointerUp(canvas, { pointerId: 1 });

    fireEvent.click(screen.getByRole('button', { name: /^crop$/i }));
    await waitFor(() => expect(exportCanvases).toHaveLength(1));

    const [, sx, sy, sw, sh] = exportCanvases[0].drawImage.mock.calls[0];
    expect(sx).toBeCloseTo(0);
    expect(sy).toBeCloseTo(0);
    expect(sw).toBeCloseTo(300);
    expect(sh).toBeCloseTo(300);
  });

  it('supports pinch-to-zoom with two pointers', async () => {
    const { container } = render(<AvatarUpload />);
    await openCropper(container);
    const canvas = container.querySelector('canvas')!;

    fireEvent.pointerDown(canvas, { pointerId: 1, clientX: 110, clientY: 160 });
    fireEvent.pointerDown(canvas, { pointerId: 2, clientX: 210, clientY: 160 });
    fireEvent.pointerMove(canvas, { pointerId: 2, clientX: 310, clientY: 160 });

    // Fingers moved from 100px to 200px apart → 2× zoom
    expect(Number((screen.getByRole('slider', { name: 'Zoom' }) as HTMLInputElement).value)).toBeCloseTo(2);
  });

  it('clamps zoom to the allowed range', async () => {
    const { container } = render(<AvatarUpload />);
    await openCropper(container);
    const canvas = container.querySelector('canvas')!;

    for (let i = 0; i < 40; i++) fireEvent.wheel(canvas, { deltaY: -100, clientX: 160, clientY: 160 });
    expect(screen.getByRole('slider', { name: 'Zoom' })).toHaveValue(String(MAX_ZOOM));

    for (let i = 0; i < 40; i++) fireEvent.wheel(canvas, { deltaY: 100, clientX: 160, clientY: 160 });
    expect(screen.getByRole('slider', { name: 'Zoom' })).toHaveValue(String(MIN_ZOOM));
  });

  it('Save uploads the cropped JPEG and updates the avatar', async () => {
    uploadAvatar.mockResolvedValue({ url: 'https://cdn/new.jpg' });
    const onSaved = vi.fn();
    const { container } = render(<AvatarUpload onSaved={onSaved} />);
    await openCropper(container);

    fireEvent.click(screen.getByRole('button', { name: /^crop$/i }));
    fireEvent.click(await screen.findByRole('button', { name: /save/i }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith('https://cdn/new.jpg'));
    const [file] = uploadAvatar.mock.calls[0];
    expect(file).toBeInstanceOf(File);
    expect(file.type).toBe('image/jpeg');
    expect(updateUser).toHaveBeenCalledWith({ avatarUrl: 'https://cdn/new.jpg' });
    expect(screen.getByText('Avatar updated')).toBeInTheDocument();
  });

  it('redraws the crop canvas when a second image is opened', async () => {
    const { container } = render(<AvatarUpload />);
    await openCropper(container);
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    onscreenDraws = 0;

    await openCropper(container);
    expect(onscreenDraws).toBeGreaterThan(0);
  });
});
