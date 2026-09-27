import { render, screen, fireEvent, createEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FileUpload } from './FileUpload';

// ── Controllable XMLHttpRequest mock ─────────────────────────────────────

class MockXHR {
  static instances: MockXHR[] = [];

  status = 0;
  responseText = '';
  upload: { onprogress: ((e: Partial<ProgressEvent>) => void) | null } = { onprogress: null };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;
  open = vi.fn();
  setRequestHeader = vi.fn();
  send = vi.fn();
  abort = vi.fn(() => this.onabort?.());

  constructor() {
    MockXHR.instances.push(this);
  }

  progress(percent: number) {
    act(() => this.upload.onprogress?.({ lengthComputable: true, loaded: percent, total: 100 }));
  }

  succeed(url = 'https://cdn.example.com/file') {
    this.status = 200;
    this.responseText = JSON.stringify({ data: { url } });
    act(() => this.onload?.());
  }

  fail(status = 500) {
    this.status = status;
    act(() => this.onload?.());
  }

  networkError() {
    act(() => this.onerror?.());
  }
}

// jsdom has no DataTransfer, so pass plain file arrays through the events
function makeFile(name: string, size = 10, type = 'image/jpeg') {
  return new File(['x'.repeat(size)], name, { type });
}

function getInput(container: HTMLElement) {
  return container.querySelector('input[type="file"]') as HTMLInputElement;
}

function selectFiles(container: HTMLElement, files: File[]) {
  fireEvent.change(getInput(container), { target: { files } });
}

function dropFiles(files: File[]) {
  fireEvent.drop(screen.getByRole('button', { name: /upload files/i }), {
    dataTransfer: { files },
  });
}

const uploadUrl = 'http://api.example.com/upload';

