# AGENTS.md — Kanban Board Project Guide

This document is the single source of truth for building the **Kanban Board** application.
It defines *what* we are building (business requirements), *what we will not* build (limitations),
*how* we build it (technical solutions & stack), *how it looks* (color palette & design),
and *how we write code* (coding standards). Any agent or developer contributing to this
repository must read and follow this document.

---

## 1. Business Requirements

### 1.1 Product Vision
A web-based Kanban board that lets every registered user organize work visually. Each user
manages their own board composed of columns (workflow stages) and cards (tickets) that flow
across those columns from creation to completion.

### 1.2 Core Functional Requirements

#### Authentication & Accounts
- **FR-1** Users can register with email and password.
- **FR-2** Users can log in and log out securely.
- **FR-3** Every authenticated session is scoped to a single user — a user can only see and
  modify their own board, columns, and cards.
- **FR-4** Upon successful **registration**, the system automatically provisions a
  **default Kanban board** for the new user, pre-populated with three starter columns:
  `To Do`, `In Progress`, and `Done`.

#### Boards & Columns
- **FR-5** A user owns exactly one board (single-board model for the first release).
- **FR-6** Users can **add** new columns to the board.
- **FR-7** Users can **rename / edit** existing columns.
- **FR-8** Users can **delete** columns (deleting a column deletes the cards it contains,
  after a confirmation prompt).
- **FR-9** Users can **reorder** columns (drag-and-drop) and the order persists.

#### Cards (Tickets)
- **FR-10** Users can **create** a card inside any column with at least a title, plus optional
  description, priority, and due date.
- **FR-11** Users can **edit** a card's fields.
- **FR-12** Users can **delete** a card.
- **FR-13** Users can **move** a card between columns via drag-and-drop; the new column and
  position persist.
- **FR-14** Card order within a column is preserved across reloads.

#### Filtering & Sorting
- **FR-15** Users can **filter** cards by a text query (matched against title/description) and
  by **priority**.
- **FR-16** Users can **sort** cards within columns by **creation date**, **due date**, or
  **priority** (ascending/descending).
- **FR-17** Filtering and sorting are applied client-side over the loaded board state and update
  the view in real time.

### 1.3 Non-Functional Requirements
- **Usability:** Core actions (create card, move card, add column) reachable within one or two
  clicks; drag-and-drop must feel responsive.
- **Security:** Passwords hashed; all board APIs require a valid auth token; no cross-user data
  leakage.
- **Performance:** Board with up to ~200 cards renders and reorders without noticeable lag.
- **Reliability:** State mutations persist to the database; a page refresh reflects the last
  saved state.
- **Responsiveness:** Layout works on desktop (primary) and degrades gracefully on tablet.

### 1.4 Primary User Stories
- *As a new user*, I register and immediately land on a ready-to-use board so I can start
  working without setup.
- *As a user*, I create columns that match my workflow and rename or remove them as it evolves.
- *As a user*, I add tickets, drag them across columns as work progresses, and remove them when
  done.
- *As a user*, I filter and sort tickets to focus on what matters (e.g. high-priority items due
  soon).

---

## 2. Limitations & Constraints (Scope Boundaries)

These are explicitly **out of scope** for the initial release to keep the project focused and
deliverable.

- **L-1 Single board per user.** Multi-board / multi-workspace support is not implemented.
- **L-2 No collaboration.** No shared boards, no inviting other users, no real-time multi-user
  sync. Boards are private and single-owner.
- **L-3 No role/permission system.** Every user has the same capabilities over their own data.
- **L-4 No file attachments, comments, or activity history** on cards.
- **L-5 No labels/tags taxonomy** beyond the fixed `priority` field.
- **L-6 No email verification, password reset, or OAuth/social login** in v1 (email+password
  only). These are noted as future work.
- **L-7 No native mobile app.** Web responsive only; mobile is best-effort, not a target.
- **L-8 No offline mode / PWA.** A network connection to the API is required.
- **L-9 Filtering/sorting is client-side** over the current board payload, not server-side
  pagination/search. This is acceptable given the bounded card count (see NFR performance).
- **L-10 Localization:** UI ships in a single language (English) for v1.

Any work beyond these boundaries must be proposed and agreed before implementation.

---

## 3. Technical Solutions & Technology Stack

The repository is split into `backend/` (API) and `frontend/` (SPA), with shared docs in
`docs/` and helper utilities in `scripts/`.

### 3.1 Technology Stack

