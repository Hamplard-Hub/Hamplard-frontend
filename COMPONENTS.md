# Frontend Components Documentation

This document describes the four new reusable components implemented for the Hamplard frontend.

## Table of Contents

1. [Button Component](#button-component)
2. [Shopping Cart Component](#shopping-cart-component)
3. [Search Bar with Autocomplete](#search-bar-with-autocomplete)
4. [Search Results Page](#search-results-page)

---

## Button Component

### Overview

A flexible, reusable button component with support for multiple variants, sizes, and states. Built with accessibility in mind and follows the Hamplard design system.

### Location

`src/components/ui/Button.tsx`

### Usage

```tsx
import { Button } from '@/components/ui/Button';

// Basic usage
<Button>Click me</Button>

// With variants
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="tertiary">Tertiary</Button>
<Button variant="danger">Delete</Button>
<Button variant="ghost">Ghost</Button>

// With sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>

// With icons
<Button icon={<Heart className="w-4 h-4" />}>With Icon</Button>
<Button icon={<ArrowRight className="w-4 h-4" />} iconPosition="right">
  Continue
</Button>

// Loading state
<Button isLoading loadingText="Processing...">
  Submit
</Button>

// Full width
<Button fullWidth>Full Width Button</Button>

// Disabled
<Button disabled>Disabled</Button>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'tertiary' \| 'danger' \| 'ghost'` | `'primary'` | Button style variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Button size |
| `isLoading` | `boolean` | `false` | Show loading spinner |
| `loadingText` | `string` | `'Loading...'` | Text shown during loading |
| `icon` | `ReactNode` | `undefined` | Icon to display |
| `iconPosition` | `'left' \| 'right'` | `'left'` | Icon position |
| `fullWidth` | `boolean` | `false` | Stretch button to full width |
| `disabled` | `boolean` | `false` | Disable the button |
| `children` | `ReactNode` | - | Button label |

### Styling

- Uses TailwindCSS with the Hamplard design tokens
- Primary color: `hamplard-primary` (#7F77DD)
- Secondary color: `hamplard-lilac` (#EEEDFE)
- Danger color: `rose-600`
- Smooth transitions and focus states for accessibility

---

## Shopping Cart Component

### Overview

A feature-rich shopping cart component that manages course additions, displays cart items with thumbnails and prices, calculates totals, and provides checkout functionality. Uses Zustand for state management.

### Location

`src/components/cart/ShoppingCart.tsx`

### State Management

`src/lib/hooks/use-cart-store.ts` - Zustand store for cart state

### Usage

```tsx
import { ShoppingCart } from '@/components/cart';
import { useCartStore } from '@/lib/hooks/use-cart-store';

export default function MyComponent() {
  const { addItem, removeItem, clearCart, getTotalPrice } = useCartStore();
  const [showCart, setShowCart] = useState(false);

  return (
    <>
      <button onClick={() => setShowCart(!showCart)}>
        Open Cart
      </button>

      {showCart && (
        <ShoppingCart 
          isOpen={showCart}
          onClose={() => setShowCart(false)}
        />
      )}

      {/* Add course to cart */}
      <button onClick={() => addItem(course)}>
        Add to Cart
      </button>
    </>
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | `boolean` | `true` | Controls cart visibility |
| `onClose` | `() => void` | `undefined` | Callback when close button is clicked |

### Cart Store Methods

```tsx
const {
  items,              // CartItem[] - All items in cart
  addItem,            // (course: Course) => void
  removeItem,         // (courseId: string) => void
  clearCart,          // () => void
  getTotalPrice,      // () => number
  getItemCount,       // () => number
} = useCartStore();
```

### Features

- Display course cards with thumbnails
- Show course title, instructor, and category
- Calculate and display total price
- Remove individual items
- Clear entire cart
- Empty state with call-to-action
- Loading state for checkout
- Responsive design

---

## Search Bar with Autocomplete

### Overview

An intelligent search component featuring autocomplete suggestions, keyboard navigation, and category filtering. Integrates with the search store and route navigation.

### Location

`src/components/search/SearchBar.tsx`

### State Management

`src/lib/hooks/use-search-store.ts` - Zustand store for search filters

### Usage

```tsx
import { SearchBar } from '@/components/search';
import type { Course } from '@/types';

export default function MyComponent() {
  const [courses, setCourses] = useState<Course[]>([]);

  return (
    <SearchBar
      courses={courses}
      showSuggestions
      onSearch={(query) => console.log('Searching:', query)}
    />
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onSearch` | `(query: string) => void` | `undefined` | Callback on search submission |
| `placeholder` | `string` | `'Search courses...'` | Input placeholder text |
| `showSuggestions` | `boolean` | `true` | Show autocomplete suggestions |
| `courses` | `Course[]` | `[]` | Courses to search through |
| `isLoading` | `boolean` | `false` | Show loading indicator |

### Features

- **Autocomplete Suggestions**: Displays course titles, instructors, and categories
- **Keyboard Navigation**: 
  - `ArrowUp/Down` - Navigate suggestions
  - `Enter` - Select suggestion or search
  - `Escape` - Close suggestions
- **Smart Filtering**: Searches course titles, descriptions, and instructor names
- **Category Filtering**: Built-in category suggestions
- **Responsive**: Works on mobile and desktop
- **Accessible**: ARIA labels and keyboard support

### Search Store Methods

```tsx
const {
  query,
  setQuery,
  sortBy,
  setSortBy,
  selectedCategories,
  toggleCategory,
  clearFilters,
} = useSearchStore();
```

---

## Search Results Page

### Overview

A comprehensive search results page with filtering, sorting, pagination, and responsive design. Displays courses matching search queries and applied filters.

### Location

`src/app/search/page.tsx`

### Route

`/search?q=<query>&category=<category>`

### Features

- **URL-based Search**: Query params persist state
- **Filtering**:
  - By category (multi-select)
  - By search query
- **Sorting Options**:
  - Relevance (default)
  - Highest Rated
  - Newest First
  - Price: Low to High
  - Price: High to Low
- **Pagination**: Navigation between result pages
- **Responsive Design**: Sidebar filters on desktop, modal on mobile
- **Empty State**: Helpful message when no results found

### Integration

The page integrates:
- `SearchBar` component for search input
- `CourseCard` component for course display
- `useSearchStore` for filter state management
- URL search parameters

### Usage

```tsx
// Navigate to search page
router.push(`/search?q=${encodeURIComponent(query)}`);

// With category
router.push(`/search?category=Tailoring`);

// The page handles all filtering and display
```

### Mock Data

The page includes sample courses from all categories. In production, replace the `MOCK_COURSES` constant with API calls:

```tsx
// Example API integration
const [courses, setCourses] = useState<Course[]>([]);

useEffect(() => {
  // Fetch courses based on filters
  api.searchCourses({
    query,
    categories: selectedCategories,
    sortBy,
  }).then(setCourses);
}, [query, selectedCategories, sortBy]);
```

---

## Integration Guide

### In a Layout or Header

```tsx
import { SearchBar } from '@/components/search';
import { ShoppingCart } from '@/components/cart';
import { Button } from '@/components/ui/Button';
import { useCartStore } from '@/lib/hooks/use-cart-store';
import { ShoppingCart as CartIcon } from 'lucide-react';

export default function Header({ courses }: { courses: Course[] }) {
  const [showCart, setShowCart] = useState(false);
  const cartCount = useCartStore((s) => s.getItemCount());

  return (
    <header className="bg-white border-b">
      <div className="flex items-center gap-4">
        <SearchBar courses={courses} />
        
        <button 
          onClick={() => setShowCart(!showCart)}
          className="relative"
        >
          <CartIcon />
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </button>
      </div>

      {showCart && (
        <ShoppingCart isOpen onClose={() => setShowCart(false)} />
      )}
    </header>
  );
}
```

### In a Course Display

```tsx
import { CourseCard } from '@/components/courses/CourseCard';
import { Button } from '@/components/ui/Button';
import { useCartStore } from '@/lib/hooks/use-cart-store';

export default function CourseDetail({ course }: { course: Course }) {
  const addItem = useCartStore((s) => s.addItem);

  return (
    <div>
      <CourseCard course={course} />
      <Button 
        onClick={() => addItem(course)}
        size="lg"
        fullWidth
      >
        Add to Cart
      </Button>
    </div>
  );
}
```

---

## Styling

All components follow the Hamplard design system:

### Color Palette
- **Primary**: `hamplard-primary` (#7F77DD)
- **Secondary**: `hamplard-lilac` (#EEEDFE)
- **Text**: `ink-*` colors
- **Accent**: `saffron-*` colors
- **Success**: `leaf-*` colors

### Typography
- Font Family: `DM Sans` (system-ui fallback)
- Display Font: `Playfair Display`
- Uses CSS variables for responsive sizing

### Spacing
Uses consistent spacing scale (1, 2, 3, 4, 5, 6, 8, 10, 12, 16)

---

## Testing

Visit `/components-demo` to see an interactive demo of all components.

---

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

---

## Accessibility

All components include:
- ARIA labels and roles
- Keyboard navigation support
- Focus indicators
- Color contrast compliance
- Semantic HTML

---

## Future Enhancements

- [ ] Add animations for cart item transitions
- [ ] Implement real API integration for search
- [ ] Add filters for price range
- [ ] Add rating filters
- [ ] Implement saved searches
- [ ] Add wishlist integration to cart
- [ ] Add export cart functionality
- [ ] Implement search analytics
