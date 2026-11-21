import React, { StrictMode, useState } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ShoppingCart } from '@/components/cart/ShoppingCart';
import { CoursePreviewModal } from '@/components/courses/CoursePreviewModal';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/lib/api/services', () => ({ promoCodesApi: { validate: vi.fn() } }));
vi.mock('@/lib/hooks/use-cart-store', () => ({
  useCartStore: () => ({
    items: [],
    removeItem: vi.fn(),
    clearCart: vi.fn(),
    getTotalPrice: () => 0,
  }),
}));

type OverlayKind = 'cart' | 'preview';

function Overlay({ kind, isOpen, onClose }: {
  kind: OverlayKind;
  isOpen: boolean;
  onClose: () => void;
}) {
  return kind === 'cart' ? (
    <ShoppingCart isOpen={isOpen} onClose={onClose} />
  ) : (
    <CoursePreviewModal
      isOpen={isOpen}
      onClose={onClose}
      videoUrl="/preview.mp4"
      courseTitle="Photography"
    />
  );
}

function Harness({ kind, conditional = false }: { kind: OverlayKind; conditional?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [count, setCount] = useState(0);
  return (
    <>
      <button onClick={() => setIsOpen(true)}>First opener</button>
      <button onClick={() => setIsOpen(true)}>Second opener</button>
      <button onClick={() => setCount(count + 1)}>Rerender {count}</button>
      {(!conditional || isOpen) && (
        <Overlay kind={kind} isOpen={isOpen} onClose={() => setIsOpen(false)} />
      )}
    </>
  );
}

beforeEach(() => {
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe.each<OverlayKind>(['cart', 'preview'])('%s focus restoration', (kind) => {
  const closeName = kind === 'cart' ? 'Close cart' : 'Close preview modal';

  it('restores focus after the close button hides an overlay', async () => {
    const user = userEvent.setup();
    render(<Harness kind={kind} />);
    const opener = screen.getByRole('button', { name: 'First opener' });
    await user.click(opener);
    await user.click(screen.getByRole('button', { name: closeName }));
    expect(opener).toHaveFocus();
  });

  it('restores focus when closing unmounts the overlay', async () => {
    const user = userEvent.setup();
    render(<Harness kind={kind} conditional />);
    const opener = screen.getByRole('button', { name: 'First opener' });
    await user.click(opener);
    await user.click(screen.getByRole('button', { name: closeName }));
    expect(opener).toHaveFocus();
  });

  it('captures a new opener on each opening', async () => {
    const user = userEvent.setup();
    render(<Harness kind={kind} />);
    await user.click(screen.getByRole('button', { name: 'First opener' }));
    await user.click(screen.getByRole('button', { name: closeName }));
    const second = screen.getByRole('button', { name: 'Second opener' });
    await user.click(second);
    await user.click(screen.getByRole('button', { name: closeName }));
    expect(second).toHaveFocus();
  });

  it('retains the opener across unrelated rerenders and new close callbacks', async () => {
    const user = userEvent.setup();
    render(<Harness kind={kind} />);
    const opener = screen.getByRole('button', { name: 'First opener' });
    await user.click(opener);
    await user.click(screen.getByRole('button', { name: 'Rerender 0' }));
    await user.click(screen.getByRole('button', { name: closeName }));
    expect(opener).toHaveFocus();
  });

  it('does not steal focus while initially closed', () => {
    const outside = document.createElement('button');
    document.body.append(outside);
    outside.focus();
    render(<Harness kind={kind} />);
    expect(outside).toHaveFocus();
    outside.remove();
  });

  it('ignores an opener that has been removed', async () => {
    const user = userEvent.setup();
    const opener = document.createElement('button');
    document.body.append(opener);
    opener.focus();
    const focus = vi.spyOn(opener, 'focus');
    const { rerender } = render(<Overlay kind={kind} isOpen onClose={() => {}} />);
    opener.remove();
    await user.click(screen.getByRole('button', { name: closeName }));
    rerender(<Overlay kind={kind} isOpen={false} onClose={() => {}} />);
    expect(focus).not.toHaveBeenCalled();
  });

  it('works with StrictMode effect replay', async () => {
    const user = userEvent.setup();
    render(<StrictMode><Harness kind={kind} conditional /></StrictMode>);
    const opener = screen.getByRole('button', { name: 'First opener' });
    await user.click(opener);
    await user.click(screen.getByRole('button', { name: closeName }));
    expect(opener).toHaveFocus();
  });
});

it('restores preview focus after Escape closes it', async () => {
  const user = userEvent.setup();
  render(<Harness kind="preview" />);
  const opener = screen.getByRole('button', { name: 'First opener' });
  await user.click(opener);
  screen.getByRole('button', { name: 'Close preview modal' }).focus();
  await user.keyboard('{Escape}');
  expect(opener).toHaveFocus();
});
