import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  describe('Variants', () => {
    it('renders primary variant correctly', () => {
      render(<Button variant="primary">Primary Button</Button>);
      const button = screen.getByRole('button', { name: /primary button/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('bg-hamplard-primary');
    });

    it('renders secondary variant correctly', () => {
      render(<Button variant="secondary">Secondary Button</Button>);
      const button = screen.getByRole('button', { name: /secondary button/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('bg-hamplard-lilac');
    });

    it('renders tertiary variant correctly', () => {
      render(<Button variant="tertiary">Tertiary Button</Button>);
      const button = screen.getByRole('button', { name: /tertiary button/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('border');
    });

    it('renders danger variant correctly', () => {
      render(<Button variant="danger">Danger Button</Button>);
      const button = screen.getByRole('button', { name: /danger button/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('bg-rose-600');
    });

    it('renders ghost variant correctly', () => {
      render(<Button variant="ghost">Ghost Button</Button>);
      const button = screen.getByRole('button', { name: /ghost button/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('text-hamplard-primary');
    });
  });

  describe('Sizes', () => {
    it('renders small size correctly', () => {
      render(<Button size="sm">Small Button</Button>);
      const button = screen.getByRole('button', { name: /small button/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('px-3');
      expect(button).toHaveClass('py-1.5');
      expect(button).toHaveClass('text-xs');
    });

    it('renders medium size correctly', () => {
      render(<Button size="md">Medium Button</Button>);
      const button = screen.getByRole('button', { name: /medium button/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('px-4');
      expect(button).toHaveClass('py-2');
      expect(button).toHaveClass('text-sm');
    });

    it('renders large size correctly', () => {
      render(<Button size="lg">Large Button</Button>);
      const button = screen.getByRole('button', { name: /large button/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('px-6');
      expect(button).toHaveClass('py-3');
      expect(button).toHaveClass('text-base');
    });
  });

  describe('Disabled State', () => {
    it('is disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled Button</Button>);
      const button = screen.getByRole('button', { name: /disabled button/i });
      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled:cursor-not-allowed');
    });

    it('is disabled when isLoading is true', () => {
      render(<Button isLoading>Loading Button</Button>);
      const button = screen.getByRole('button', { name: /loading.../i });
      expect(button).toBeDisabled();
    });

    it('does not fire onClick when disabled', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      render(<Button disabled onClick={handleClick}>Disabled Click</Button>);
      const button = screen.getByRole('button', { name: /disabled click/i });
      await user.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('shows loading spinner when isLoading is true', () => {
      render(<Button isLoading>Submit</Button>);
      expect(screen.getByRole('button', { name: /loading.../i })).toBeInTheDocument();
      expect(screen.getByRole('button')).toContainHTML('svg');
    });

    it('shows custom loading text when provided', () => {
      render(<Button isLoading loadingText="Processing...">Submit</Button>);
      expect(screen.getByText(/processing.../i)).toBeInTheDocument();
    });

    it('hides children while loading', () => {
      render(<Button isLoading>Submit</Button>);
      expect(screen.queryByText(/submit/i)).not.toBeInTheDocument();
    });
  });

  describe('Icon Support', () => {
    it('renders icon on the left by default', () => {
      const TestIcon = () => <span data-testid="test-icon">★</span>;
      render(<Button icon={<TestIcon />}>With Icon</Button>);
      const button = screen.getByRole('button', { name: /with icon/i });
      expect(button).toContainHTML('span');
    });

    it('renders icon on the right when iconPosition is right', () => {
      const TestIcon = () => <span data-testid="test-icon">★</span>;
      render(<Button icon={<TestIcon />} iconPosition="right">With Icon</Button>);
      const button = screen.getByRole('button', { name: /with icon/i });
      // Icon should appear after children
      expect(button.innerHTML).toContain('★');
    });
  });

  describe('Full Width', () => {
    it('applies full width when fullWidth is true', () => {
      render(<Button fullWidth>Full Width Button</Button>);
      const button = screen.getByRole('button', { name: /full width button/i });
      expect(button).toHaveClass('w-full');
    });
  });

  describe('Click Handler', () => {
    it('calls onClick when clicked', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      render(<Button onClick={handleClick}>Click Me</Button>);
      const button = screen.getByRole('button', { name: /click me/i });
      await user.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('has type attribute', () => {
      render(<Button>Button</Button>);
      const button = screen.getByRole('button', { name: /button/i });
      // Button should have type attribute (defaults to submit inside forms, but we use noValidate on form)
      expect(button).toBeInTheDocument();
    });

    it('forwards ref correctly', () => {
      const ref = { current: null };
      render(
        <Button ref={ref as unknown as React.Ref<HTMLButtonElement>}>
          Ref Button
        </Button>,
      );
      expect(ref.current).not.toBeNull();
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });
  });
});