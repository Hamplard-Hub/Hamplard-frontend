# Hamplard — Frontend Repo

> **Next.js 14 frontend for Africa's practical skills online learning platform**

This is **Repo 3 of 3** in the Hamplard project:

| Repo | Description |
|------|-------------|
| `hamplard-contract` | Soroban smart contract — course payments + certificates |
| `hamplard-backend` | NestJS API — content, progress, users |
| `hamplard-frontend` ← you are here | Next.js 14 — student and instructor portal |

---

## Pages

| Route | Auth | Description |
|---|---|---|
| `/` | — | Public course marketplace with search and category filters |
| `/auth/login` | — | Freighter wallet connect with student/instructor role selection |
| `/dashboard/courses` | ✓ | Student: enrolled courses. Instructor: redirects to instructor dashboard |
| `/dashboard/courses/:id` | — | Course detail page — overview, curriculum, enroll button |
| `/dashboard/courses/:id/learn` | ✓ | Video player with lesson sidebar, progress tracking, completion |
| `/dashboard/courses/create` | ✓ INSTRUCTOR | Create course form with on-chain registration |
| `/dashboard/instructor` | ✓ INSTRUCTOR | Revenue stats + my courses list |
| `/dashboard/certificates` | ✓ | Student's earned certificates with copy + share links |
| `/certificates/:id` | — | **Public** certificate verification page (no login needed) |
| `/notifications` | ✓ | Notification feed with colour-coded types |

---

## Design System

Hamplard's foundational token system is documented in:

- `src/styles/tokens.css` (source of truth for CSS variables)
- `design-system-tokens.md` (hex/RGB usage notes + WCAG checks)
- `typography-system.md` (modular type scale and semantic text roles)

**Typography:**
- Display headings: Playfair Display (serif)
- Body: DM Sans
- Code/IDs: JetBrains Mono

---

## Key Features

**Public course marketplace** (`/`) — browse, search, and filter active courses by category and level without signing in. The homepage shows a category pill bar with all eight Hamplard skill areas.

**Role-aware login** (`/auth/login`) — the login page has a student/instructor toggle. First-time users pick their role here and it is set on their account.

**Course learn page** (`/dashboard/courses/:id/learn`) — full-screen layout with a lesson sidebar (modules expanded/collapsed, completed lessons marked with checkmarks) and a main content area with the video player. Students click "Mark complete" after each lesson. Progress percentage updates live.

**Certificate verification page** (`/certificates/:id`) — a public, shareable page showing a gold certificate with the student's name, course title, instructor, issue date, and blockchain verification status. Uses server-side rendering for fast sharing.

**Instructor course creation** — three-step flow: fill in course details → upload thumbnail → register on Stellar via Freighter → submit for admin review. The form generates a unique `courseId` automatically.

---

## Setup

```bash
cp .env.example .env.local   # fill in contract ID + backend URL
npm install
npm run dev                   # → http://localhost:3001
```

Install [Freighter](https://freighter.app) and switch it to Testnet.

---

## License

MIT
