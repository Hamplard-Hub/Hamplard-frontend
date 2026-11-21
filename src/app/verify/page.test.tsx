import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import VerifyPage from './page';
import { certificatesApi } from '@/lib/api/services';

const mockPush = vi.fn();
const mockReplace = vi.fn();
let mockSearchParamId = '';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useSearchParams: () => ({
    get: (key: string) => (key === 'id' ? mockSearchParamId : null),
  }),
}));

vi.mock('@/lib/api/services', () => ({
  certificatesApi: {
    verify: vi.fn(),
  },
}));

describe('VerifyPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParamId = '';
  });

  it('renders verify search bar and informational cards on initial load', () => {
    render(<VerifyPage />);

    expect(screen.getByRole('heading', { level: 1, name: /verify certificate/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter certificate id/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^verify$/i })).toBeInTheDocument();
    expect(screen.getByText(/blockchain anchored/i)).toBeInTheDocument();
    expect(screen.getByText(/tamper-proof/i)).toBeInTheDocument();
  });

  it('displays certificate details when verification succeeds', async () => {
    const user = userEvent.setup();
    const mockCert = {
      id: 'cert-xyz-123',
      courseTitle: 'Professional Tailoring & Design',
      studentId: 'user-1',
      student: { name: 'Amina Bello', stellarAddress: 'GABCD123456789' },
      course: { title: 'Professional Tailoring & Design', instructor: { name: 'Ibrahim Sani' } },
      issuedAt: '2026-03-15T12:00:00Z',
      txHash: '0xabc123def456',
      isRevoked: false,
    };

    (certificatesApi.verify as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      valid: true,
      certificate: mockCert,
    });

    render(<VerifyPage />);

    const input = screen.getByPlaceholderText(/enter certificate id/i);
    await user.type(input, 'cert-xyz-123');
    await user.click(screen.getByRole('button', { name: /^verify$/i }));

    await waitFor(() => {
      expect(screen.getByText('Official Certificate of Completion')).toBeInTheDocument();
    });

    expect(screen.getByText('Amina Bello')).toBeInTheDocument();
    expect(screen.getByText('Professional Tailoring & Design')).toBeInTheDocument();
    expect(screen.getByText(/verified valid/i)).toBeInTheDocument();
    expect(screen.getByText(/0xabc123def456/i)).toBeInTheDocument();
  });

  it('displays error message when certificate is invalid or not found', async () => {
    const user = userEvent.setup();
    (certificatesApi.verify as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Not found')
    );

    render(<VerifyPage />);

    const input = screen.getByPlaceholderText(/enter certificate id/i);
    await user.type(input, 'invalid-id-999');
    await user.click(screen.getByRole('button', { name: /^verify$/i }));

    await waitFor(() => {
      expect(screen.getByText(/verification failed/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/certificate not found/i)).toBeInTheDocument();
  });
});
