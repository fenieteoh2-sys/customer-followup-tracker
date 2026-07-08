# Tasks & Sprints

## Sprint 1 — Database & Core CRUD
**Goal:** All tables exist, seed data loads, and every object can be created, edited, and deleted through the UI.

- [ ] Apply migration SQL to Supabase (customers, requests, tasks, notes, activities + open RLS)
- [ ] Seed 4 customers, 5 requests, 6 tasks, 3 notes
- [ ] `/customers` page: list with loading skeleton, empty state, error toast
- [ ] Add / edit customer form — saves to DB, reflects immediately
- [ ] Delete customer — confirmation modal, cascade confirmed
- [ ] `/customers/[id]/requests` page: request list
- [ ] Add / edit request form (title, description, priority, status, due_date)
- [ ] Task list per request
- [ ] Add / edit task form (title, assignee_name, status, due_date)
- [ ] Delete request and task with confirmation
- [ ] Inline note add on any request or task
- [ ] Navigation bar: Dashboard | Customers

**Definition of Done:** All forms save to Supabase and the page reflects the change without a hard reload. Deletes remove rows. Seeded data visible on first load.

---

## Sprint 2 — Follow-Up Dashboard ✅ v1 functional milestone
**Goal:** The one core view — all pending follow-ups ranked by urgency — works end-to-end.

- [ ] `/` dashboard: query tasks where status != 'done' and due_date <= today+3 or overdue
- [ ] Rows ranked by urgency score (rule-based: overdue+high=100 … see INTELLIGENCE_LAYER)
- [ ] Overdue badge (red) on past-due tasks
- [ ] Status quick-update pill — one click cycles status, writes to DB, re-ranks
- [ ] Activity row written on every status change
- [ ] Empty state: "No follow-ups due — you're all caught up!"
- [ ] Loading skeleton while query runs
- [ ] Error toast on failed save with retry button
- [ ] Each row links to the parent request detail page

**Definition of Done:** The end-to-end success scenario in the PRD passes from a fresh browser tab. No dead buttons. DB reflects every interaction.

---

## Sprint 3 — Lock It Down
**Goal:** Secure the app for real use by real team members.

- [ ] Enable Supabase Auth (email + password)
- [ ] `/login` and `/signup` pages
- [ ] Replace v1 open RLS policies with `auth.uid() = user_id` on all tables
- [ ] Backfill `user_id` on seed rows to a named owner account
- [ ] Redirect unauthenticated visitors to `/login`
- [ ] Session check on all server actions
- [ ] Confirm no service role key used in client code

**Definition of Done:** Visiting `/` without a session redirects to `/login`. A logged-in user sees only their own data. Open policies confirmed removed in Supabase dashboard.

---

## Sprint 4 — Reminders & Search
**Goal:** Team can find anything fast and gets prompted before things slip.

- [ ] Filter bar on dashboard: status, priority, assignee
- [ ] Search input: customer name + request title full-text
- [ ] Assign tasks to team members (small name list or free-text)
- [ ] Daily digest email: Edge Function queries overdue tasks → Resend API
- [ ] Activity feed visible on customer detail page

**Definition of Done:** Filter + search return correct results. Digest email arrives with correct open tasks (tested with a real inbox).

---

## Sprint 5 — Smart Prioritisation
**Goal:** AI suggests priority; human approves before it's applied.

- [ ] On request save, call LLM → store priority_ai_value + source + confidence + review_status
- [ ] Review queue on dashboard: "AI suggested High — approve or change?"
- [ ] Approve sets review_status='approved'; override sets user priority and review_status='overridden'
- [ ] Auto-draft follow-up note for 5+ day overdue tasks (shown as draft, human confirms)
- [ ] Audit log viewer in /settings

**Definition of Done:** AI field stored correctly. No AI value applied without human action. Audit log shows every agent action.

---

## Gantt (sprint → feature)
```
Sprint 1: DB schema, seed, customers CRUD, requests CRUD, tasks CRUD, notes
Sprint 2: Dashboard, urgency ranking, status pill, activity log          ← v1 functional
Sprint 3: Auth, RLS lock-down, session enforcement
Sprint 4: Filters, search, team assign, email digest
Sprint 5: AI priority, review queue, audit log viewer
```