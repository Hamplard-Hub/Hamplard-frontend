import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useCartStore, CartItem } from './use-cart-store';

// Mock localStorage for testing
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useCartStore', () => {
  beforeEach(() => {
    localStorageMock.clear();
    // Reset store to initial state
    useCartStore.setState({
      items: [],
      savedForLater: [],
      isHydrated: false,
    });
  });

  describe('cart items', () => {
    it('should add item to cart', () => {
      const item: CartItem = {
        courseId: '1',
        title: 'React Basics',
        price: 29.99,
      };
      useCartStore.getState().addItem(item);
      expect(useCartStore.getState().items).toContainEqual(item);
    });

    it('should not add duplicate items to cart', () => {
      const item: CartItem = {
        courseId: '1',
        title: 'React Basics',
        price: 29.99,
      };
      useCartStore.getState().addItem(item);
      useCartStore.getState().addItem(item);
      expect(useCartStore.getState().items).toHaveLength(1);
    });

    it('should remove item from cart', () => {
      const item: CartItem = {
        courseId: '1',
        title: 'React Basics',
        price: 29.99,
      };
      useCartStore.getState().addItem(item);
      expect(useCartStore.getState().items).toHaveLength(1);

      useCartStore.getState().removeItem('1');
      expect(useCartStore.getState().items).toHaveLength(0);
    });

    it('should clear all items', () => {
      useCartStore.getState().addItem({
        courseId: '1',
        title: 'React',
        price: 29.99,
      });
      useCartStore.getState().addItem({
        courseId: '2',
        title: 'Vue',
        price: 19.99,
      });
      expect(useCartStore.getState().items).toHaveLength(2);

      useCartStore.getState().clear();
      expect(useCartStore.getState().items).toHaveLength(0);
    });
  });

  describe('saved for later', () => {
    it('should save item for later', () => {
      const item: CartItem = {
        courseId: '1',
        title: 'React Basics',
        price: 29.99,
      };
      useCartStore.getState().saveForLater(item);
      expect(useCartStore.getState().savedForLater).toContainEqual(item);
    });

    it('should remove item from cart when saving for later', () => {
      const item: CartItem = {
        courseId: '1',
        title: 'React Basics',
        price: 29.99,
      };
      useCartStore.getState().addItem(item);
      expect(useCartStore.getState().items).toHaveLength(1);

      useCartStore.getState().saveForLater(item);
      expect(useCartStore.getState().items).toHaveLength(0);
      expect(useCartStore.getState().savedForLater).toHaveLength(1);
    });

    it('should not add duplicate items to saved for later', () => {
      const item: CartItem = {
        courseId: '1',
        title: 'React Basics',
        price: 29.99,
      };
      useCartStore.getState().saveForLater(item);
      useCartStore.getState().saveForLater(item);
      expect(useCartStore.getState().savedForLater).toHaveLength(1);
    });

    it('should move item from saved to cart', () => {
      const item: CartItem = {
        courseId: '1',
        title: 'React Basics',
        price: 29.99,
      };
      useCartStore.getState().saveForLater(item);
      expect(useCartStore.getState().savedForLater).toHaveLength(1);
      expect(useCartStore.getState().items).toHaveLength(0);

      useCartStore.getState().moveToCart('1');
      expect(useCartStore.getState().savedForLater).toHaveLength(0);
      expect(useCartStore.getState().items).toHaveLength(1);
    });

    it('should remove item from saved for later', () => {
      const item: CartItem = {
        courseId: '1',
        title: 'React Basics',
        price: 29.99,
      };
      useCartStore.getState().saveForLater(item);
      expect(useCartStore.getState().savedForLater).toHaveLength(1);

      useCartStore.getState().removeSavedForLater('1');
      expect(useCartStore.getState().savedForLater).toHaveLength(0);
    });
  });

  describe('persistence', () => {
    it('should persist items to localStorage', () => {
      const item: CartItem = {
        courseId: '1',
        title: 'React Basics',
        price: 29.99,
      };
      useCartStore.getState().addItem(item);

      // Manually trigger persistence (normally done by zustand)
      const state = useCartStore.getState();
      const persistedData = JSON.stringify({
        items: state.items,
        savedForLater: state.savedForLater,
      });

      expect(localStorageMock.getItem('hamplard-cart')).toBeDefined();
    });

    it('should set isHydrated on rehydration', () => {
      expect(useCartStore.getState().isHydrated).toBe(false);
      useCartStore.setState({ isHydrated: true });
      expect(useCartStore.getState().isHydrated).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle moving non-existent item', () => {
      useCartStore.getState().moveToCart('non-existent');
      expect(useCartStore.getState().items).toHaveLength(0);
    });

    it('should handle removing non-existent item', () => {
      useCartStore.getState().removeItem('non-existent');
      expect(useCartStore.getState().items).toHaveLength(0);
    });

    it('should handle mixing cart and saved operations', () => {
      const item1: CartItem = {
        courseId: '1',
        title: 'React',
        price: 29.99,
      };
      const item2: CartItem = {
        courseId: '2',
        title: 'Vue',
        price: 19.99,
      };

      useCartStore.getState().addItem(item1);
      useCartStore.getState().addItem(item2);
      useCartStore.getState().saveForLater(item1);

      expect(useCartStore.getState().items).toHaveLength(1);
      expect(useCartStore.getState().savedForLater).toHaveLength(1);

      useCartStore.getState().moveToCart('1');

      expect(useCartStore.getState().items).toHaveLength(2);
      expect(useCartStore.getState().savedForLater).toHaveLength(0);
    });
  });
});
