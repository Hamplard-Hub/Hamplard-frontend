import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GlossaryTerm, highlightGlossaryTerms, type GlossaryItem } from './GlossaryTerm';
import { GlossaryPanel } from './GlossaryPanel';

const sampleGlossary: GlossaryItem[] = [
  {
    id: '1',
    term: 'Contouring',
    definition: 'A makeup technique using dark and light cosmetics to sculpt facial features.',
    category: 'Beauty',
    imageUrl: '/images/contouring.jpg',
  },
  {
    id: '2',
    term: 'Proofing',
    definition: 'The final rise of shaped yeast dough before baking.',
    category: 'Baking',
  },
  {
    id: '3',
    term: 'Selvedge',
    definition: 'The tightly woven edge of a fabric that prevents unraveling.',
    category: 'Tailoring',
  },
];

describe('GlossaryTerm (Issue #406)', () => {
  it('renders term trigger with accessible role and attributes', () => {
    render(
      <GlossaryTerm
        term="Selvedge"
        definition="The tightly woven edge of fabric."
      />,
    );

    const trigger = screen.getByRole('button', { name: 'Selvedge' });
    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('toggles definition popup on click and closes on escape', () => {
    render(
      <GlossaryTerm
        term="Proofing"
        definition="The final rise of shaped dough before baking."
      />,
    );

    const trigger = screen.getByRole('button', { name: 'Proofing' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Click to open
    fireEvent.click(trigger);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(
      screen.getByText('The final rise of shaped dough before baking.'),
    ).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    // Press Escape to close
    fireEvent.keyDown(trigger, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('supports keyboard navigation via Enter and Space keys', () => {
    render(
      <GlossaryTerm
        term="Contouring"
        definition="Sculpting facial features."
      />,
    );

    const trigger = screen.getByRole('button', { name: 'Contouring' });

    // Press Enter to open
    fireEvent.keyDown(trigger, { key: 'Enter' });
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // Press Space to toggle close
    fireEvent.keyDown(trigger, { key: ' ' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows tooltip on mouse hover', () => {
    render(
      <GlossaryTerm
        term="Selvedge"
        definition="Fabric edge."
      />,
    );

    const trigger = screen.getByRole('button', { name: 'Selvedge' });
    fireEvent.mouseEnter(trigger);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.mouseLeave(trigger);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('highlightGlossaryTerms helper replaces matching words with tooltips', () => {
    const text = 'Remember to check the selvedge before starting the cut, and practice proofing.';
    const rendered = highlightGlossaryTerms(text, sampleGlossary);

    const { container } = render(<div>{rendered}</div>);
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(2);
    expect(buttons[0]).toHaveTextContent('selvedge');
    expect(buttons[1]).toHaveTextContent('proofing');
  });
});

describe('GlossaryPanel (Issue #406)', () => {
  it('renders all terms sorted alphabetically and filters by search query', () => {
    render(<GlossaryPanel glossary={sampleGlossary} />);

    expect(screen.getByText('Course Glossary')).toBeInTheDocument();
    expect(screen.getByText('3 terms')).toBeInTheDocument();
    expect(screen.getByText('Contouring')).toBeInTheDocument();
    expect(screen.getByText('Proofing')).toBeInTheDocument();
    expect(screen.getByText('Selvedge')).toBeInTheDocument();

    // Search for "yeast"
    const searchInput = screen.getByLabelText('Search glossary terms');
    fireEvent.change(searchInput, { target: { value: 'yeast' } });

    expect(screen.getByText('Proofing')).toBeInTheDocument();
    expect(screen.queryByText('Selvedge')).not.toBeInTheDocument();
    expect(screen.queryByText('Contouring')).not.toBeInTheDocument();
  });

  it('filters terms when an alphabetical letter is selected', () => {
    render(<GlossaryPanel glossary={sampleGlossary} />);

    // Click 'S'
    const letterS = screen.getByRole('button', { name: 'Filter by letter S' });
    fireEvent.click(letterS);

    expect(screen.getByText('Selvedge')).toBeInTheDocument();
    expect(screen.queryByText('Contouring')).not.toBeInTheDocument();
    expect(screen.queryByText('Proofing')).not.toBeInTheDocument();
  });
});
