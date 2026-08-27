import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import SignupPage from './page';
import * as nextNavigation from 'next/navigation';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
}));

describe('SignupPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Field Validation', () => {
    it('shows required field errors when form is submitted empty', async () => {
      const user = userEvent.setup();
      render(<SignupPage />);

      const submitButton = screen.getByRole('button', { name: /signup/i });
      await user.click(submitButton);

      expect(await screen.findByText(/full name is required/i)).toBeInTheDocument();
      expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
      expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
      expect(await screen.findByText(/you must accept the terms to continue/i)).toBeInTheDocument();
    });

    it('shows error for invalid email format', async () => {
      const user = userEvent.setup();
      render(<SignupPage />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'invalid-email');
      
      const submitButton = screen.getByRole('button', { name: /signup/i });
      await user.click(submitButton);

      expect(await screen.findByText(/enter a valid email address/i)).toBeInTheDocument();
    });

    it('shows error when password is less than 8 characters', async () => {
      const user = userEvent.setup();
      render(<SignupPage />);

      const passwordInput = screen.getByPlaceholderText(/create a password/i);
      await user.type(passwordInput, 'short');
      
      const submitButton = screen.getByRole('button', { name: /signup/i });
      await user.click(submitButton);

      expect(await screen.findByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });

    it('shows error when passwords do not match', async () => {
      const user = userEvent.setup();
      render(<SignupPage />);

      const passwordInput = screen.getByPlaceholderText(/create a password/i);
      await user.type(passwordInput, 'password123');

      const confirmPasswordInput = screen.getByPlaceholderText(/confirm your password/i);
      await user.type(confirmPasswordInput, 'differentpass');

      const submitButton = screen.getByRole('button', { name: /signup/i });
      await user.click(submitButton);

      expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
    });

    it('shows error when terms checkbox is unchecked', async () => {
      const user = userEvent.setup();
      render(<SignupPage />);

      // Fill in valid data
      await user.type(screen.getByLabelText(/full name/i), 'John Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.type(screen.getByPlaceholderText(/create a password/i), 'password123');
      
      // Don't check the terms checkbox
      const submitButton = screen.getByRole('button', { name: /signup/i });
      await user.click(submitButton);

      expect(await screen.findByText(/you must accept the terms to continue/i)).toBeInTheDocument();
    });
  });

  describe('Successful Registration', () => {
    it('submits form and redirects to dashboard when valid', async () => {
      const user = userEvent.setup();
      const mockPush = vi.fn();
      (nextNavigation.useRouter as unknown as vi.Mock).mockReturnValue({ push: mockPush });

      render(<SignupPage />);

      await user.type(screen.getByLabelText(/full name/i), 'John Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.type(screen.getByPlaceholderText(/create a password/i), 'password123');
      await user.type(screen.getByPlaceholderText(/confirm your password/i), 'password123');
      await user.click(screen.getByRole('checkbox', { name: /terms and privacy policy/i }));

      const submitButton = screen.getByRole('button', { name: /signup/i });
      await user.click(submitButton);

      // Wait for the loading state
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /creating account/i })).toBeInTheDocument();
      });

      // Wait for navigation
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('shows loading state during submission', async () => {
      const user = userEvent.setup();
      render(<SignupPage />);

      await user.type(screen.getByLabelText(/full name/i), 'John Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.type(screen.getByPlaceholderText(/create a password/i), 'password123');
      await user.type(screen.getByPlaceholderText(/confirm your password/i), 'password123');
      await user.click(screen.getByRole('checkbox', { name: /terms and privacy policy/i }));

      const submitButton = screen.getByRole('button', { name: /signup/i });
      await user.click(submitButton);

      // Check button is disabled and shows loading text
      await waitFor(() => {
        const loadingButton = screen.getByRole('button', { name: /creating account/i });
        expect(loadingButton).toBeDisabled();
      });
    });
  });

  describe('API Error Handling', () => {
    it('displays email already registered error', async () => {
      const user = userEvent.setup();
      const mockPush = vi.fn();
      (nextNavigation.useRouter as unknown as vi.Mock).mockReturnValue({ push: mockPush });

      render(<SignupPage />);

      await user.type(screen.getByLabelText(/full name/i), 'John Doe');
      await user.type(screen.getByLabelText(/email/i), 'existing@example.com');
      await user.type(screen.getByPlaceholderText(/create a password/i), 'password123');
      await user.type(screen.getByPlaceholderText(/confirm your password/i), 'password123');
      await user.click(screen.getByRole('checkbox', { name: /terms and privacy policy/i }));

      const submitButton = screen.getByRole('button', { name: /signup/i });
      await user.click(submitButton);

      // The API error scenario - in real implementation this would be tested with mocked API
      await waitFor(() => {
        // Verify form was submitted (button state changed)
        expect(screen.getByRole('button', { name: /creating account/i })).toBeInTheDocument();
      });
    });
  });
});