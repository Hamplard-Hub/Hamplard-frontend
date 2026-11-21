import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Lightbox, StepImageGallery } from './Lightbox';

const mockImages = [
  { src: 'https://example.com/img1.jpg', title: 'Step 1: Pattern Drafting', description: 'Measure and draft the base pattern.' },
  { src: 'https://example.com/img2.jpg', title: 'Step 2: Cutting Fabric', description: 'Carefully cut along the grain line.' },
  { src: 'https://example.com/img3.jpg', title: 'Step 3: Stitching Seams', description: 'Pin and sew the side seams together.' },
];

describe('Lightbox Component', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(
      <Lightbox images={mockImages} isOpen={false} onClose={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders modal dialog when isOpen is true', () => {
    render(<Lightbox images={mockImages} isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
    expect(screen.getByText('Step 1: Pattern Drafting')).toBeInTheDocument();
    expect(screen.getByText('Measure and draft the base pattern.')).toBeInTheDocument();
  });

  it('navigates to next and previous image on button click', async () => {
    const user = userEvent.setup();
    render(<Lightbox images={mockImages} isOpen={true} onClose={vi.fn()} />);

    const nextBtn = screen.getByRole('button', { name: /next image/i });
    await user.click(nextBtn);

    expect(screen.getByText('2 / 3')).toBeInTheDocument();
    expect(screen.getByText('Step 2: Cutting Fabric')).toBeInTheDocument();

    const prevBtn = screen.getByRole('button', { name: /previous image/i });
    await user.click(prevBtn);

    expect(screen.getByText('1 / 3')).toBeInTheDocument();
    expect(screen.getByText('Step 1: Pattern Drafting')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked or Escape key pressed', async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    render(<Lightbox images={mockImages} isOpen={true} onClose={handleClose} />);

    const closeBtn = screen.getByRole('button', { name: /close lightbox/i });
    await user.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(2);
  });

  it('navigates via arrow keys', () => {
    render(<Lightbox images={mockImages} isOpen={true} onClose={vi.fn()} />);

    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getByText('2 / 3')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('zooms in and out with controls', async () => {
    const user = userEvent.setup();
    render(<Lightbox images={mockImages} isOpen={true} onClose={vi.fn()} />);

    const zoomInBtn = screen.getByRole('button', { name: /zoom in/i });
    await user.click(zoomInBtn);

    expect(screen.getByText('150%')).toBeInTheDocument();

    const zoomOutBtn = screen.getByRole('button', { name: /zoom out/i });
    await user.click(zoomOutBtn);

    expect(screen.getByText('100%')).toBeInTheDocument();
  });
});

describe('StepImageGallery Component', () => {
  it('renders thumbnail grid and opens lightbox on click', async () => {
    const user = userEvent.setup();
    render(<StepImageGallery images={mockImages} />);

    const thumbs = screen.getAllByRole('button');
    expect(thumbs.length).toBe(3);

    await user.click(thumbs[1]);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
    expect(screen.getByText('Step 2: Cutting Fabric')).toBeInTheDocument();
  });
});
