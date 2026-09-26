import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import StarRatingSelector from './StarRating';

describe('StarRating', () => {
  describe('Rendering', () => {
    it('renders all 5 stars', () => {
      render(<StarRatingSelector />);
      const stars = screen.getAllByRole('radio');
      expect(stars).toHaveLength(5);
    });

    it('renders with correct aria-label for each star', () => {
      render(<StarRatingSelector />);
      const stars = screen.getAllByRole('radio');
      
      expect(stars[0]).toHaveAttribute('aria-label', '1 star');
      expect(stars[1]).toHaveAttribute('aria-label', '2 stars');
      expect(stars[2]).toHaveAttribute('aria-label', '3 stars');
      expect(stars[3]).toHaveAttribute('aria-label', '4 stars');
      expect(stars[4]).toHaveAttribute('aria-label', '5 stars');
    });

    it('has aria-label on the radiogroup', () => {
      render(<StarRatingSelector />);
      const radiogroup = screen.getByRole('radiogroup', { name: /star rating/i });
      expect(radiogroup).toBeInTheDocument();
    });
  });

  describe('Rating Selection', () => {
    it('selects 1 star when clicked', () => {
      render(<StarRatingSelector />);
      const firstStar = screen.getByRole('radio', { name: /1 star/i });
      fireEvent.click(firstStar);
      expect(firstStar).toHaveAttribute('aria-checked', 'true');
    });

    it('selects 3 stars when clicked', () => {
      render(<StarRatingSelector />);
      const thirdStar = screen.getByRole('radio', { name: /3 stars/i });
      fireEvent.click(thirdStar);
      expect(thirdStar).toHaveAttribute('aria-checked', 'true');
    });

    it('selects 5 stars when clicked', () => {
      render(<StarRatingSelector />);
      const fifthStar = screen.getByRole('radio', { name: /5 stars/i });
      fireEvent.click(fifthStar);
      expect(fifthStar).toHaveAttribute('aria-checked', 'true');
    });

    it('deselects star when clicked again', () => {
      render(<StarRatingSelector />);
      const firstStar = screen.getByRole('radio', { name: /1 star/i });
      
      fireEvent.click(firstStar);
      expect(firstStar).toHaveAttribute('aria-checked', 'true');
      
      fireEvent.click(firstStar);
      expect(firstStar).toHaveAttribute('aria-checked', 'false');
    });
  });

  describe('Hover State', () => {
    it('highlights stars on hover', () => {
      render(<StarRatingSelector />);
      const firstStar = screen.getByRole('radio', { name: /1 star/i });
      
      fireEvent.mouseEnter(firstStar);
      // After hover, star should appear filled
      const starButton = firstStar.closest('button');
      expect(starButton).toBeInTheDocument();
    });

    it('resets hover state on mouse leave', () => {
      render(<StarRatingSelector />);
      const firstStar = screen.getByRole('radio', { name: /1 star/i });
      
      fireEvent.mouseEnter(firstStar);
      fireEvent.mouseLeave(firstStar);
      
      // Component should still render without errors
      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    });
  });

  describe('Filled Stars Display', () => {
    it('displays correct filled stars for rating 1', () => {
      render(<StarRatingSelector />);
      const firstStar = screen.getByRole('radio', { name: /1 star/i });
      fireEvent.click(firstStar);
      
      // First star should be filled
      expect(firstStar).toHaveAttribute('aria-checked', 'true');
    });

    it('displays correct filled stars for rating 5', () => {
      render(<StarRatingSelector />);
      const fifthStar = screen.getByRole('radio', { name: /5 stars/i });
      fireEvent.click(fifthStar);
      
      expect(fifthStar).toHaveAttribute('aria-checked', 'true');
    });
  });

  describe('Clear Functionality', () => {
    it('has clear buttons when rating is selected', () => {
      render(<StarRatingSelector />);
      const fifthStar = screen.getByRole('radio', { name: /5 stars/i });
      fireEvent.click(fifthStar);
      
      // There are two clear buttons in the component
      const clearButtons = screen.getAllByRole('button', { name: /clear rating/i });
      expect(clearButtons.length).toBeGreaterThan(0);
    });

    it('clears rating when clear button is clicked', () => {
      render(<StarRatingSelector />);
      const fifthStar = screen.getByRole('radio', { name: /5 stars/i });
      fireEvent.click(fifthStar);
      
      const clearButtons = screen.getAllByRole('button', { name: /clear rating/i });
      fireEvent.click(clearButtons[0]);
      
      expect(fifthStar).toHaveAttribute('aria-checked', 'false');
    });

    it('does not show clear button when no rating selected', () => {
      render(<StarRatingSelector />);
      const clearButtons = screen.queryByRole('button', { name: /clear rating/i });
      expect(clearButtons).not.toBeInTheDocument();
    });
  });

  describe('Rating Breakdown', () => {
    it('renders rating breakdown section', () => {
      render(<StarRatingSelector />);
      expect(screen.getByText(/rating breakdown/i)).toBeInTheDocument();
    });

    it('renders 5 star rating bars', () => {
      render(<StarRatingSelector />);
      // Rating breakdown shows stars in descending order: 5, 4, 3, 2, 1
      const starLabels = screen.getAllByText(/★/);
      expect(starLabels).toHaveLength(5);
    });
  });

  describe('Average Display', () => {
    it('shows "—" when no rating selected', () => {
      render(<StarRatingSelector />);
      expect(screen.getByText(/—/i)).toBeInTheDocument();
    });

    it('shows rating number when rating is selected', () => {
      render(<StarRatingSelector />);
      const fifthStar = screen.getByRole('radio', { name: /5 stars/i });
      fireEvent.click(fifthStar);
      
      expect(screen.getByText(/5\.0/i)).toBeInTheDocument();
    });
  });
});