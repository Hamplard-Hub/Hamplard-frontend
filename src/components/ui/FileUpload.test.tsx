import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FileUpload } from './FileUpload';

describe('FileUpload', () => {
  const mockUploadUrl = 'http://api.example.com/upload';
  const mockFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
  const mockVideoFile = new File(['video content'], 'test.mp4', { type: 'video/mp4' });

  beforeEach(() => {
    // Mock localStorage
    localStorage.setItem('hamplard_token', 'mock-token');

    // Mock XMLHttpRequest
    global.XMLHttpRequest = vi.fn(() => ({
      open: vi.fn(),
      setRequestHeader: vi.fn(),
      send: vi.fn(),
      upload: {},
      onload: null,
      onerror: null,
      onabort: null,
      abort: vi.fn(),
    })) as any;
  });

  afterEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Drag and drop', () => {
    it('activates on drag over', async () => {
      render(<FileUpload uploadUrl={mockUploadUrl} />);

      const dropZone = screen.getByRole('button', { name: /upload files/i });
      fireEvent.dragOver(dropZone);

      expect(dropZone).toHaveClass('border-hamplard-primary');
      expect(dropZone).toHaveClass('bg-hamplard-lilac');
    });

    it('deactivates on drag leave', async () => {
      render(<FileUpload uploadUrl={mockUploadUrl} />);

      const dropZone = screen.getByRole('button', { name: /upload files/i });
      fireEvent.dragOver(dropZone);
      fireEvent.dragLeave(dropZone);

      expect(dropZone).toHaveClass('border-ink-200');
      expect(dropZone).toHaveClass('bg-ink-50');
    });

    it('handles dropped files', async () => {
      const onUploadComplete = vi.fn();
      render(
        <FileUpload uploadUrl={mockUploadUrl} onUploadComplete={onUploadComplete} />,
      );

      const dropZone = screen.getByRole('button', { name: /upload files/i });

      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(mockFile);

      fireEvent.drop(dropZone, { dataTransfer });

      // Should show file in list
      await waitFor(() => {
        expect(screen.getByText('test.jpg')).toBeInTheDocument();
      });
    });
  });

  describe('Browse files', () => {
    it('opens file picker on click', async () => {
      const user = userEvent.setup();
      render(<FileUpload uploadUrl={mockUploadUrl} />);

      const dropZone = screen.getByRole('button', { name: /upload files/i });
      const input = screen.getByDisplayValue('');

      vi.spyOn(input, 'click');
      await user.click(dropZone);

      expect(input.click).toHaveBeenCalled();
    });

    it('opens file picker on Enter key', async () => {
      render(<FileUpload uploadUrl={mockUploadUrl} />);

      const dropZone = screen.getByRole('button', { name: /upload files/i });
      const input = screen.getByDisplayValue('');

      vi.spyOn(input, 'click');
      fireEvent.keyDown(dropZone, { key: 'Enter' });

      expect(input.click).toHaveBeenCalled();
    });

    it('opens file picker on Space key', async () => {
      render(<FileUpload uploadUrl={mockUploadUrl} />);

      const dropZone = screen.getByRole('button', { name: /upload files/i });
      const input = screen.getByDisplayValue('');

      vi.spyOn(input, 'click');
      fireEvent.keyDown(dropZone, { key: ' ' });

      expect(input.click).toHaveBeenCalled();
    });
  });

  describe('File validation', () => {
    it('rejects files that do not match accept filter', async () => {
      const onUploadError = vi.fn();
      render(
        <FileUpload uploadUrl={mockUploadUrl} accept={['image/*']} onUploadError={onUploadError} />,
      );

      const pdfFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const input = screen.getByDisplayValue('');

      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(pdfFile);
      fireEvent.change(input, { target: { files: dataTransfer.files } });

      await waitFor(() => {
        expect(onUploadError).toHaveBeenCalledWith(
          'test.pdf',
          expect.stringContaining('not an accepted file type'),
        );
      });

      expect(screen.getByText("test.pdf\" isn't an accepted file type")).toBeInTheDocument();
    });

    it('rejects files that exceed max size', async () => {
      const onUploadError = vi.fn();
      const maxSize = 1024; // 1KB
      render(
        <FileUpload
          uploadUrl={mockUploadUrl}
          maxSizeBytes={maxSize}
          onUploadError={onUploadError}
        />,
      );

      const largeFile = new File(['x'.repeat(2000)], 'large.jpg', { type: 'image/jpeg' });
      const input = screen.getByDisplayValue('');

      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(largeFile);
      fireEvent.change(input, { target: { files: dataTransfer.files } });

      await waitFor(() => {
        expect(onUploadError).toHaveBeenCalledWith(
          'large.jpg',
          expect.stringContaining('too large'),
        );
      });

      expect(screen.getByText(/too large/)).toBeInTheDocument();
    });

    it('accepts files that pass validation', async () => {
      render(<FileUpload uploadUrl={mockUploadUrl} accept={['image/*']} />);

      const input = screen.getByDisplayValue('');
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(mockFile);

      fireEvent.change(input, { target: { files: dataTransfer.files } });

      await waitFor(() => {
        expect(screen.getByText('test.jpg')).toBeInTheDocument();
      });
    });
  });

  describe('Upload progress', () => {
    it('shows progress bar during upload', async () => {
      render(<FileUpload uploadUrl={mockUploadUrl} />);

      const input = screen.getByDisplayValue('');
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(mockFile);

      fireEvent.change(input, { target: { files: dataTransfer.files } });

      await waitFor(() => {
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
      });
    });

    it('updates progress percentage', async () => {
      render(<FileUpload uploadUrl={mockUploadUrl} />);

      const input = screen.getByDisplayValue('');
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(mockFile);

      fireEvent.change(input, { target: { files: dataTransfer.files } });

      await waitFor(() => {
        expect(screen.getByText('0%')).toBeInTheDocument();
      });
    });

    it('calls onProgress callback during upload', async () => {
      const onProgress = vi.fn();
      render(<FileUpload uploadUrl={mockUploadUrl} onProgress={onProgress} />);

      const input = screen.getByDisplayValue('');
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(mockFile);

      fireEvent.change(input, { target: { files: dataTransfer.files } });

      await waitFor(() => {
        expect(onProgress).toHaveBeenCalled();
      });
    });
  });

  describe('Cancel button', () => {
    it('appears during upload', async () => {
      render(<FileUpload uploadUrl={mockUploadUrl} />);

      const input = screen.getByDisplayValue('');
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(mockFile);

      fireEvent.change(input, { target: { files: dataTransfer.files } });

      await waitFor(() => {
        const removeButton = screen.getByRole('button', {
          name: /cancel test.jpg/i,
        });
        expect(removeButton).toBeInTheDocument();
      });
    });

    it('stops upload when clicked', async () => {
      const xhrMock = {
        open: vi.fn(),
        setRequestHeader: vi.fn(),
        send: vi.fn(),
        upload: {},
        abort: vi.fn(),
        onload: null,
        onerror: null,
        onabort: null,
      };

      global.XMLHttpRequest = vi.fn(() => xhrMock) as any;

      render(<FileUpload uploadUrl={mockUploadUrl} />);

      const input = screen.getByDisplayValue('');
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(mockFile);

      fireEvent.change(input, { target: { files: dataTransfer.files } });

      await waitFor(() => {
        const removeButton = screen.getByRole('button', {
          name: /cancel test.jpg/i,
        });
        fireEvent.click(removeButton);
      });

      expect(xhrMock.abort).toHaveBeenCalled();
    });

    it('removes file from list when clicked', async () => {
      render(<FileUpload uploadUrl={mockUploadUrl} />);

      const input = screen.getByDisplayValue('');
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(mockFile);

      fireEvent.change(input, { target: { files: dataTransfer.files } });

      await waitFor(() => {
        expect(screen.getByText('test.jpg')).toBeInTheDocument();
      });

      const removeButton = screen.getByRole('button', {
        name: /remove test.jpg/i,
      });
      fireEvent.click(removeButton);

      await waitFor(() => {
        expect(screen.queryByText('test.jpg')).not.toBeInTheDocument();
      });
    });
  });

  describe('Success state', () => {
    it('shows success icon when upload completes', async () => {
      render(<FileUpload uploadUrl={mockUploadUrl} />);

      const input = screen.getByDisplayValue('');
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(mockFile);

      fireEvent.change(input, { target: { files: dataTransfer.files } });

      await waitFor(() => {
        expect(screen.getByLabelText('Upload complete')).toBeInTheDocument();
      });
    });

    it('calls onUploadComplete callback on success', async () => {
      const onUploadComplete = vi.fn();
      render(
        <FileUpload uploadUrl={mockUploadUrl} onUploadComplete={onUploadComplete} />,
      );

      const input = screen.getByDisplayValue('');
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(mockFile);

      fireEvent.change(input, { target: { files: dataTransfer.files } });

      await waitFor(() => {
        expect(onUploadComplete).toHaveBeenCalled();
      });
    });
  });

  describe('Error state', () => {
    it('shows error message on upload failure', async () => {
      const xhrMock = {
        open: vi.fn(),
        setRequestHeader: vi.fn(),
        send: vi.fn(),
        upload: {},
        onload: vi.fn(),
        onerror: vi.fn(),
        onabort: null,
        abort: vi.fn(),
        status: 500,
      };

      global.XMLHttpRequest = vi.fn(() => xhrMock) as any;

      render(<FileUpload uploadUrl={mockUploadUrl} />);

      const input = screen.getByDisplayValue('');
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(mockFile);

      fireEvent.change(input, { target: { files: dataTransfer.files } });

      // Simulate error
      await waitFor(() => {
        xhrMock.onerror?.();
      });

      expect(screen.getByText(/Network error/)).toBeInTheDocument();
    });

    it('shows retry button on error', async () => {
      const xhrMock = {
        open: vi.fn(),
        setRequestHeader: vi.fn(),
        send: vi.fn(),
        upload: {},
        onload: null,
        onerror: vi.fn(),
        onabort: null,
        abort: vi.fn(),
        status: 500,
      };

      global.XMLHttpRequest = vi.fn(() => xhrMock) as any;

      render(<FileUpload uploadUrl={mockUploadUrl} />);

      const input = screen.getByDisplayValue('');
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(mockFile);

      fireEvent.change(input, { target: { files: dataTransfer.files } });

      // Simulate error
      await waitFor(() => {
        xhrMock.onerror?.();
      });

      expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
    });

    it('does not show retry for validation errors', async () => {
      const onUploadError = vi.fn();
      render(
        <FileUpload
          uploadUrl={mockUploadUrl}
          maxSizeBytes={10}
          onUploadError={onUploadError}
        />,
      );

      const input = screen.getByDisplayValue('');
      const largeFile = new File(['x'.repeat(100)], 'large.jpg', {
        type: 'image/jpeg',
      });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(largeFile);

      fireEvent.change(input, { target: { files: dataTransfer.files } });

      await waitFor(() => {
        expect(screen.getByText(/too large/)).toBeInTheDocument();
      });

      // Retry button should not be present for validation errors
      expect(
        screen.queryByRole('button', { name: /Retry/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe('File metadata', () => {
    it('displays file size', async () => {
      render(<FileUpload uploadUrl={mockUploadUrl} />);

      const input = screen.getByDisplayValue('');
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(mockFile);

      fireEvent.change(input, { target: { files: dataTransfer.files } });

      await waitFor(() => {
        expect(screen.getByText(/B/)).toBeInTheDocument();
      });
    });

    it('displays video duration when available', async () => {
      // Mock video duration detection
      const createElementSpy = vi.spyOn(document, 'createElement');
      createElementSpy.mockImplementation((tagName) => {
        const element = document.createElement(tagName);
        if (tagName === 'video') {
          Object.defineProperty(element, 'duration', {
            value: 120,
            configurable: true,
          });
          // Trigger metadata loaded event immediately
          setTimeout(() => {
            element.onloadedmetadata?.({} as any);
          }, 0);
        }
        return element;
      });

      render(<FileUpload uploadUrl={mockUploadUrl} />);

      const input = screen.getByDisplayValue('');
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(mockVideoFile);

      fireEvent.change(input, { target: { files: dataTransfer.files } });

      await waitFor(() => {
        // Duration should be displayed (2:00 for 120 seconds)
        expect(screen.getByText(/2:00/)).toBeInTheDocument();
      });

      createElementSpy.mockRestore();
    });
  });

  describe('Multiple files', () => {
    it('allows multiple files when multiple=true', async () => {
      render(<FileUpload uploadUrl={mockUploadUrl} multiple={true} />);

      const input = screen.getByDisplayValue('');
      const file1 = new File(['content1'], 'test1.jpg', { type: 'image/jpeg' });
      const file2 = new File(['content2'], 'test2.jpg', { type: 'image/jpeg' });

      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file1);
      dataTransfer.items.add(file2);

      fireEvent.change(input, { target: { files: dataTransfer.files } });

      await waitFor(() => {
        expect(screen.getByText('test1.jpg')).toBeInTheDocument();
        expect(screen.getByText('test2.jpg')).toBeInTheDocument();
      });
    });

    it('allows only single file when multiple=false', async () => {
      render(<FileUpload uploadUrl={mockUploadUrl} multiple={false} />);

      const input = screen.getByDisplayValue('');
      const file1 = new File(['content1'], 'test1.jpg', { type: 'image/jpeg' });
      const file2 = new File(['content2'], 'test2.jpg', { type: 'image/jpeg' });

      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file1);
      dataTransfer.items.add(file2);

      fireEvent.change(input, { target: { files: dataTransfer.files } });

      await waitFor(() => {
        expect(screen.getByText('test1.jpg')).toBeInTheDocument();
        expect(screen.queryByText('test2.jpg')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper progressbar ARIA attributes', async () => {
      render(<FileUpload uploadUrl={mockUploadUrl} />);

      const input = screen.getByDisplayValue('');
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(mockFile);

      fireEvent.change(input, { target: { files: dataTransfer.files } });

      await waitFor(() => {
        const progressbar = screen.getByRole('progressbar');
        expect(progressbar).toHaveAttribute('aria-valuenow');
        expect(progressbar).toHaveAttribute('aria-valuemin', '0');
        expect(progressbar).toHaveAttribute('aria-valuemax', '100');
        expect(progressbar).toHaveAttribute('aria-label');
      });
    });

    it('has sr-only file input', () => {
      render(<FileUpload uploadUrl={mockUploadUrl} />);
      const input = screen.getByDisplayValue('');
      expect(input).toHaveClass('sr-only');
    });
  });
});
