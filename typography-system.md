# Hamplard Typography System

This document defines Hamplard's unified typography system for course marketplace, dashboard, and learning pages.

## Font Pairing

- Heading font: `Playfair Display` (`--font-family-display`)
- Body/UI font: `DM Sans` (`--font-family-sans`)

This pairing keeps large titles distinctive while preserving readable UI/body text similar to clean course-platform layouts.

## Type Scale (All in rem)

| Level | Token Prefix | Size (rem) | Line Height | Letter Spacing | Weight | Primary Usage |
|---|---|---:|---:|---:|---:|---|
| H1 | `--type-h1-*` | `2.75rem` | `1.1` | `-0.02em` | `700` | Page hero titles, key marketing headlines |
| H2 | `--type-h2-*` | `2.25rem` | `1.15` | `-0.018em` | `700` | Section headers, major dashboard blocks |
| H3 | `--type-h3-*` | `1.875rem` | `1.2` | `-0.015em` | `600` | Content section headers, panel titles |
| H4 | `--type-h4-*` | `1.5rem` | `1.3` | `0em` | `600` | Course titles in cards/lists |
| H5 | `--type-h5-*` | `1.25rem` | `1.35` | `0em` | `600` | Subsection titles |
| H6 | `--type-h6-*` | `1.125rem` | `1.4` | `0em` | `600` | Compact heading UI |
| Body | `--type-body-*` | `1rem` | `1.65` | `0em` | `400` | Paragraphs, lesson descriptions |
| Body Strong | `--type-body-strong-*` | `1rem` | `1.5` | `0em` | `500` | Emphasized body copy |
| Caption | `--type-caption-*` | `0.875rem` | `1.5` | `0.01em` | `400` | Metadata, timestamps, helper text |
| Label | `--type-label-*` | `0.875rem` | `1.4` | `0.02em` | `600` | Form labels, instructor names, UI labels |
| Overline | `--type-overline-*` | `0.75rem` | `1.4` | `0.08em` | `600` | Category tags, small uppercase headers |

## Semantic Role Helpers

Reusable role classes are available in `src/styles/tokens.css`:

- `type-course-title`
- `type-instructor-name`
- `type-ui-text`

Use these for fast consistency across course cards, profile snippets, and dashboard controls.

## Accessibility

- All font sizes are defined in `rem` to honor user/browser text scaling.
- Body text uses relaxed line-height (`1.65`) for readability.
- Labels/captions keep conservative weights and spacing for legibility.
- The scale remains readable at default and large text sizes because values are relative (`rem`) and line heights are unitless.

## Implementation References

- Source tokens: `src/styles/tokens.css`
- Global heading/body defaults: `src/styles/globals.css`
- Tailwind aliases: `tailwind.config.js` (`text-h1`, `text-body`, `text-caption`, etc.)
