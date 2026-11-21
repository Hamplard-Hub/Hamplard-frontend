import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { assignmentsApi } from '@/lib/api/services';
import type { Lesson } from '@/types';
import { AssignmentSubmission } from './AssignmentSubmission';

vi.mock('@/lib/api/services', () => ({
  assignmentsApi: {
    getByLesson: vi.fn(),
    submit: vi.fn(),
  },
}));

vi.mock('@/components/ui/FileUpload', () => ({
  FileUpload: ({
    label,
    onUploadComplete,
  }: {
    label: string;
    onUploadComplete: (file: { fileName: string; size: number; url: string }) => void;
  }) => (
    <button
      type="button"
      onClick={() => onUploadComplete({ fileName: 'work.jpg', size: 10, url: `https://cdn.test/${label}` })}
    >
      {label}
    </button>
  ),
}));

const lesson: Lesson = {
  id: 'lesson-1',
  moduleId: 'module-1',
  title: 'Practise a seam',
  description: null,
  type: 'ASSIGNMENT',
  videoUrl: null,
  videoDuration: null,
  content: null,
  resourceUrl: null,
  position: 1,
  isFree: false,
};

describe('AssignmentSubmission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(assignmentsApi.getByLesson).mockResolvedValue({
      id: 'assignment-1',
      brief: 'Sew a straight seam and photograph your result.',
      rubric: ['Straight stitching', 'Neat finish'],
      submission: null,
    });
    vi.mocked(assignmentsApi.submit).mockResolvedValue({
      id: 'submission-1',
      assignmentId: 'assignment-1',
      studentId: 'student-1',
      submissionUrl: 'https://cdn.test/work.jpg',
      notes: 'I used cotton fabric.',
      status: 'SUBMITTED',
      feedback: null,
      submittedAt: new Date().toISOString(),
      reviewedAt: null,
    });
  });

  it('shows the assignment brief and rubric and submits uploaded work with an optional note', async () => {
    render(<AssignmentSubmission lesson={lesson} />);

    expect(await screen.findByText('Sew a straight seam and photograph your result.')).toBeInTheDocument();
    expect(screen.getByText('Straight stitching')).toBeInTheDocument();
    expect(screen.getByText('Not submitted')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Upload photos' }));
    fireEvent.change(screen.getByRole('textbox', { name: /Note for your instructor/i }), {
      target: { value: 'I used cotton fabric.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Submit assignment' }));

    await waitFor(() => expect(assignmentsApi.submit).toHaveBeenCalledWith(
      'assignment-1',
      'https://cdn.test/Upload photos',
      'I used cotton fabric.',
    ));
    expect(await screen.findByText('Submitted')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Submit assignment' })).not.toBeInTheDocument();
  });

  it('only enables resubmission when instructor feedback requests revision', async () => {
    vi.mocked(assignmentsApi.getByLesson).mockResolvedValue({
      id: 'assignment-1',
      submission: {
        id: 'submission-1',
        assignmentId: 'assignment-1',
        studentId: 'student-1',
        submissionUrl: 'https://cdn.test/work.jpg',
        notes: null,
        status: 'REJECTED',
        feedback: 'Please improve the seam finish.',
        submittedAt: new Date().toISOString(),
        reviewedAt: new Date().toISOString(),
      },
    });

    render(<AssignmentSubmission lesson={lesson} />);

    expect(await screen.findByText('Needs revision')).toBeInTheDocument();
    expect(screen.getByText('Please improve the seam finish.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Resubmit assignment' })).toBeInTheDocument();
  });

  it('does not offer resubmission after submission or review', async () => {
    vi.mocked(assignmentsApi.getByLesson).mockResolvedValue({
      id: 'assignment-1',
      submission: {
        id: 'submission-1',
        assignmentId: 'assignment-1',
        studentId: 'student-1',
        submissionUrl: 'https://cdn.test/work.jpg',
        notes: null,
        status: 'APPROVED',
        feedback: 'Great work.',
        submittedAt: new Date().toISOString(),
        reviewedAt: new Date().toISOString(),
      },
    });

    render(<AssignmentSubmission lesson={lesson} />);

    expect(await screen.findByText('Reviewed')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /resubmit assignment/i })).not.toBeInTheDocument();
  });
});
