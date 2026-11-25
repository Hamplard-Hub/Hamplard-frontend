import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DatePicker } from '../DatePicker';

function openCalendar(label = 'Choose date') {
  fireEvent.click(screen.getByRole('button', { name: label }));
}

describe('DatePicker', () => {
  it('renders a text input fallback with the provided value', () => {
    const onChange = vi.fn();
    render(<DatePicker value="2026-11-25" onChange={onChange} placeholder="YYYY-MM-DD" />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('2026-11-25');
    expect(input).toHaveAttribute('placeholder', 'YYYY-MM-DD');
  });

  it('commits a typed valid ISO date', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DatePicker value="" onChange={onChange} aria-describedby="date-help" />);

    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, '2026-12-01');

    expect(onChange).toHaveBeenCalledWith('2026-12-01');
  });

  it('reverts invalid text on blur and keeps last valid value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DatePicker value="2026-11-25" onChange={onChange} />);

    const input = screen.getByRole('textbox');
    await user.clear(input);
    await user.type(input, 'not-a-date');
    fireEvent.blur(input);

    expect(input).toHaveValue('2026-11-25');
  });

  it('opens calendar dialog and selects a date', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DatePicker value="2026-11-25" onChange={onChange} calendarLabel="Choose delivery date" />);

    await user.click(screen.getByRole('button', { name: 'Choose delivery date' }));
    const dialog = screen.getByRole('dialog', { name: 'Choose date' });
    expect(dialog).toBeInTheDocument();

    const dayButton = within(dialog).getByRole('gridcell', { name: /November 15, 2026/i });
    await user.click(dayButton);

    expect(onChange).toHaveBeenCalledWith('2026-11-15');
    expect(screen.queryByRole('dialog', { name: 'Choose date' })).not.toBeInTheDocument();
  });

  it('supports keyboard navigation in the calendar grid', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DatePicker value="2026-11-15" onChange={onChange} calendarLabel="Open calendar" />);

    await user.click(screen.getByRole('button', { name: 'Open calendar' }));
    const dialog = screen.getByRole('dialog', { name: 'Choose date' });
    const focused = within(dialog).getByRole('gridcell', { name: /November 15, 2026/i });
    focused.focus();
    expect(focused).toHaveFocus();

    fireEvent.keyDown(focused, { key: 'ArrowRight' });
    const next = within(dialog).getByRole('gridcell', { name: /November 16, 2026/i });
    expect(next).toHaveFocus();

    fireEvent.keyDown(next, { key: 'ArrowDown' });
    const weekLater = within(dialog).getByRole('gridcell', { name: /November 23, 2026/i });
    expect(weekLater).toHaveFocus();

    fireEvent.keyDown(weekLater, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith('2026-11-23');
  });

  it('respects min and max dates', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <DatePicker
        value="2026-11-15"
        onChange={onChange}
        min="2026-11-10"
        max="2026-11-20"
        calendarLabel="Open calendar"
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Open calendar' }));
    const dialog = screen.getByRole('dialog', { name: 'Choose date' });

    expect(within(dialog).getByRole('gridcell', { name: /November 9, 2026/i })).toBeDisabled();
    expect(within(dialog).getByRole('gridcell', { name: /November 21, 2026/i })).toBeDisabled();
    expect(within(dialog).getByRole('gridcell', { name: /November 15, 2026/i })).not.toBeDisabled();
  });

  it('closes on Escape and returns focus to input', async () => {
    const user = userEvent.setup();
    render(<DatePicker value="2026-11-15" onChange={vi.fn()} calendarLabel="Open calendar" />);

    await user.click(screen.getByRole('button', { name: 'Open calendar' }));
    const dialog = screen.getByRole('dialog', { name: 'Choose date' });
    const focused = within(dialog).getByRole('gridcell', { name: /November 15, 2026/i });
    focused.focus();

    fireEvent.keyDown(focused, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: 'Choose date' })).not.toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveFocus();
  });
});