| Layer            | Technology                                   | Purpose                                   |
| ---------------- | -------------------------------------------- | ----------------------------------------- |
| Frontend         | **React 18 + TypeScript + Vite**             | SPA, fast dev/build tooling               |
| UI state/data    | **TanStack Query** + lightweight local state | Server-state caching, mutations           |
| Drag & drop      | **@dnd-kit**                                 | Accessible column/card drag-and-drop      |
| Styling          | **Tailwind CSS** + CSS variables for theming | Utility-first styling, design tokens      |
| Backend          | **Node.js + Express + TypeScript**           | REST API                                  |
| ORM / DB access  | **Prisma**                                   | Type-safe DB models & migrations          |
| Database         | **SQLite**                               | Relational persistence                    |
| Auth             | **JWT** (access token) + **bcrypt** hashing  | Stateless authentication                  |
| Validation       | **Zod**                                      | Request/response schema validation        |
| Testing          | **Vitest** (unit) + **Supertest** (API)      | Automated tests                           |
| Lint/Format      | **ESLint + Prettier**                        | Consistency                               |

> Rationale: a TypeScript-everywhere stack keeps types consistent across the wire, Prisma gives
> safe schema evolution, and @dnd-kit covers the drag-and-drop requirements with accessibility
> built in.

### 3.2 Architecture Overview

```
┌──────────────────────────┐        HTTPS / JSON        ┌──────────────────────────┐
│  Frontend (React SPA)    │  ───────────────────────▶  │  Backend (Express API)   │
│  - Auth pages            │   Authorization: Bearer    │  - Auth controller       │
│  - Board view            │   <JWT>                    │  - Board/Column/Card     │
│  - DnD + filter/sort     │  ◀───────────────────────  │    controllers (REST)    │
└──────────────────────────┘                            │  - Zod validation        │
                                                        │  - Prisma service layer  │
                                                        └────────────┬─────────────┘
                                                                     │
                                                              ┌──────▼──────┐
                                                              │ SQLite      │
                                                              └─────────────┘
```

- **Stateless API:** the backend authenticates each request via a JWT in the `Authorization`
  header. No server-side session store.
- **Layered backend:** `routes → controllers → services → Prisma`. Controllers handle HTTP +
  validation; services hold business logic; Prisma is the only thing that touches the DB.
- **Ownership enforcement:** every board/column/card query is scoped by the authenticated
  `userId` at the service layer to guarantee isolation (FR-3, L-2).

### 3.3 Data Model (conceptual)

```
User   (id, email, passwordHash, createdAt)
Board  (id, userId → User, name, createdAt)
Column (id, boardId → Board, name, position, createdAt)
Card   (id, columnId → Column, title, description, priority, dueDate, position, createdAt)
```

- `position` (integer/float ordering key) on `Column` and `Card` drives reorder persistence
  (FR-9, FR-14).
- `priority` is an enum: `LOW | MEDIUM | HIGH`.
- On user creation, a default `Board` + three `Column`s are created in a single transaction
  (FR-4).
- Cascading deletes: deleting a `Column` deletes its `Card`s; deleting a `User` deletes their
  whole board tree.

### 3.4 API Surface (REST, all under `/api`)

| Method & Path                       | Description                          | Auth |
| ----------------------------------- | ----------------------------------- | ---- |
| `POST /auth/register`               | Create user + default board         | No   |
| `POST /auth/login`                  | Authenticate, return JWT            | No   |
| `POST /auth/logout`                 | Invalidate client token (client-side) | Yes |
| `GET  /board`                       | Get the user's board + columns+cards | Yes |
| `POST /columns`                     | Create column                       | Yes  |
| `PATCH /columns/:id`                | Rename / reorder column             | Yes  |
| `DELETE /columns/:id`               | Delete column (+ its cards)         | Yes  |
| `POST /cards`                       | Create card                         | Yes  |
| `PATCH /cards/:id`                  | Edit / move / reorder card          | Yes  |
| `DELETE /cards/:id`                 | Delete card                         | Yes  |

All request bodies are validated with Zod; all responses are JSON.

### 3.5 Environment & Configuration
- Secrets and config live in `backend/.env` and `frontend/.env` (never committed; see
  `.gitignore`).
- **Backend `.env`:** `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `PORT`,
  `CORS_ORIGIN`.
- **Frontend `.env`:** `VITE_API_BASE_URL`.
- `scripts/` holds setup/migration/seed helpers; `docs/` holds extended design notes.

---

## 4. Color Palette & Design

The design language is **clean, calm, and focused** — a productivity tool that stays out of the
way. Theming is implemented with CSS custom properties so a dark mode can be added later.

### 4.1 Color Palette

| Token                 | Hex        | Usage                                              |
| --------------------- | ---------- | -------------------------------------------------- |
| `--color-primary`     | `#4F46E5`  | Primary actions, links, active states (Indigo 600) |
| `--color-primary-700` | `#4338CA`  | Hover/pressed primary                              |
| `--color-accent`      | `#06B6D4`  | Highlights, focus rings (Cyan 500)                 |
| `--color-bg`          | `#F8FAFC`  | App background (Slate 50)                          |
| `--color-surface`     | `#FFFFFF`  | Cards, columns, panels                             |
| `--color-border`      | `#E2E8F0`  | Dividers, card/column borders (Slate 200)          |
| `--color-text`        | `#0F172A`  | Primary text (Slate 900)                           |
| `--color-text-muted`  | `#64748B`  | Secondary text, placeholders (Slate 500)           |

