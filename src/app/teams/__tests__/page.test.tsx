import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TeamsPage from '../page';
import { ToastProvider } from '@/components/ui/ToastProvider';

vi.mock('@/components/layout/Header', () => ({
  Header: () => <div data-testid="mock-header">Header</div>,
}));

describe('Teams Landing Page (Issue #189)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders hero title and get a quote CTA', () => {
    render(
      <ToastProvider>
        <TeamsPage />
      </ToastProvider>
    );

    expect(
      screen.getByRole('heading', { name: /Upskill Your Entire Team/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Get a Quote/i })).toBeInTheDocument();
  });

  it('renders all pricing tiers', () => {
    render(
      <ToastProvider>
        <TeamsPage />
      </ToastProvider>
    );

    expect(screen.getByText('Starter Team')).toBeInTheDocument();
    expect(screen.getByText('Growth Plan')).toBeInTheDocument();
    expect(screen.getByText('Enterprise')).toBeInTheDocument();
  });

  it('validates and submits contact form', async () => {
    render(
      <ToastProvider>
        <TeamsPage />
      </ToastProvider>
    );

    const submitBtn = screen.getByRole('button', {
      name: /Submit Quote Request/i,
    });
    fireEvent.click(submitBtn);

    // Form inputs
    const companyInput = screen.getByLabelText(/Company Name \*/i);
    const emailInput = screen.getByLabelText(/Work Email \*/i);

    fireEvent.change(companyInput, { target: { value: 'Acme Corp' } });
    fireEvent.change(emailInput, { target: { value: 'admin@acme.com' } });

    fireEvent.click(submitBtn);

    expect(screen.getByText(/Submitting.../i)).toBeInTheDocument();
  });
});