describe('FileUpload', () => {
  beforeEach(() => {
    MockXHR.instances = [];
    vi.stubGlobal('XMLHttpRequest', MockXHR);
    localStorage.setItem('hamplard_token', 'mock-token');
  });

  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('Drag and drop', () => {
    it('highlights on drag over and resets on drag leave', () => {
      render(<FileUpload uploadUrl={uploadUrl} />);
      const dropZone = screen.getByRole('button', { name: /upload files/i });

      fireEvent.dragOver(dropZone);
      expect(dropZone).toHaveClass('border-hamplard-primary', 'bg-hamplard-lilac');

      fireEvent.dragLeave(dropZone);
      expect(dropZone).toHaveClass('border-ink-200', 'bg-ink-50');
    });

    it('stays highlighted when the pointer moves onto a child element', () => {
      render(<FileUpload uploadUrl={uploadUrl} />);
      const dropZone = screen.getByRole('button', { name: /upload files/i });
      const child = screen.getByText(/click to upload/i);

      fireEvent.dragOver(dropZone);
      // jsdom drops relatedTarget from drag event init, so set it directly
      const leave = createEvent.dragLeave(dropZone);
      Object.defineProperty(leave, 'relatedTarget', { value: child });
      fireEvent(dropZone, leave);

      expect(dropZone).toHaveClass('border-hamplard-primary');
    });

    it('queues every dropped file with its own upload request', async () => {
      render(<FileUpload uploadUrl={uploadUrl} />);

      dropFiles([makeFile('a.jpg'), makeFile('b.jpg'), makeFile('c.jpg')]);

      await waitFor(() => expect(screen.getAllByRole('progressbar')).toHaveLength(3));
      expect(MockXHR.instances).toHaveLength(3);
      expect(screen.getByText('a.jpg')).toBeInTheDocument();
      expect(screen.getByText('b.jpg')).toBeInTheDocument();
      expect(screen.getByText('c.jpg')).toBeInTheDocument();
    });
  });

  describe('Browse files', () => {
    it('opens the file picker on click, Enter and Space', () => {
      const { container } = render(<FileUpload uploadUrl={uploadUrl} />);
      const dropZone = screen.getByRole('button', { name: /upload files/i });
      const clickSpy = vi.spyOn(getInput(container), 'click');

      fireEvent.click(dropZone);
      fireEvent.keyDown(dropZone, { key: 'Enter' });
      fireEvent.keyDown(dropZone, { key: ' ' });

      expect(clickSpy).toHaveBeenCalledTimes(3);
    });

    it('has an sr-only file input that allows multiple files by default', () => {
      const { container } = render(<FileUpload uploadUrl={uploadUrl} />);
      expect(getInput(container)).toHaveClass('sr-only');
      expect(getInput(container)).toHaveAttribute('multiple');
    });
  });

  describe('Validation', () => {
    it('rejects files that do not match the accept filter without retry', async () => {
      const onUploadError = vi.fn();
      const { container } = render(
        <FileUpload uploadUrl={uploadUrl} accept={['image/*']} onUploadError={onUploadError} />,
      );

      selectFiles(container, [makeFile('doc.pdf', 10, 'application/pdf')]);

      await waitFor(() => expect(screen.getByText(/isn't an accepted file type/)).toBeInTheDocument());
      expect(onUploadError).toHaveBeenCalledWith('doc.pdf', expect.stringContaining('accepted file type'));
      expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
      expect(MockXHR.instances).toHaveLength(0);
    });

    it('rejects files that exceed the max size without retry', async () => {
      const { container } = render(<FileUpload uploadUrl={uploadUrl} maxSizeBytes={5} />);

      selectFiles(container, [makeFile('big.jpg', 50)]);

      await waitFor(() => expect(screen.getByText(/too large/)).toBeInTheDocument());
      expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
    });
  });

  describe('Per-file progress', () => {
    it('tracks progress independently for each file', async () => {
      const onProgress = vi.fn();
      render(<FileUpload uploadUrl={uploadUrl} onProgress={onProgress} />);

      dropFiles([makeFile('a.jpg'), makeFile('b.jpg')]);
      await waitFor(() => expect(MockXHR.instances).toHaveLength(2));

      MockXHR.instances[0].progress(40);
      MockXHR.instances[1].progress(75);

      const bars = screen.getAllByRole('progressbar');
      expect(bars[0]).toHaveAttribute('aria-valuenow', '40');
      expect(bars[1]).toHaveAttribute('aria-valuenow', '75');
      expect(screen.getByText('40%')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
      expect(onProgress).toHaveBeenCalledWith(40);
    });

    it('shows file name, size and success state', async () => {
      const onUploadComplete = vi.fn();
      render(<FileUpload uploadUrl={uploadUrl} onUploadComplete={onUploadComplete} />);

      dropFiles([makeFile('a.jpg', 10)]);
      await waitFor(() => expect(MockXHR.instances).toHaveLength(1));
      expect(screen.getByText('10 B')).toBeInTheDocument();

      MockXHR.instances[0].succeed('https://cdn.example.com/a.jpg');

      expect(screen.getByLabelText('Upload complete')).toBeInTheDocument();
      expect(onUploadComplete).toHaveBeenCalledWith(
        expect.objectContaining({ fileName: 'a.jpg', url: 'https://cdn.example.com/a.jpg' }),
      );
    });
  });

  describe('Summary', () => {
    it('shows "X of Y uploaded" above the list and updates as files finish', async () => {
      render(<FileUpload uploadUrl={uploadUrl} />);

      dropFiles([makeFile('a.jpg'), makeFile('b.jpg'), makeFile('c.jpg')]);
      await waitFor(() => expect(MockXHR.instances).toHaveLength(3));

      const summary = screen.getByTestId('upload-summary');
      expect(summary).toHaveTextContent('0 of 3 uploaded');
      expect(summary).toHaveTextContent('3 in progress');

      MockXHR.instances[0].succeed();
      MockXHR.instances[1].succeed();
      MockXHR.instances[2].fail();

      expect(summary).toHaveTextContent('2 of 3 uploaded');
      expect(summary).toHaveTextContent('1 failed');
      expect(summary).not.toHaveTextContent('in progress');
    });

    it('is hidden when there are no files', () => {
      render(<FileUpload uploadUrl={uploadUrl} />);
      expect(screen.queryByTestId('upload-summary')).not.toBeInTheDocument();
    });
  });

  describe('Cancel', () => {
    it('cancelling one file does not affect the others', async () => {
      const onUploadError = vi.fn();
      render(<FileUpload uploadUrl={uploadUrl} onUploadError={onUploadError} />);

      dropFiles([makeFile('a.jpg'), makeFile('b.jpg')]);
      await waitFor(() => expect(MockXHR.instances).toHaveLength(2));
      MockXHR.instances[1].progress(50);

      fireEvent.click(screen.getByRole('button', { name: 'Cancel a.jpg' }));

      expect(MockXHR.instances[0].abort).toHaveBeenCalled();
      expect(MockXHR.instances[1].abort).not.toHaveBeenCalled();
      expect(screen.queryByText('a.jpg')).not.toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
      // A user cancel is not an upload failure
      expect(onUploadError).not.toHaveBeenCalled();

      MockXHR.instances[1].succeed();
      expect(screen.getByTestId('upload-summary')).toHaveTextContent('1 of 1 uploaded');
    });

    it('removes a finished file from the list', async () => {
      render(<FileUpload uploadUrl={uploadUrl} />);

      dropFiles([makeFile('a.jpg')]);
      await waitFor(() => expect(MockXHR.instances).toHaveLength(1));
      MockXHR.instances[0].succeed();

      fireEvent.click(screen.getByRole('button', { name: 'Remove a.jpg' }));
      expect(screen.queryByText('a.jpg')).not.toBeInTheDocument();
    });

    it('aborts in-flight uploads on unmount', async () => {
      const { unmount } = render(<FileUpload uploadUrl={uploadUrl} />);

      dropFiles([makeFile('a.jpg'), makeFile('b.jpg')]);
      await waitFor(() => expect(MockXHR.instances).toHaveLength(2));

      unmount();

      MockXHR.instances.forEach((xhr) => expect(xhr.abort).toHaveBeenCalled());
    });
  });

  describe('Errors and retry', () => {
    it('shows a per-file error and retries only that file', async () => {
      const onUploadError = vi.fn();
      render(<FileUpload uploadUrl={uploadUrl} onUploadError={onUploadError} />);

      dropFiles([makeFile('a.jpg'), makeFile('b.jpg')]);
      await waitFor(() => expect(MockXHR.instances).toHaveLength(2));

      MockXHR.instances[0].networkError();
      MockXHR.instances[1].progress(30);

      expect(screen.getByText(/Network error/)).toBeInTheDocument();
      expect(onUploadError).toHaveBeenCalledWith('a.jpg', expect.stringContaining('Network error'));
      expect(screen.queryByRole('button', { name: 'Retry b.jpg' })).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Retry a.jpg' }));

      expect(MockXHR.instances).toHaveLength(3);
      expect(MockXHR.instances[1].abort).not.toHaveBeenCalled();
      expect(screen.queryByText(/Network error/)).not.toBeInTheDocument();

      MockXHR.instances[2].succeed();
      MockXHR.instances[1].succeed();
      expect(screen.getByTestId('upload-summary')).toHaveTextContent('2 of 2 uploaded');
    });

    it('shows the HTTP status for server failures', async () => {
      render(<FileUpload uploadUrl={uploadUrl} />);

      dropFiles([makeFile('a.jpg')]);
      await waitFor(() => expect(MockXHR.instances).toHaveLength(1));
      MockXHR.instances[0].fail(413);

      expect(screen.getByText('Upload failed (413)')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Retry a.jpg' })).toBeInTheDocument();
    });
  });

  describe('Single-file mode', () => {
    it('keeps only the first file when multiple=false', async () => {
      const { container } = render(<FileUpload uploadUrl={uploadUrl} multiple={false} />);

      selectFiles(container, [makeFile('a.jpg'), makeFile('b.jpg')]);

      await waitFor(() => expect(screen.getByText('a.jpg')).toBeInTheDocument());
      expect(screen.queryByText('b.jpg')).not.toBeInTheDocument();
    });

    it('aborts the previous upload when a new file replaces it', async () => {
      const { container } = render(<FileUpload uploadUrl={uploadUrl} multiple={false} />);

      selectFiles(container, [makeFile('a.jpg')]);
      await waitFor(() => expect(MockXHR.instances).toHaveLength(1));

      selectFiles(container, [makeFile('b.jpg')]);
      await waitFor(() => expect(screen.getByText('b.jpg')).toBeInTheDocument());

      expect(MockXHR.instances[0].abort).toHaveBeenCalled();
      expect(screen.queryByText('a.jpg')).not.toBeInTheDocument();
    });
  });

  describe('Video metadata', () => {
    it('displays video duration when available', async () => {
      const realCreateElement = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
        const element = realCreateElement(tagName);
        if (tagName === 'video') {
          Object.defineProperty(element, 'duration', { value: 120 });
          setTimeout(() => (element as HTMLVideoElement).onloadedmetadata?.({} as Event), 0);
        }
        return element;
      });

      render(<FileUpload uploadUrl={uploadUrl} />);
      dropFiles([makeFile('clip.mp4', 10, 'video/mp4')]);

      await waitFor(() => expect(screen.getByText('2:00')).toBeInTheDocument());
    });
  });
});