**Priority accent colors (cards):**

| Priority | Token                | Hex       |
| -------- | -------------------- | --------- |
| Low      | `--priority-low`     | `#10B981` (Emerald 500) |
| Medium   | `--priority-medium`  | `#F59E0B` (Amber 500)   |
| High     | `--priority-high`    | `#EF4444` (Red 500)     |

**Feedback colors:** success `#10B981`, warning `#F59E0B`, error `#EF4444`, info `#06B6D4`.

### 4.2 Design Principles
- **Layout:** Board is a horizontal row of equal-width columns; columns scroll horizontally,
  cards scroll vertically within a column.
- **Cards:** white surface, subtle border, soft shadow on hover/drag; a colored left accent bar
  indicates priority.
- **Spacing:** 8px spacing scale (`4, 8, 12, 16, 24, 32`). Generous whitespace.
- **Radius:** `8px` for cards/inputs, `12px` for columns/modals.
- **Typography:** System UI / `Inter` font stack. Sizes — H1 24px, H2 20px, body 14–16px,
  caption 12px. Weights 400 / 500 / 600.
- **Elevation:** Two shadow levels — resting (`0 1px 2px rgba(15,23,42,.06)`) and lifted/dragging
  (`0 8px 24px rgba(15,23,42,.16)`).
- **Motion:** 150–200ms ease transitions for hover, drag, and modal open; respect
  `prefers-reduced-motion`.
- **Accessibility:** WCAG AA contrast minimum; visible keyboard focus rings using
  `--color-accent`; drag-and-drop must have keyboard alternatives (provided by @dnd-kit).

---

## 5. Code Writing Standards

### 5.1 General Principles
- **TypeScript strict mode** everywhere (`"strict": true`). No implicit `any`.
- **Single responsibility:** small, focused functions and components. If a file grows past
  ~200–250 lines, consider splitting.
- **Explicit over clever:** readable code beats terse code. Name things for intent.
- **No dead code / commented-out blocks** committed. Remove or implement.
- **Match surrounding style** when editing existing files.

### 5.2 Naming Conventions
- **Files:** React components `PascalCase.tsx`; hooks `useCamelCase.ts`; utilities/services
  `camelCase.ts`.
- **Variables / functions:** `camelCase`. **Types / interfaces / components:** `PascalCase`.
  **Constants:** `UPPER_SNAKE_CASE`.
- **Booleans** read as predicates: `isLoading`, `hasError`, `canEdit`.
- **API/DB fields:** `camelCase` in app code; Prisma maps to DB columns.

### 5.3 Frontend Standards
- **Functional components + hooks** only (no class components).
- **Server state** via TanStack Query; avoid duplicating server data in local state.
- **Styling** with Tailwind utility classes; shared tokens via CSS variables (Section 4).
  Avoid inline `style` except for dynamic positions/transforms from drag-and-drop.
- **Components are presentational where possible**; data fetching/mutations live in hooks
  (`useBoard`, `useCardMutations`, …).
- **Accessibility:** semantic HTML, `aria-*` where needed, keyboard support for all interactive
  elements.

### 5.4 Backend Standards
- **Layering enforced:** routes → controllers → services → Prisma. Controllers never call Prisma
  directly.
- **Validation at the edge:** every endpoint validates input with Zod before logic runs.
- **Ownership checks** in the service layer on every read/write of board data.
- **Errors:** throw typed errors; a central error-handling middleware maps them to HTTP status +
  JSON `{ error: { code, message } }`. Never leak stack traces or secrets in responses.
- **No secrets in code:** all secrets via `.env`.

### 5.5 Git & Workflow
- **Branches:** `feature/<short-desc>`, `fix/<short-desc>`, `chore/<short-desc>`.
- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/) —
  `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`. Imperative, concise subject.
- **Pull requests:** small and focused; description states what and why; must pass lint + tests.
- **Never commit** `.env` files, secrets, or `node_modules`.

### 5.6 Quality Gates
- **Lint & format:** ESLint + Prettier must pass; run before committing.
- **Tests:** business logic (auth, default-board provisioning, ownership scoping, reorder math)
  must have unit tests; key API routes covered with Supertest. Don't merge red builds.
- **Type-check:** `tsc --noEmit` clean on both packages.

### 5.7 Documentation
- Update this `AGENTS.md` when requirements, scope, stack, or standards change.
- Public functions/services get short JSDoc describing intent, params, and return.
- Extended design or decision notes go in `docs/`.

---

*Last reviewed: 2026-06-29.*
