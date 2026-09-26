import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LoginPage from './page';
import { authApi } from '@/lib/api/services';
import { useAuthStore } from '@/lib/hooks/use-auth-store';

const mockPush = vi.fn();
const mockGetSearchParam = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({ get: mockGetSearchParam }),
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/lib/api/services', () => ({
  authApi: {
    loginWithEmail: vi.fn(),
  },
}));

describe('LoginPage integration', () => {
  const loginWithEmailMock = vi.mocked(authApi.loginWithEmail);

  beforeEach(() => {
    mockPush.mockReset();
    mockGetSearchParam.mockReset();
    mockGetSearchParam.mockReturnValue(null);
    loginWithEmailMock.mockReset();
    useAuthStore.getState().logout();
    localStorage.clear();
  });

  it('shows validation errors for both fields when the form is submitted empty', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.click(screen.getByRole('button', { name: /login/i }));

    expect(await screen.findByText('Email is required.')).toBeInTheDocument();
    expect(await screen.findByText('Password is required.')).toBeInTheDocument();
    expect(loginWithEmailMock).not.toHaveBeenCalled();
  });

  it('shows an email validation error for invalid email formats', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), 'not-an-email');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /login/i }));

    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument();
  });

  it('shows a password validation error for short passwords', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), 'student@example.com');
    await user.type(screen.getByLabelText(/password/i), 'short');
    await user.click(screen.getByRole('button', { name: /login/i }));

    expect(await screen.findByText('Password must be at least 8 characters.')).toBeInTheDocument();
  });

  it('submits valid credentials and redirects to the dashboard', async () => {
    const user = userEvent.setup();
    loginWithEmailMock.mockResolvedValue({
      accessToken: 'token-123',
      user: { id: 'user-1', email: 'student@example.com' },
    } as any);
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), 'student@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(loginWithEmailMock).toHaveBeenCalledWith({
        email: 'student@example.com',
        password: 'password123',
      });
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
    expect(localStorage.getItem('hamplard_token')).toBe('token-123');
  });

  it('shows an inline error message when the API rejects with invalid credentials', async () => {
    const user = userEvent.setup();
    const error = new AxiosError(
      'Request failed',
      'ERR_BAD_REQUEST',
      undefined,
      undefined,
      {
        status: 401,
        data: { message: 'Invalid credentials' },
        statusText: 'Unauthorized',
        headers: {},
        config: {},
      } as any,
    );
    loginWithEmailMock.mockRejectedValue(error);
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/email/i), 'student@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /login/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid credentials');
  });
});
