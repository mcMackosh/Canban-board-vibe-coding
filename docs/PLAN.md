# PLAN.md — Kanban Board Development Plan

This plan breaks the build defined in [`AGENTS.md`](../AGENTS.md) into **7 sequential development
stages**. The work is organized as **full-stack vertical slices**: in every stage the **backend
and frontend are developed in parallel** (a Backend Track and a Frontend Track), so each stage
ends with a feature that is wired end-to-end — API + UI together — not a backend-only or
frontend-only deliverable.

> **How to use this plan:** stages are implemented **only when explicitly asked**. Each stage
> below lists its goal, a **Backend Track** and **Frontend Track** that run in parallel, the
> deliverables, and a definition of done (DoD).

**Requirement traceability:** FR-x / NFR / L-x references point back to the requirements in
`AGENTS.md`.

---

## Execution Rule for EVERY Stage (non-negotiable)

For **each** stage below, the implementation must:

1. **Follow the description exactly.** Implement precisely what the stage specifies — no more,
   no less. Do not pull work forward from later stages or skip listed items.
2. **Be careful and deliberate.** Respect the architecture, layering, naming, and standards in
   AGENTS.md §5. Validate inputs, scope every query by the authenticated user, handle errors.
3. **Test it.** Write and run automated tests (backend: Vitest/Supertest; frontend: component/
   integration tests where applicable). Backend and frontend tracks are each tested.
4. **Prove it actually works.** Before a stage is considered done, **demonstrate** it to the
   user with concrete evidence, e.g.:
   - test run output (all green),
   - example API requests/responses (curl/HTTPie) for the backend track,
   - the running UI exercising the feature (screenshots / a short description of the verified
     click-path) for the frontend track,
   - `eslint` + `tsc --noEmit` passing on both packages.
5. **Do not declare a stage complete** until its Definition of Done is met and the proof above
   has been shown.

---

## Stage 1 — Scaffolding, Tooling & Persistence Foundation

**Goal:** Stand up both packages and the database layer so every later slice has a working,
testable foundation on both sides of the wire.

**Backend Track**
- Initialize `backend/` — Node + Express + TypeScript, strict `tsconfig`, dev server
  (`tsx`/`nodemon`), `src/app.ts` + `src/server.ts` with a `/api/health` route.
- Add Prisma; define schema for `User`, `Board`, `Column`, `Card` per AGENTS.md §3.3 (relations,
  `position` ordering keys, `priority` enum `LOW|MEDIUM|HIGH`, `dueDate`, cascading deletes).
