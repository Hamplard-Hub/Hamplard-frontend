import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { StepProgress } from '@/components/checkout/StepProgress';
import { QuizComponent } from '@/components/learn/QuizComponent';
import { FileUpload } from '@/components/ui/FileUpload';
import type { QuizQuestion } from '@/types';

class MockXHR {
  static instances: MockXHR[] = [];
  status = 0;
  responseText = '';
  upload = { onprogress: null };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;
  open = vi.fn();
  setRequestHeader = vi.fn();
  send = vi.fn();
  abort = vi.fn();

  constructor() {
    MockXHR.instances.push(this);
  }

  succeed(url: string) {
    this.status = 200;
    this.responseText = JSON.stringify({ data: { url } });
    act(() => this.onload?.());
  }

  fail() {
    this.status = 500;
    act(() => this.onload?.());
  }
}

const question: QuizQuestion = {
  id: 'status-q1',
  type: 'multiple_choice',
  question: 'Which option is correct?',
  options: [
    { id: 'a', text: 'Correct option', isCorrect: true },
    { id: 'b', text: 'Wrong option', isCorrect: false },
  ],
};

describe('status is not conveyed by colour alone', () => {
  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('labels checkout step states for assistive technology', () => {
    const { container } = render(<StepProgress currentStep={2} />);

    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Current step')).toBeInTheDocument();
    expect(screen.getByText('Not started')).toBeInTheDocument();
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('labels quiz feedback and pass state with text', () => {
    render(<QuizComponent questions={[question]} />);

    fireEvent.click(screen.getByText('Correct option'));
    fireEvent.click(screen.getByRole('button', { name: 'Submit Answer' }));

    expect(screen.getByText('Correct!')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'See Results' }));

    expect(screen.getByText('Passed')).toBeInTheDocument();
    expect(screen.getByText('Congratulations!')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Review answers' }));

    expect(screen.getByText('(your correct answer)')).toBeInTheDocument();
  });

  it('labels upload states with text and icons', async () => {
    MockXHR.instances = [];
    vi.stubGlobal('XMLHttpRequest', MockXHR);
    localStorage.setItem('hamplard_token', 'mock-token');

    const { container } = render(<FileUpload uploadUrl="http://api.example.com/upload" />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(['x'], 'a.jpg', { type: 'image/jpeg' })] } });

    await waitFor(() => expect(screen.getByText('Uploading')).toBeInTheDocument());
    MockXHR.instances[0].succeed('https://cdn.example.com/a.jpg');
    expect(screen.getByText('Uploaded')).toBeInTheDocument();

    fireEvent.change(input, { target: { files: [new File(['y'], 'b.jpg', { type: 'image/jpeg' })] } });
    await waitFor(() => expect(screen.getAllByText('Uploading')).toHaveLength(1));
    MockXHR.instances[1].fail();
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });
});
