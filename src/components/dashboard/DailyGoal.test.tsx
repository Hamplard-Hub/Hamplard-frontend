import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DailyGoal, setDailyGoal, getDailyGoal, addLearningMinutes, getTodayMinutes } from './DailyGoal';

describe('DailyGoal Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders with default 15 min daily goal and 0% progress', () => {
    render(<DailyGoal />);
    expect(screen.getByText('Daily Learning Goal')).toBeInTheDocument();
    expect(screen.getByText('15 min/day')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByText(/15 mins today/)).toBeInTheDocument();
  });

  it('allows picking a new daily goal from options', () => {
    render(<DailyGoal />);
    const pickerButton = screen.getByRole('button', { name: /Change daily goal/i });
    fireEvent.click(pickerButton);

    expect(screen.getByText('Select your daily commitment:')).toBeInTheDocument();
    const option30 = screen.getByRole('button', { name: '30m' });
    fireEvent.click(option30);

    expect(getDailyGoal()).toBe(30);
    expect(screen.getByText('30 min/day')).toBeInTheDocument();
  });

  it('updates progress ring and percentage as minutes are added', () => {
    render(<DailyGoal />);
    const add5Btn = screen.getByRole('button', { name: /Add 5 minutes of study/i });
    fireEvent.click(add5Btn);

    expect(getTodayMinutes()).toBe(5);
    expect(screen.getByText('33%')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('celebrates and shows completion badge when goal is achieved', () => {
    const onGoalCompleted = vi.fn();
    render(<DailyGoal onGoalCompleted={onGoalCompleted} />);

    // Add 15 minutes to complete 15m goal
    const add15Btn = screen.getByRole('button', { name: /Add 15 minutes of study/i });
    fireEvent.click(add15Btn);

    expect(screen.getByText(/Goal achieved! Great job!/i)).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/Daily goal completed!/i);
    expect(onGoalCompleted).toHaveBeenCalled();
  });
});