- Create the initial migration; generate the Prisma client; add a Prisma singleton module.
- ESLint + Prettier; `.env.example` (`DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `PORT`,
  `CORS_ORIGIN`).

**Frontend Track**
- Initialize `frontend/` — React 18 + TypeScript + Vite; Tailwind configured with the design
  tokens (CSS variables) from AGENTS.md §4.
- App shell, router, and a styled placeholder page; TanStack Query provider set up.
- ESLint + Prettier; `.env.example` (`VITE_API_BASE_URL`).
- `.editorconfig`; confirm `.gitignore` covers `.env`, `node_modules`, build output.

**Deliverables:** Two installable, runnable packages; a migrated database + typed Prisma client.

**Definition of Done**
- `npm install` succeeds in both packages; `eslint` + `tsc --noEmit` pass in both.
- Backend `GET /api/health` → `200 { status: "ok" }`; migration applies to a fresh DB.
- Frontend dev server renders a styled placeholder hitting `/api/health`.
- **Proof shown:** health request/response, migration output, screenshot of the placeholder.

---

## Stage 2 — Authentication (Full-Stack Slice)

**Goal:** End-to-end email+password auth: API + UI, register → login → access a protected page.
*(FR-1, FR-2, FR-3, NFR-Security; respects L-6 — no email verification / reset / OAuth.)*

**Backend Track**
- `POST /api/auth/register` (Zod validation, bcrypt hashing), `POST /api/auth/login`
  (issue JWT), `POST /api/auth/logout` (documented client-side discard).
- `requireAuth` middleware verifying `Authorization: Bearer <JWT>`, attaching `userId`.
- Central error-handling middleware → `{ error: { code, message } }` (no stack/secret leakage).
- Tests: hashing, token issue/verify, register/login/invalid-credentials, protected-route 401.

**Frontend Track**
- Typed API client/fetch wrapper that attaches the JWT; token storage.
- Register and Login pages (forms + validation + error display); logout action.
- Auth guard / protected routes; redirect unauthenticated users to login.
- Tests: form validation and the auth guard redirect behavior.

**Deliverables:** Working auth endpoints + auth UI wired together.

**Definition of Done**
- Register persists a user with a **hashed** password (never plaintext).
- Login returns a token / 401 for wrong credentials; protected route rejects bad tokens.
- UI: a user can register, log in, reach a protected page, and log out.
- **Proof shown:** test output, example auth API requests/responses, screenshots of the
  register→login→protected-page flow.

> **Note:** Default-board provisioning (FR-4) lands in Stage 3 once the board domain exists;
> Stage 2 leaves a clear hook in the register flow.

---

## Stage 3 — Default Board & Columns (Full-Stack Slice)

**Goal:** Provision the default board on registration and let users manage columns, end-to-end.
*(FR-4, FR-5, FR-6, FR-7, FR-8, FR-9; ownership scoping per FR-3.)*

**Backend Track**
- **Default board provisioning (FR-4):** on register, create the user's `Board` + three columns
  (`To Do`, `In Progress`, `Done`) in a single transaction.
- `GET /api/board` (board + columns), `POST /api/columns`, `PATCH /api/columns/:id`
  (rename + position), `DELETE /api/columns/:id` (cascade its cards).
- Routes → controllers → services → Prisma layering; Zod validation; ownership checks everywhere.
- Tests (Supertest): provisioning, column CRUD, reorder, cross-user isolation.

**Frontend Track**
- `useBoard` query hook + column mutation hooks (create/rename/delete) with cache invalidation.
- Board view: columns rendered as a horizontal row from the API.
- Column UI: add column, rename column, delete column **with confirmation** (FR-8).
- Tests: column create/rename/delete UI interactions (mocked API).

**Deliverables:** A live board showing the three starter columns with full column management.

**Definition of Done**
- A new registration yields a board with the three starter columns (verified via UI + API).
- Column create/rename/delete persist and survive reload; users can't touch others' columns.
- **Proof shown:** test output, board API response, screenshots of the board with column
  add/rename/delete working.

---

## Stage 4 — Cards CRUD (Full-Stack Slice)

**Goal:** Create, edit, and delete cards inside columns, end-to-end.
*(FR-10, FR-11, FR-12, FR-14 ordering on create.)*

**Backend Track**
- `POST /api/cards` (title required; optional description, priority, dueDate; append via
  `position`), `PATCH /api/cards/:id` (edit fields), `DELETE /api/cards/:id`.
- Extend `GET /api/board` to include each column's cards ordered by `position`.
- Zod validation + ownership scoping; tests for card CRUD and isolation.

**Frontend Track**
- Card component with priority accent bar; render cards inside their columns from the board
  payload.
- Create-card form and edit-card modal (title, description, priority, due date); delete-card
  action.
- Card mutation hooks with optimistic updates + cache invalidation.
- Tests: create/edit/delete card UI interactions.

**Deliverables:** Fully populated board where cards can be created, edited, and deleted.

**Definition of Done**
- Cards create/edit/delete persist and reflect on reload (FR-14 order preserved on create).
- **Proof shown:** test output, card API requests/responses, screenshots of card create/edit/
  delete in the UI.

---

## Stage 5 — Drag-and-Drop: Move & Reorder (Full-Stack Slice)

**Goal:** Move cards across columns and reorder cards/columns via drag-and-drop, persisted.
*(FR-9 column reorder, FR-13 card move, FR-14 card order persistence.)*

**Backend Track**
- `PATCH /api/cards/:id` extended to **move** (change `columnId`) and **reorder** (change
  `position`); `PATCH /api/columns/:id` reorder hardened.
- Reorder/move math isolated in a **unit-tested** service function (stable ordering, no
  collisions).
- Tests: move-across-columns, intra-column reorder, column reorder, isolation.

**Frontend Track**
- Integrate **@dnd-kit**: reorder columns, reorder cards within a column, move cards across
  columns; persist via PATCH; optimistic UI with rollback on error.
- Keyboard-accessible drag-and-drop; resting/lifted shadows; respect `prefers-reduced-motion`.
- Tests: ordering logic / mutation calls on drop (where testable).

**Deliverables:** A fully interactive board with persistent drag-and-drop.

**Definition of Done**
- Dragging a card changes its column + position and survives reload (FR-13, FR-14).
- Column reorder persists (FR-9); drag works with mouse **and** keyboard.
- **Proof shown:** reorder-math unit tests, move/reorder API calls, screenshots/described
  click-path of dragging cards and columns and confirming persistence after refresh.

---

## Stage 6 — Filtering & Sorting (Full-Stack Slice)

**Goal:** Let users filter and sort cards client-side over the loaded board, in real time.
*(FR-15, FR-16, FR-17; L-9 client-side only.)*

**Backend Track**
- Confirm the `GET /api/board` payload exposes every field filtering/sorting needs
  (title, description, priority, createdAt, dueDate). Add/adjust tests if fields are missing.
- (No server-side search/pagination — L-9.)

**Frontend Track**
- **Filtering (FR-15):** text query over title/description + priority filter, applied
  client-side, updating the view in real time (FR-17).
- **Sorting (FR-16):** sort cards within columns by creation date / due date / priority,
  ascending or descending.
- Filter/sort state in a dedicated hook; derived (not duplicated) from board state.
- Tests: filter and sort logic over sample board state.

**Deliverables:** A board with live filtering and sorting controls.

**Definition of Done**
- Filter + sort behave per FR-15/16/17 and update the view live without a refetch.
- **Proof shown:** filter/sort unit tests, screenshots of the board filtered and sorted by each
  criterion.

---

## Stage 7 — Polish, Hardening & Final Proof (Full-Stack)

**Goal:** Finalize quality, accessibility, performance, and documentation across both packages.
*(NFR performance/reliability/responsiveness; quality gates per AGENTS.md §5.6.)*

**Backend Track**
- Consistent API error handling and input edge cases; basic rate-limit/CORS review.
- Fill key test gaps; ensure the full backend suite is green.

**Frontend Track**
- Empty/loading/error states; toasts for mutation success/failure.
- Responsiveness (desktop primary, graceful tablet degradation); AA contrast + visible focus.
- Performance check: smooth interaction with ~200 cards (NFR).
- Fill key frontend test gaps.

**Cross-cutting**
- Update `README.md` with setup/run instructions; record design notes in `docs/`.
- Final end-to-end walkthrough proving the whole flow.

**Deliverables:** Feature-complete v1 matching AGENTS.md scope, tested and documented.

**Definition of Done**
- Lint, type-check, and the **full test suite pass across both packages**.
- App is responsive and performant at the target card count.
- **Proof shown:** full green test runs (both packages), an end-to-end demo
  (register → board → columns → cards → drag-and-drop → filter/sort) with screenshots, and
  updated README/docs.

---

## Stage Dependency Summary (each stage = parallel backend + frontend)

| Stage | Slice                         | Depends on | Primary requirements        |
| ----- | ----------------------------- | ---------- | --------------------------- |
| 1     | Scaffolding & Persistence     | —          | Infrastructure, §3.3 model  |
| 2     | Authentication                | 1          | FR-1, FR-2, FR-3            |
| 3     | Default Board & Columns       | 2          | FR-4–FR-9                   |
| 4     | Cards CRUD                    | 3          | FR-10, FR-11, FR-12, FR-14  |
| 5     | Drag-and-Drop (move/reorder)  | 4          | FR-9, FR-13, FR-14          |
| 6     | Filtering & Sorting           | 5          | FR-15, FR-16, FR-17         |
| 7     | Polish, Hardening & Final     | 6          | NFRs, §5.6 quality gates    |

---

*Derived from `AGENTS.md`. Last updated: 2026-06-29.*
