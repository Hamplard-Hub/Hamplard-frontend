import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ProjectCard } from './ProjectCard';
import { ReportModal } from './ReportModal';
import { ShowcaseGallery } from './ShowcaseGallery';
import { showcaseApi } from '@/lib/api/services';
import type { ShowcaseProject } from '@/types';

vi.mock('@/lib/hooks/use-toast', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    push: vi.fn(),
  }),
}));

const mockProject: ShowcaseProject = {
  id: 'proj-1',
  courseId: 'course-1',
  studentId: 'user-1',
  studentName: 'Amina Bello',
  title: 'Six-Piece Flared Mermaid Skirt',
  description: 'Constructed from Ankara wax print with French seams.',
  imageUrl: 'https://example.com/project.jpg',
  status: 'APPROVED',
  likesCount: 24,
  hasLiked: false,
  commentsCount: 5,
  createdAt: new Date().toISOString(),
};

describe('Showcase Components (Issue #400)', () => {
  it('renders ProjectCard with student name, title, likes, and comments', () => {
    const handleOpen = vi.fn();
    const handleLike = vi.fn();
    const handleReport = vi.fn();

    render(
      <ProjectCard
        project={mockProject}
        onOpen={handleOpen}
        onLike={handleLike}
        onReport={handleReport}
      />,
    );

    expect(screen.getByText('Six-Piece Flared Mermaid Skirt')).toBeInTheDocument();
    expect(screen.getByText('Amina Bello')).toBeInTheDocument();
    expect(screen.getByText('24')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();

    // Clicking card opens project modal
    fireEvent.click(screen.getByText('Six-Piece Flared Mermaid Skirt'));
    expect(handleOpen).toHaveBeenCalledWith(mockProject);
  });

  it('toggles like in ProjectCard when like button is clicked', () => {
    const handleOpen = vi.fn();
    const handleLike = vi.fn();
    const handleReport = vi.fn();

    render(
      <ProjectCard
        project={mockProject}
        onOpen={handleOpen}
        onLike={handleLike}
        onReport={handleReport}
      />,
    );

    const likeButtons = screen.getAllByRole('button');
    const likeBtn = likeButtons.find((btn) => btn.textContent?.includes('24'));
    if (likeBtn) fireEvent.click(likeBtn);
    expect(handleLike).toHaveBeenCalled();
  });

  it('handles ReportModal interaction and submits reason', async () => {
    const reportSpy = vi.spyOn(showcaseApi, 'reportProject').mockResolvedValue({
      success: true,
      message: 'Reported',
    });
    const handleClose = vi.fn();

    render(
      <ReportModal
        isOpen={true}
        project={mockProject}
        onClose={handleClose}
      />,
    );

    expect(screen.getByText('Report Project')).toBeInTheDocument();

    // Select inappropriate reason
    const radio = screen.getByLabelText(/inappropriate or offensive content/i);
    fireEvent.click(radio);

    // Submit report
    const submitBtn = screen.getByRole('button', { name: /submit report/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(reportSpy).toHaveBeenCalledWith(
        'proj-1',
        'Inappropriate or offensive content',
        '',
      );
    });
  });

  it('renders ShowcaseGallery with search input and project list', () => {
    render(
      <ShowcaseGallery
        courseId="course-1"
        initialProjects={[mockProject]}
      />,
    );

    expect(screen.getByPlaceholderText(/search projects/i)).toBeInTheDocument();
    expect(screen.getByText('Six-Piece Flared Mermaid Skirt')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit your work/i })).toBeInTheDocument();
  });
});
