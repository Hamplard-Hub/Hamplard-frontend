import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TeachPage from '../page';
import { ToastProvider } from '@/components/ui/ToastProvider';

vi.mock('@/components/layout/Header', () => ({
  Header: () => <div data-testid="mock-header">Header</div>,
}));

describe('Teach Landing Page (Issue #191)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders hero title and start teaching CTA', () => {
    render(
      <ToastProvider>
        <TeachPage />
      </ToastProvider>
    );

    expect(
      screen.getByRole('heading', { name: /Share Your Knowledge, Earn Income/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Start Teaching/i })).toBeInTheDocument();
  });

  it('renders 3-step process', () => {
    render(
      <ToastProvider>
        <TeachPage />
      </ToastProvider>
    );

    expect(screen.getByText('Plan Your Curriculum')).toBeInTheDocument();
    expect(screen.getByText('Record & Upload Video Lessons')).toBeInTheDocument();
    expect(screen.getByText('Publish & Earn Income')).toBeInTheDocument();
  });

  it('validates and submits instructor application form', () => {
    render(
      <ToastProvider>
        <TeachPage />
      </ToastProvider>
    );

    const submitBtn = screen.getByRole('button', {
      name: /Submit Application/i,
    });
    fireEvent.click(submitBtn);

    const nameInput = screen.getByLabelText(/Full Name \*/i);
    const emailInput = screen.getByLabelText(/Email Address \*/i);
    const motivationInput = screen.getByLabelText(/Why do you want to teach on Hamplard\? \*/i);

    fireEvent.change(nameInput, { target: { value: 'Amina Bello' } });
    fireEvent.change(emailInput, { target: { value: 'amina@example.com' } });
    fireEvent.change(motivationInput, {
      target: {
        value: 'I have 10 years of professional tailoring experience and want to mentor youth across Africa.',
      },
    });

    fireEvent.click(submitBtn);

    expect(screen.getByText(/Submitting Application.../i)).toBeInTheDocument();
  });
});
