# Fix Report — Course Hover Prefetching

**Issue:** Add course hover prefetching so Next.js prefetches a course's data and page bundle when a user hovers a `CourseCard` (200 ms delay, cancel on early leave, pointer devices only).
**Repo:** `Kappa16/Hamplard-frontend` (Next.js 14.2, App Router, React 18, TypeScript, Tailwind, Vitest + Testing Library)

---

## 1. What the codebase is

Hamplard is a Next.js 14 **App Router** frontend for an African practical-skills learning platform
(Stellar/USDC payments, React Query, Zustand stores). `src/components/courses/CourseCard.tsx`
is the central course card used on ~8 surfaces (course browse, search, home carousels,
wishlist, bundles, instructor dashboard). Each card is wrapped in a `next/link` `<Link>`
pointing at `dest = href ?? /dashboard/courses/{course.id}`, and it already had
`onMouseEnter`/`onMouseLeave` handlers powering a 200 ms hover-preview tooltip.

## 2. The issue found

There was **no hover prefetching anywhere** — nothing calls `router.prefetch()` and no
`src/lib/hooks/useHoverPrefetch.ts` existed. Navigation to a course page only benefited
from `next/link`'s default in-viewport prefetching; the requested hover-intent prefetch
(200 ms dwell → prefetch, early leave → cancel, touch devices → skip) was absent.

## 3. The fix

### New: `src/lib/hooks/useHoverPrefetch.ts`
A reusable hook returning `{ onMouseEnter, onMouseLeave }`:

- **`onMouseEnter`** — schedules `router.prefetch(href)` (from `next/navigation`) after a
  `delayMs` timer (default **200 ms**).
- **`onMouseLeave`** — clears the pending timer, so quick pass-overs fire **no request**.
- **Pointer-device gate** — evaluated once via `window.matchMedia('(hover: hover) and (pointer: fine)')`
  with a `change` listener (handles attach/detach of a mouse). Touch-primary devices never
  match, so they never prefetch. If `matchMedia` is unavailable (SSR / old test envs), the
  hook treats the device as touch and stays inert — no crash.
- **Unmount cleanup** — a pending prefetch is cancelled if the card unmounts mid-hover.
- The hook never touches `window` during render (SSR-safe); it takes the href as an
  argument so it is generic and reusable.

### Modified: `src/components/courses/CourseCard.tsx` (+7 lines)
- Calls `const hoverPrefetch = useHoverPrefetch(dest)` where `dest` is the card's **actual
  link destination**.
- `hoverPrefetch.onMouseEnter()` / `hoverPrefetch.onMouseLeave()` are invoked from the
  existing mouse handlers (alongside the unchanged tooltip logic, which keeps its own timer).

