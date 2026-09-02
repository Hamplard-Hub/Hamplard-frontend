# Countdown Timer Component for Limited Offers

Closes #153

## Summary

This PR implements a fully accessible countdown timer component for the Hamplard frontend. The component creates urgency around limited-time enrollment offers or sale prices by displaying a real-time countdown in DD:HH:MM:SS format.

## Changes

### New Files
- **`src/components/ui/CountdownTimer.tsx`** - Main countdown timer component
- **`src/components/ui/CountdownTimer.test.tsx`** - Comprehensive unit tests

### Modified Files
- **`src/components/ui/index.ts`** - Added CountdownTimer exports

## Technical Details

### Component Features
- **Props**: 
  - `expiresAt: Date` - The expiration date/time
  - `label?: string` - Custom label (defaults to "Offer expires in")
  - `onExpire?: () => void` - Callback fired when timer reaches zero
  - `className?: string` - Optional Tailwind classes
  
- **Display Format**: `DD : HH : MM : SS` with labels beneath each unit
- **Refresh Rate**: Updates every second using `setInterval`
- **Expiration State**: Shows "Offer ended" text when timer reaches zero
- **Cleanup**: Properly clears interval on component unmount

### Accessibility
- ✅ `role="timer"` for screen reader identification
- ✅ `aria-live="off"` to prevent noisy announcements (avoids interrupting users every second)
- ✅ Semantic HTML structure
- ✅ Forward ref support for imperative access

### Styling
- Uses Tailwind CSS with responsive design (`md:` breakpoints)
- Color scheme aligns with Hamplard design tokens:
  - Primary color for countdown values
  - Subdued colors for labels and separators
  - Rose-600 for "Offer ended" state
- Clean, centered layout with proper spacing

## Testing

Comprehensive test suite covering:
- ✅ Rendering with and without custom labels
- ✅ Countdown decrement logic
- ✅ Expiration callback execution
- ✅ "Offer ended" display state
- ✅ Interval cleanup on unmount
- ✅ No memory leaks on prop changes
- ✅ Accessibility attributes
- ✅ Edge cases (already expired, long durations)

## Acceptance Criteria

- ✅ Timer counts down correctly each second
- ✅ Reaches zero and shows "Offer ended" text correctly
- ✅ Interval cleaned up on component unmount
- ✅ Accessible with `role="timer"` and `aria-live="off"`
- ✅ All tests passing

## Usage Example

```tsx
import { CountdownTimer } from '@/components/ui';

export default function SaleSection() {
  const saleEnds = new Date('2026-12-31T23:59:59Z');
  
  return (
    <CountdownTimer 
      expiresAt={saleEnds}
      label="Limited offer ends in"
      onExpire={() => console.log('Sale ended!')}
    />
  );
}
```

## Notes
- Component uses client-side rendering (`'use client'`)
- No external dependencies beyond existing project libraries
- Fully TypeScript compatible with proper type exports
