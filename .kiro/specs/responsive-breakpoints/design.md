# Technical Design - Responsive Breakpoints and Layout Grid

## Overview

A comprehensive responsive grid system and breakpoint strategy for Hamplard across all device sizes. This document establishes the single source of truth for layout, spacing, and component behavior across mobile, tablet, and desktop devices. All page designs must adapt gracefully using these specifications.

---

## Breakpoint Strategy

Five distinct breakpoints define responsive behavior:

| Device | Width | Breakpoint | Use Case |
|---|---|---|---|
| **Mobile** | 375px | `xs` | Small phones (iPhone SE, older devices) |
| **Tablet** | 768px | `md` | Tablets (iPad mini, standard tablets) |
| **Laptop** | 1024px | `lg` | Laptops, small desktops (MacBook Air, older desktops) |
| **Desktop** | 1280px | `xl` | Standard desktops (27" monitor, common laptops) |
| **Wide** | 1440px | `2xl` | Large monitors, ultrawide displays |

### Tailwind Configuration

```js
// tailwind.config.js
module.exports = {
  theme: {
    screens: {
      'xs': '375px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1440px',
    },
    extend: {
      spacing: {
        'gutter-xs': '1rem',    // 16px
        'gutter-md': '1.5rem',  // 24px
        'gutter-lg': '2rem',    // 32px
        'gutter-xl': '3rem',    // 48px
      },
    },
  },
};
```

---

## Grid System

### Column Layout

Hamplard uses a flexible column grid:

| Breakpoint | Columns | Use |
|---|---|---|
| 375px (mobile) | 4 columns | Tight layouts, single-column content with optional sidebar |
| 768px (tablet) | 8 columns | Two-column layouts, medium content |
| 1024px+ (desktop) | 12 columns | Full three-column layouts, sidebars, complex grids |

### Gutter and Margins

#### Mobile (375px)

- **Page margin:** 1rem (16px) left/right
- **Column gutter:** 1rem (16px) between columns
- **Container width:** 343px (375 - 32)
- **Content padding:** 1rem (16px) inside cards

#### Tablet (768px)

- **Page margin:** 1.5rem (24px) left/right
- **Column gutter:** 1.5rem (24px) between columns
- **Container width:** 720px (768 - 48)
- **Content padding:** 1.5rem (24px) inside cards

#### Laptop (1024px)

- **Page margin:** 2rem (32px) left/right
- **Column gutter:** 2rem (32px) between columns
- **Container width:** 960px (1024 - 64)
- **Content padding:** 2rem (32px) inside cards

#### Desktop (1280px+)

- **Page margin:** 3rem (48px) left/right
- **Column gutter:** 2rem (32px) between columns
- **Container width:** 1216px (1280 - 64) or wider
- **Content padding:** 2rem-3rem inside cards

### Common Patterns

#### Full-Width Container with Responsive Padding

```tsx
<div className="w-full px-4 md:px-6 lg:px-8">
  {/* Responsive padding: 16px at mobile, 24px at tablet, 32px at desktop */}
</div>
```

#### Grid Layouts

```tsx
{/* Mobile: 1 col, Tablet: 2 cols, Desktop: 3 cols */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
  {/* Items */}
</div>
```

#### Sidebar Layouts

```tsx
{/* Mobile: stacked, Tablet+: sidebar */}
<div className="flex flex-col lg:flex-row gap-6">
  <div className="lg:w-72 flex-shrink-0">
    {/* Sidebar: 288px on desktop, full width on mobile */}
  </div>
  <div className="flex-1">
    {/* Main content */}
  </div>
</div>
```

---

## Navigation Pattern

### Mobile (375px)

- **Top nav height:** 3.5rem (56px)
- **Bottom nav height:** 4rem (64px)
- **Layout:**
  - Hamburger menu icon at top left
  - Logo/brand center-aligned in top nav
  - Bottom navigation bar with 5 primary tabs: Home, Courses, Messages, Instructor (if applicable), Account
  - Each tab has icon + label (hidden on very small screens)
  - Drawer navigation expands from hamburger menu with secondary links

### Tablet (768px)

- **Top nav height:** 4rem (64px)
- **Bottom nav:** Optional, can collapse into top nav
- **Layout:**
  - Logo left-aligned in top nav
  - Primary nav links centered or right-aligned
  - Bottom nav transforms to horizontal top nav secondary items
  - Sidebar becomes available for course list / filters

### Laptop (1024px+)

- **Top nav height:** 4rem (64px)
- **Bottom nav:** Removed
- **Layout:**
  - Logo left-aligned
  - All primary nav links in top bar
  - Secondary items in dropdown menus
  - No bottom nav; use sidebar on content pages

### Touch Target Minimums

All interactive elements (buttons, links, radio buttons, checkboxes) must meet:
- **Minimum size:** 44x44px
- **Minimum padding:** 12px around label text
- **Spacing:** 8px min between touch targets

---

## Typography Scaling

Font sizes scale gracefully across breakpoints:

| Element | Mobile (375px) | Tablet (768px) | Desktop (1024px+) |
|---|---|---|---|
| h1 (Display) | 28px (1.75rem) | 32px (2rem) | 40px (2.5rem) |
| h2 (Heading) | 24px (1.5rem) | 28px (1.75rem) | 32px (2rem) |
| h3 (Subheading) | 20px (1.25rem) | 22px (1.375rem) | 24px (1.5rem) |
| Body (base) | 16px (1rem) | 16px (1rem) | 16px (1rem) |
| Small | 14px (0.875rem) | 14px (0.875rem) | 14px (0.875rem) |
| Caption | 12px (0.75rem) | 12px (0.75rem) | 12px (0.75rem) |

---

## Component Behavior Across Breakpoints

### Cards and Containers

| Aspect | Mobile | Tablet | Desktop |
|---|---|---|---|
| **Border Radius** | 8px | 8px | 12px |
| **Shadow** | sm | md | md |
| **Padding** | 1rem | 1.5rem | 2rem |
| **Gap between** | 1rem | 1.5rem | 2rem |

### Images

| Aspect | Mobile | Tablet | Desktop |
|---|---|---|---|
| **Course Card Image** | 100% width, 200px height | 100% width, 200px height | 100% width, 220px height |
| **Avatar (small)** | 40x40px | 40x40px | 48x48px |
| **Avatar (large)** | 80x80px | 100x100px | 120x120px |
| **Thumbnail** | 60x60px | 80x80px | 100x100px |

### Forms

| Aspect | Mobile | Tablet | Desktop |
|---|---|---|---|
| **Input Height** | 44px (min) | 44px | 48px |
| **Button Height** | 44px | 44px | 48px |
| **Gap between inputs** | 1rem | 1rem | 1.5rem |
| **Label size** | 14px | 14px | 16px |

### Modal/Dialog

| Aspect | Mobile | Tablet | Desktop |
|---|---|---|---|
| **Width** | 90vw (max 343px) | 80vw (max 600px) | 600px |
| **Padding** | 1rem | 1.5rem | 2rem |
| **Max Height** | 90vh | 90vh | 80vh |

---

## Responsive Behavior Decisions

### When Components Reflow

The following behaviors occur at specified breakpoints:

#### Mobile (≤375px)

- **Single column layouts** everywhere (cart, settings, course list)
- **Stacked sidebars** (no fixed left/right sidebars)
- **Full-width modals** (90% viewport width)
- **Hidden secondary navigation** (hidden in hamburger menu)
- **Bottom navigation bar** active (5 main tabs)
- **Collapsed filters** (collapsible section instead of fixed sidebar)

#### Tablet (376-768px)

- **Two-column layouts** available (sidebar + content)
- **Flexible sidebar** (can collapse with toggle button)
- **Half-width modals** (80% viewport width)
- **Top navigation persists** (all primary links visible or in dropdown)
- **Grid layouts begin** (2-column course cards, 2-column settings forms)
- **Bottom nav optional** (can integrate into top nav)

#### Laptop (769-1024px)

- **Three-column layouts** possible (left sidebar, center content, right panel)
- **Sticky sidebars** common (left nav, right panel for notes, Q&A)
- **Dropdown menus** for secondary navigation
- **Modal standard width** (600px)
- **Grid layouts expand** (3+ column grids for course cards, analytics)
- **No bottom navigation** (all nav in top bar or sidebars)

#### Desktop (1025px+)

- **Maximum content width** (1216px) to avoid overly wide text lines
- **Generous spacing** (3rem padding, 2rem gaps)
- **Three-panel layouts** standard (sidebar | content | details)
- **Multi-column grids** (4+ columns for large displays)
- **Larger touch targets** (touch-friendly even though mostly mouse input)

### When Components Collapse

| Component | Collapses At | Behavior |
|---|---|---|
| **Sidebar navigation** | < 1024px | Becomes hamburger drawer or bottom nav |
| **Right panel** | < 1024px | Moves to tab on mobile, visible on desktop |
| **Filters sidebar** | < 768px | Collapses into "Show Filters" button, overlay modal |
| **Course grid columns** | < 768px | Reduces from 3 to 2 columns at tablet, 1 at mobile |
| **Form layout** | < 768px | Stacks inputs vertically instead of side-by-side |
| **Data table** | < 768px | Hides columns, shows horizontal scroll or card view |

### When Components Hide

| Component | Hidden At | Shown At |
|---|---|---|
| **Instructor stats sidebar** | < 1024px | 1024px+ (laptop) |
| **Secondary nav items** | < 768px | 768px+ (tablet) |
| **Course carousel** | Mobile only | Shows on tablet+ with scroll |
| **Pagination** | Mobile (use "Load More") | Tablet+ (numeric pagination) |

---

## Specific Page Annotations

### Homepage / Course Browser

#### Mobile Layout (375px)

```
┌────────────────────────────────────┐
│ ☰  [Logo]  [Account]               │  ← 56px top nav
├────────────────────────────────────┤
│ Welcome to Hamplard                │
│ [Search Input - full width]        │ ← 44px min height
│                                    │
│ [Show Filters ▼]                   │ ← Expandable filter drawer
│                                    │
│ Course Card 1 (full width)         │
│ [Thumbnail 100%] 200px height      │
│ "Title" | Price | ⭐ (4.8)        │
│ [Enroll]                           │
│                                    │
│ Course Card 2 (full width)         │
│ ...                                │
│                                    │
│ [Load More Courses]                │ ← "Load More" pattern on mobile
├────────────────────────────────────┤
│ 🏠 Courses Messages 👤 More ✓      │  ← 64px bottom nav
└────────────────────────────────────┘
```

#### Tablet Layout (768px)

```
┌─────────────────────────────────────────────┐
│ [☰ Logo] [Nav Links] [Account Dropdown]     │  ← 64px top nav
├─────────────────────────────────────────────┤
│                                             │
│  [Filters] │ Course Grid (2 cols)          │
│  Category  │ ┌─────────┐ ┌─────────┐      │
│  Level     │ │Card 1   │ │Card 2   │      │
│  Rating    │ │ 200px   │ │ 200px   │      │
│  [▼ More]  │ └─────────┘ └─────────┘      │
│            │ ┌─────────┐ ┌─────────┐      │
│            │ │Card 3   │ │Card 4   │      │
│            │ │ 200px   │ │ 200px   │      │
│            │ └─────────┘ └─────────┘      │
│            │ [Pagination: 1 2 3 4 >]      │
│                                             │
└─────────────────────────────────────────────┘
```

#### Desktop Layout (1024px+)

```
┌──────────────────────────────────────────────────────────┐
│ [Logo] [Home] [Courses] [For Instructors] [Account ▼]   │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ [Filters Sidebar]  Course Grid (3-4 cols)               │
│ w-72 (288px)       ┌────────┐ ┌────────┐ ┌────────┐   │
│                    │Card 1  │ │Card 2  │ │Card 3  │   │
│ Category           │ 220px  │ │ 220px  │ │ 220px  │   │
│ • Web Dev (42)     │        │ │        │ │        │   │
│ • Data Sci (28)    └────────┘ └────────┘ └────────┘   │
│ • Design (15)      ┌────────┐ ┌────────┐ ┌────────┐   │
│                    │Card 4  │ │Card 5  │ │Card 6  │   │
│ Level              │ 220px  │ │ 220px  │ │ 220px  │   │
│ • Beginner (60)    │        │ │        │ │        │   │
│ • Intermediate     └────────┘ └────────┘ └────────┘   │
│ • Advanced         [Pagination: 1 2 3 4 >]             │
│                                                          │
│ [Clear Filters]                                         │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Course Detail Page

#### Mobile (375px)

```
┌────────────────────────────────┐
│ ☰ Back                          │
├────────────────────────────────┤
│ [Video Thumbnail / Player]     │ ← 16:9 aspect ratio, full width
│                                │
│ Course Title                   │
│ Instructor Name | ⭐ 4.8 (23) │
│ $99.99 [Enroll / In Cart]      │
│                                │
│ Description                    │
│ Lorem ipsum dolor sit amet...  │
│                                │
│ [Expand More ▼]                │
│                                │
│ Curriculum (12 lessons)        │
│ [Module 1 ▼]                   │
│ • Lesson 1                     │
│ • Lesson 2                     │
│ [Module 2 ▼]                   │
│ • Lesson 3                     │
│                                │
│ Student Reviews                │
│ ⭐⭐⭐⭐⭐ "Great course!"   │
│                                │
├────────────────────────────────┤
│ [Enroll Now]                   │
└────────────────────────────────┘
```

#### Desktop (1024px+)

```
┌──────────────────────────────────────────────────────┐
│ [Back] Course: [Title] | Instructor                  │
├──────────────────────────────────────────────────────┤
│                                                      │
│ [Video Player 16:9]  │ Order Summary (w-80)        │
│ 60% width            │ w-80 sticky top-20          │
│                      │ Course Title                │
│                      │ $99.99                      │
│                      │ ⭐ 4.8 (23 reviews)        │
│                      │ • 12 lessons                │
│                      │ • 6 hours total             │
│                      │ [Enroll Now]               │
│                      │ [or Add to Cart]           │
│                      │                            │
│ Description          │                            │
│ Curriculum           │                            │
│ Modules (expandable) │                            │
│                      │                            │
│ Reviews              │                            │
│                      │                            │
└──────────────────────────────────────────────────────┘
```

### Learning Page (Video Player)

#### Mobile (375px)

```
┌────────────────────────────┐
│ ☰ [Back] [Lesson Progress] │  ← 56px nav
├────────────────────────────┤
│ [Video Player]             │ ← 16:9 aspect ratio, full width
│ ┌──────────────────────────┐
│ │  ▶ [Pause]               │
│ │ [Progress Bar]           │
│ │ [Controls: 🔊 ⚙ ⛶]     │
│ └──────────────────────────┘
│                            │
│ Lesson Title              │
│ Module 1 > Lesson 1       │
│                            │
│ Description               │
│ [Curriculum ▼]            │
│                            │
│ [← Prev] [Next →]        │
│ [Mark Complete]           │
│                            │
│ [Notes] [Q&A] [Resources] │ ← Tab nav (scrollable if needed)
├────────────────────────────┤
│ Sticky [Continue ▼]        │
└────────────────────────────┘
```

#### Desktop (1024px+)

```
┌───────────────────────────────────────────────────────┐
│ ☰ [Back] [Lesson Progress] [Dashboard] [Account]     │
├──┬─────────────────────────────────────┬─────────────┤
│  │ [Video Player - 16:9]               │ Notes Tab  │
│  │ [████████•──────── 5:42 / 10:30]   │            │
│  │ [▶] [Vol] [1×] [⛶]                │ [Notes]    │
│  │                                     │ [Save]    │
│  │ Lesson 1: Intro                    │            │
│  │ [← Prev] [Mark Complete] [Next →]  │            │
│  │                                     │ [Q&A Tab] │
│  │                                     │ [Res Tab] │
│  │                                     │            │
│ [Module 1 ▼] Sidebar (w-72)            │            │
│ ✓ Lesson 1 (active)  Progress %        │            │
│ ○ Lesson 2           Bar               │            │
│ ○ Lesson 3                             │            │
│                                         │            │
│ [Module 2 ▼]                           │            │
│ ○ Lesson 4                             │            │
│ ○ Lesson 5                             │            │
│                                         │            │
└───────────────────────────────────────────────────────┘
```

### Dashboard (Student Courses)

#### Mobile (375px)

```
┌────────────────────────────────┐
│ ☰ Dashboard              [+New]│
├────────────────────────────────┤
│ Your Courses                   │
│ [12 Enrolled] [4 Completed]   │
│                                │
│ Course Card 1 (full width)     │
│ [Thumb 100%]                   │
│ "Title" | 45% Progress ▶       │
│ [Continue Learning]            │
│                                │
│ Course Card 2                  │
│ ...                            │
│                                │
│ [Load More]                    │
│                                │
│ Completed Certificates (2)     │
│ [Cert 1] [Cert 2]             │
│                                │
├────────────────────────────────┤
│ 🏠 Courses Messages 👤 ✓      │
└────────────────────────────────┘
```

#### Desktop (1024px+)

```
┌──────────────────────────────────────────────────────────┐
│ [Logo] [Dashboard] [Instructor] [Messages] [Account ▼]  │
├──┬────────────────────────────────────────────────────┤
│  │ Your Courses                                       │
│  │ [12 Enrolled] [4 Completed] [Search...] [Sort ▼] │
│  │                                                    │
│  │ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ │Course 1  │ │Course 2  │ │Course 3  │           │
│  │ │[Thumb]   │ │[Thumb]   │ │[Thumb]   │           │
│  │ │45% ▶     │ │30% ▶     │ │100% ✓   │           │
│  │ └──────────┘ └──────────┘ └──────────┘           │
│  │ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ │Course 4  │ │Course 5  │ │Course 6  │           │
│  │ │[Thumb]   │ │[Thumb]   │ │[Thumb]   │           │
│  │ │60% ▶     │ │0% ▶      │ │100% ✓   │           │
│  │ └──────────┘ └──────────┘ └──────────┘           │
│  │                                                    │
│  │ Completed Certificates (4)                       │
│  │ [Cert 1] [Cert 2] [Cert 3] [Cert 4]            │
│  │                                                    │
│  │ [Pagination: 1 2 3 >]                            │
│  │                                                    │
└──────────────────────────────────────────────────────┘
```

---

## Implementation Checklist

### For All Pages

- [ ] Verify layout works at 375px (mobile minimum)
- [ ] Verify layout works at 768px (tablet transition)
- [ ] Verify layout works at 1024px (desktop expansion)
- [ ] Verify layout works at 1440px (wide monitor)
- [ ] All touch targets are minimum 44x44px
- [ ] All spacing follows gutter guidelines (1rem mobile, 1.5rem tablet, 2rem desktop)
- [ ] Typography scales appropriately (no text truncation at mobile)
- [ ] Images scale responsively (no fixed widths; use max-w and relative sizing)
- [ ] Forms are mobile-friendly (inputs 44px tall minimum, labels above on mobile)
- [ ] Navigation collapses appropriately (hamburger on mobile, top nav on desktop)
- [ ] Modals are full-width on mobile (90vw max), medium on tablet (80vw), fixed on desktop

### Specific Checks

- [ ] Course cards display 1 column on mobile, 2 on tablet, 3-4 on desktop
- [ ] Sidebars collapse to drawer/hamburger on mobile
- [ ] Tables become cards on mobile
- [ ] Sticky elements (nav, footers) don't obstruct 50% of viewport height on mobile
- [ ] Text is readable without zoom at default viewport width
- [ ] Buttons are vertically stackable on mobile (no horizontal overflow)
- [ ] Images load correctly at all breakpoints (lazy loading on mobile)

---

## No New Dependencies

All responsive behavior implemented using:
- Tailwind CSS responsive prefixes (`sm:`, `md:`, `lg:`, `xl:`, `2xl:`)
- CSS Grid and Flexbox
- Native HTML5 viewport meta tag
- No external responsive utility libraries needed