> **Why `dest` and not a hard-coded `/courses/{id}`:** the issue's literal example
> `router.prefetch('/courses/' + courseId)` matches the card usage that passes
> `href={'/courses/${course.id}'}` (e.g. `RecentlyViewed`). But most cards navigate to
> `/dashboard/courses/{id}` (the README's "course detail page"). Prefetching the card's
> real destination is the only way to satisfy the acceptance criterion
> *"course page loads instantly after hovering a card"* — prefetching a route the card
> never navigates to would waste bandwidth and fail that criterion. Wherever a card is
> pointed at `/courses/{courseId}`, the hook prefetches exactly that URL.

### Modified: `src/components/courses/CourseCard.test.tsx`
- Added the repo-standard `vi.mock('next/navigation', …)` (same pattern as the login/signup
  tests) exposing a spied `useRouter().prefetch`.
- Added a `window.matchMedia` stub (jsdom does not implement it) defaulting to a
  fine-pointer device.
- New `describe('Hover Prefetching')` suite — 5 tests covering all acceptance criteria.

### Modified: `src/test/search-page.skeleton.test.tsx`
- Its existing `next/navigation` mock only provided `useSearchParams`. Since `CourseCard`
  now also uses `useRouter`, the mock gained a `useRouter` stub (mock-only change; required
  because Next's `useRouter` throws outside the App Router, which is expected in unit tests).

### New: `src/lib/hooks/useHoverPrefetch.test.tsx`
- 10 unit tests for the hook: default 200 ms delay boundary (199/200 ms), custom delay,
  cancel-on-leave, immediate-leave, touch-device skip, missing-matchMedia safety,
  null/undefined href, unmount cancellation, repeat hovers, href changes.

## 4. Validation summary

| Check | Result |
|---|---|
| `CourseCard.test.tsx` | **29/29 pass** (24 pre-existing + 5 new) |
| `useHoverPrefetch.test.tsx` | **10/10 pass** (new) |
| `search-page.skeleton.test.tsx` | **2/2 pass** |
| Full `npm test` (vitest) | **144 passed, 5 failed** — the 5 failures are identical to the pristine-main baseline (login page ×4, pagination ×1) plus 2 pre-existing collection errors (payment-form: missing `@stripe/react-stripe-js` dep; e2e spec: Playwright not part of vitest). **Zero regressions.** |
| `tsc --noEmit` | **0 errors** in all touched files; total error count identical to pristine main (27 pre-existing in unrelated badly-merged files) |
| ESLint (touched files) | 0 errors (1 pre-existing `<img>` warning inside the test's pre-existing next/image mock) |
| esbuild bundle of `CourseCard.tsx` + hook | compiles cleanly |
| `next build` | Fails with the **exact same error set as pristine `main`** (verified via `git stash`): `ShoppingCart.tsx`, `CheckoutContent.tsx`, `certificates/[id]/page.tsx` syntax errors + missing `recharts` dependency — all pre-existing, none caused by or interacting with this fix |
| Dev-server runtime | `/search` (renders CourseCards) returns 200; its compiled client bundle verifiably contains the hook import, the `(hover: hover) and (pointer: fine)` query, and the wired `hoverPrefetch.onMouseEnter/Leave` calls |
| SSR safety | Hook only reads `window` inside effects; `/login` (same `next/navigation` pattern) SSRs fine |

**Note on "network tab shows prefetch request":** Next.js 14 deliberately no-ops
`router.prefetch()` **in development** (see `app-router.js`: *"Don't prefetch during
development (improves compilation performance)"*). The prefetch request is only observable
on a **production** build (`npm run build && npm start`). The unit tests assert the
`router.prefetch` call itself, which is the app-level contract.

**Confidence: ~96%.** All requirements are implemented, unit-tested (15 new tests), type-checked,
bundled, and shown to introduce zero regressions. The residual uncertainty is only that a
production-build network observation isn't possible here because `main` itself does not build
(pre-existing unrelated breakage).

## 5. Pre-existing issues discovered (NOT caused by this fix, not modified)

1. `package-lock.json` in the repo is **invalid JSON** (missing comma at ~position 97053) — `npm ci` fails outright.
2. `src/components/cart/ShoppingCart.tsx` — two implementations badly merged (duplicate imports, unbalanced braces) → syntax error.
3. `src/components/checkout/CheckoutContent.tsx` — same merge damage (duplicate `receipt` state, interleaved JSX) → syntax error.
4. `src/app/certificates/[id]/page.tsx` — `const DEFAULT_OG_IMAGE` declared twice.
5. `src/app/courses/page.tsx`, `src/components/courses/Quiz.tsx`, `src/components/learn/LearnSidebar.tsx` — syntax errors from bad merges (found by `tsc`).
6. `src/components/instructor/RevenueChart.tsx` imports `recharts`, which is not in `package.json`.
7. `src/lib/seo.ts` `absoluteUrl()` crashes (`path` undefined) → `/` returns 500 in dev.
8. `@stripe/react-stripe-js` is imported by `PaymentForm.tsx` but not declared in `package.json` → `payment-form.test.tsx` cannot even be collected.

These need separate fixes/PRs; they are outside this issue's scope and were intentionally left untouched.

## 6. Files changed

| File | Change |
|---|---|
| `src/lib/hooks/useHoverPrefetch.ts` | **NEW** — the hover-prefetch hook |
| `src/lib/hooks/useHoverPrefetch.test.tsx` | **NEW** — 10 hook unit tests |
| `src/components/courses/CourseCard.tsx` | **MODIFIED** (+7) — wires the hook into mouse handlers |
| `src/components/courses/CourseCard.test.tsx` | **MODIFIED** (+130) — router/matchMedia mocks + 5 prefetch tests |
| `src/test/search-page.skeleton.test.tsx` | **MODIFIED** (+9) — adds `useRouter` to existing `next/navigation` mock |
