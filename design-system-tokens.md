# Hamplard Design System Tokens

Foundational token reference for all Hamplard UI implementation.

## Brand Colors

| Token | Hex | RGB | Usage Context |
|---|---|---|---|
| `color-brand-deep` | `#26215C` | `rgb(38, 33, 92)` | Brand/nav/headings, high-emphasis text |
| `color-brand-primary` | `#7F77DD` | `rgb(127, 119, 221)` | Brand accents, fills, CTA surfaces |
| `color-brand-lilac` | `#EEEDFE` | `rgb(238, 237, 254)` | Subtle backgrounds, tags, pills |
| `color-brand-white` | `#FFFFFF` | `rgb(255, 255, 255)` | Page base, inverse text surface |
| `color-brand-mid` | `#3C3489` | `rgb(60, 52, 137)` | Hover/focus states, accessible links |

## Semantic Aliases

Defined in `src/styles/tokens.css`.

- `--color-bg-page`, `--color-bg-surface`, `--color-bg-subtle`, `--color-bg-primary`
- `--color-text-body`, `--color-text-heading`, `--color-text-muted`, `--color-text-link`
- `--color-border-default`, `--color-border-strong`, `--color-focus-ring`

## Spacing Scale (4px Base)

| Token | Rem | Px |
|---|---|---|
| `--space-1` | `0.25rem` | `4px` |
| `--space-2` | `0.5rem` | `8px` |
| `--space-3` | `0.75rem` | `12px` |
| `--space-4` | `1rem` | `16px` |
| `--space-5` | `1.25rem` | `20px` |
| `--space-6` | `1.5rem` | `24px` |
| `--space-8` | `2rem` | `32px` |
| `--space-10` | `2.5rem` | `40px` |
| `--space-12` | `3rem` | `48px` |
| `--space-16` | `4rem` | `64px` |

## Radius Scale

- `--radius-sm` (`6px`)
- `--radius-md` (`8px`)
- `--radius-lg` (`12px`)
- `--radius-xl` (`16px`)
- `--radius-2xl` (`20px`)
- `--radius-pill` (`999px`)

## Shadow Scale

- `--shadow-sm`: subtle component elevation
- `--shadow-md`: default card elevation
- `--shadow-lg`: lifted overlays and prominent cards
- `--shadow-focus`: accessible focus ring treatment

## Typography Tokens

- Families: `--font-family-sans`, `--font-family-display`, `--font-family-mono`
- Scale primitives: `--font-size-xs` through `--font-size-5xl`
- Semantic type levels: `--type-h1-*` through `--type-overline-*`
- Weights: `--font-weight-regular` through `--font-weight-bold`
- Line heights: `--line-height-tight`, `--line-height-base`, `--line-height-relaxed`, `--line-height-loose`
- Tracking: `--letter-spacing-tight`, `--letter-spacing-normal`, `--letter-spacing-wide`, `--letter-spacing-wider`
- Full specification: `typography-system.md`

## WCAG 2.1 AA Contrast Verification

Verified normal-text compliant pairs (>= 4.5:1):

- `#26215C` on `#FFFFFF`
- `#3C3489` on `#FFFFFF`
- `#26215C` on `#EEEDFE`
- `#FFFFFF` on `#3C3489`

Implementation note: use `--color-text-link` (`#3C3489`) for body-sized links on light backgrounds. Reserve `#7F77DD` for larger UI surfaces and decorative accents.

## Dark Mode Extension Hook

Dark mode is scaffolded through `[data-theme='dark']` overrides in `src/styles/tokens.css`, so theme extension can happen without changing component class APIs.
