import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { Button } from '@/components/ui/Button';
import { StepProgress } from '@/components/checkout/StepProgress';
import { QuizComponent } from '@/components/learn/QuizComponent';
import { BadgeCard } from '@/components/dashboard/BadgeCard';
import type { Achievement, QuizQuestion } from '@/types';

// jsdom cannot compute real colours, so the contrast rule is handled by the
// Playwright axe checks instead.
const axeOptions = { rules: { 'color-contrast': { enabled: false } } };

const question: QuizQuestion = {
  id: 'axe-q1',
  type: 'multiple_choice',
  question: 'Which option is correct?',
  options: [
    { id: 'a', text: 'Correct option', isCorrect: true },
    { id: 'b', text: 'Wrong option', isCorrect: false },
  ],
};

const badge: Achievement = {
  id: 'axe-badge',
  title: 'First steps',
  description: 'Finish your first lesson',
  criteria: 'Complete one lesson',
  icon: 'Award',
  category: 'learning',
  earned: true,
  earnedAt: '2026-01-01T00:00:00.000Z',
  rarity: 'common',
};

describe('automated accessibility checks (vitest-axe)', () => {
  it('Button has no axe violations', async () => {
    const { container } = render(<Button>Save changes</Button>);
    expect(await axe(container, axeOptions)).toHaveNoViolations();
  });

  it('StepProgress has no axe violations', async () => {
    const { container } = render(<StepProgress currentStep={2} />);
    expect(await axe(container, axeOptions)).toHaveNoViolations();
  });

  it('QuizComponent has no axe violations', async () => {
    const { container } = render(<QuizComponent questions={[question]} />);
    expect(await axe(container, axeOptions)).toHaveNoViolations();
  });

  it('BadgeCard has no axe violations', async () => {
    const { container } = render(<BadgeCard badge={badge} />);
    expect(await axe(container, axeOptions)).toHaveNoViolations();
  });
});
