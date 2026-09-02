# Profile Completion Progress Indicator

Closes #155

## Summary

This PR adds a profile completion progress indicator for the Hamplard frontend. Students and instructors can now see what profile information is missing and are encouraged to complete their profile. The indicator appears on the profile page and in the dashboard sidebar.

## Changes

### New Files
- **`src/lib/hooks/use-profile-completion.ts`** - Custom hook that calculates profile completion percentage and returns checklist items
- **`src/lib/hooks/use-profile-completion.test.ts`** - Comprehensive unit tests for the completion calculation logic
- **`src/components/dashboard/ProfileCompletion.tsx`** - Main profile completion component with sidebar and card variants
- **`src/components/dashboard/ProfileCompletion.test.tsx`** - Tests for the ProfileCompletion component

### Modified Files
- **`src/app/dashboard/profile/page.tsx`** - Added ProfileCompletion card variant to profile page
- **`src/components/layout/Sidebar.tsx`** - Added ProfileCompletion sidebar variant for students

## Feature Details

### Profile Completion Hook (`use-profile-completion`)
Calculates profile completion based on user data:

**For Students (4 items):**
- ✅ Profile photo (avatarUrl)
- ✅ Full name (name)
- ✅ Email address (email)
- ✅ Bio (bio)

**For Instructors (5 items):**
- ✅ Profile photo (avatarUrl)
- ✅ Full name (name)
- ✅ Email address (email)
- ✅ Bio (bio)
- ✅ Payout method (links to settings)

Returns:
- `percentage`: 0-100% completion
- `items`: Array of completion items with status and links
- `isComplete`: Boolean indicating 100% completion
- `completedCount` & `totalCount`: Item counts

### ProfileCompletion Component

#### Sidebar Variant
- Compact progress bar showing percentage and count (e.g., "Profile 60% complete")
- Animated progress bar with gradient color
- "Profile complete!" badge when at 100%
- Link to profile page for incomplete profiles
- Shown in sidebar footer for students only

#### Card Variant
- Full-featured completion card for profile page
- Progress bar with percentage and item count
- Clickable checklist of completion items
- Completed items: checkmark + strikethrough + green highlight
- Incomplete items: circle icon + link to relevant settings section
- "Profile complete!" badge at 100% with confirmation message
- Help text explaining benefits of profile completion
- Responsive design

### Integration Points

1. **Profile Page** (`/dashboard/profile`)
   - Card variant displayed in left sidebar below avatar upload
   - Updates in real-time as user saves profile changes

2. **Dashboard Sidebar**
   - Sidebar variant displayed in footer for students
   - Quick view of completion status
   - Persistent indicator across all dashboard pages

3. **Smart Linking**
   - Avatar, Name, Email, Bio → `/dashboard/profile`
   - Payout method (instructors) → `/dashboard/settings`

## Acceptance Criteria

- ✅ Percentage calculates correctly based on filled fields
- ✅ Each incomplete item links to the right settings section
- ✅ Progress bar animates smoothly when percentage changes
- ✅ Completion badge shows only at 100%
- ✅ Works for both students and instructors
- ✅ Includes payout method for instructors only
- ✅ Responsive on mobile and desktop
- ✅ Accessible with proper ARIA labels
- ✅ Comprehensive test coverage (40+ tests)

## Testing

### Hook Tests (15 tests)
- ✅ 0% completion when all fields empty
- ✅ Correct percentages for partial completion
- ✅ 100% completion when all fields filled
- ✅ Whitespace-only fields treated as incomplete
- ✅ Different item counts for student vs instructor
- ✅ Correct href assignments
- ✅ Null user handling

### Component Tests (25+ tests)
- ✅ Both card and sidebar variants
- ✅ 0% and 100% states
- ✅ Completion badge display logic
- ✅ Checklist item rendering
- ✅ Progress bar styling and ARIA attributes
- ✅ Link destinations
- ✅ Accessibility features
- ✅ Custom className support
- ✅ Instructor role handling

## Technical Details

### Technologies Used
- React Hooks (useMemo)
- TypeScript with full type safety
- Tailwind CSS for styling
- Lucide React for icons
- Vitest + React Testing Library

### Performance
- Uses `useMemo` to avoid unnecessary recalculations
- Memoized completion calculation on dependency changes
- Lightweight component with minimal re-renders

### Accessibility
- ✅ `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- ✅ `aria-label` for progress bar state
- ✅ Semantic HTML with proper link elements
- ✅ Color isn't the only indicator (text labels, icons)
- ✅ Clear visual hierarchy

### Browser Support
- All modern browsers
- Responsive design (mobile-first)
- Smooth CSS transitions

## Notes

### Future Enhancements
1. Payout method completion check will be updated once payout data is available in the User type
2. Could add analytics tracking for completion metrics
3. Could add email reminders for incomplete profiles

### Known Limitations
1. Payout method is currently hardcoded as incomplete (`false`)
2. Requires user to manually visit profile page to see updates reflected in sidebar (no real-time sync)

## Screenshots/Visual

### Sidebar Variant (Incomplete)
```
Profile 60% complete
[████████░░░░░░░░] (60%)
3/5
Complete profile →
```

### Sidebar Variant (Complete)
```
✓ Profile complete!
  All set for success
```

### Card Variant (Incomplete)
```
╔═══════════════════════════════╗
║ Profile Completion      60%   ║
║ [████████░░░░░░░░░░░░░░░░░░] ║
║ 3 of 5 items completed        ║
║                               ║
║ ✓ Profile photo              ║
║ ✓ Full name                  ║
║ ✓ Email address              ║
║ ○ Bio             →           ║
║ ○ Payout method   →           ║
║                               ║
║ Complete your profile to...   ║
╚═══════════════════════════════╝
```

## PR Checklist

- ✅ Code follows project conventions
- ✅ All tests passing
- ✅ Comprehensive test coverage
- ✅ TypeScript types properly defined
- ✅ Accessibility requirements met
- ✅ Responsive design verified
- ✅ No console errors or warnings
- ✅ Documentation and comments added
