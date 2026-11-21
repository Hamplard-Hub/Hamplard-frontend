import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { assignmentsApi } from '@/lib/api/services';
import InstructorAssignmentsPage from './page';

vi.mock('@/lib/api/services', () => ({
  assignmentsApi: {
    getPending: vi.fn(),
    review: vi.fn(),
  },
}));

vi.mock('next/image', () => ({
  default: ({ unoptimized: _unoptimized, ...props }: React.ImgHTMLAttributes<HTMLImageElement> & { unoptimized?: boolean }) => <img {...props} />,
}));

const submissions = [
  {
    id: 'submission-new',
    status: 'SUBMITTED',
    submittedAt: '2026-05-12T10:00:00.000Z',
    submissionUrl: 'https://cdn.test/new.jpg',
    student: { id: 'student-new', name: 'Jordan New' },
    assignment: {
      rubric: ['Technique'],
      lesson: { title: 'Advanced practice', course: { id: 'course-b', title: 'Advanced Sewing' } },
    },
  },
  {
    id: 'submission-old',
    status: 'SUBMITTED',
    submittedAt: '2026-05-10T10:00:00.000Z',
    submissionUrl: 'https://cdn.test/old.jpg',
    student: { id: 'student-old', name: 'Alex Old' },
    assignment: {
      rubric: ['Stitch quality'],
      lesson: { title: 'First seam', course: { id: 'course-a', title: 'Sewing Basics' } },
    },
  },
];

describe('InstructorAssignmentsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(assignmentsApi.getPending).mockResolvedValue(submissions);
    vi.mocked(assignmentsApi.review).mockResolvedValue({});
  });

  it('sorts oldest first, filters the queue, and updates status after review', async () => {
    render(<InstructorAssignmentsPage />);

    const oldestRow = await screen.findByRole('button', { name: /Alex Old/ });
    const newerRow = screen.getByRole('button', { name: /Jordan New/ });
    expect(oldestRow.compareDocumentPosition(newerRow) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    fireEvent.change(screen.getByRole('combobox', { name: 'Course' }), { target: { value: 'course-b' } });
    expect(screen.queryByRole('button', { name: /Alex Old/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Jordan New/ })).toBeInTheDocument();

    fireEvent.change(screen.getByRole('combobox', { name: 'Course' }), { target: { value: 'all' } });
    fireEvent.change(screen.getByRole('combobox', { name: 'Status' }), { target: { value: 'REJECTED' } });
    expect(screen.getByText('No submissions match these filters')).toBeInTheDocument();

    fireEvent.change(screen.getByRole('combobox', { name: 'Status' }), { target: { value: 'all' } });
    fireEvent.click(screen.getByRole('button', { name: /Alex Old/ }));
    fireEvent.change(screen.getByRole('combobox', { name: 'Score Stitch quality' }), { target: { value: '4' } });
    fireEvent.click(screen.getByRole('button', { name: 'Approve' }));

    await waitFor(() => expect(assignmentsApi.review).toHaveBeenCalledWith(
      'submission-old',
      true,
      'Rubric scores:\n- Stitch quality: 4/5',
    ));
    const updatedRow = screen.getByRole('button', { name: /Alex Old/ });
    expect(within(updatedRow).getByText('Approved')).toBeInTheDocument();
  });
});
