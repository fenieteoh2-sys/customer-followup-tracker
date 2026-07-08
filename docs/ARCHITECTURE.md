# Architecture

## Stack
- **Frontend:** Next.js 14 (App Router) on Vercel
- **Database + Auth:** Supabase (Postgres + RLS + Auth)
- **Styling:** Tailwind CSS
- **Email (later):** Supabase Edge Function + Resend

## What to Build Now vs Later
**Now:** Customers CRUD → Requests CRUD → Tasks CRUD → Notes → Follow-up dashboard → Demo seed data (no login wall)
**Next:** Auth + per-user RLS lock-down → search/filter → email digests
**Later:** AI priority scoring → auto-draft follow-up messages → reporting

## Key User Action — Step-by-Step
1. Team member opens `/` (dashboard, no login needed in v1)
2. Sees tasks due soon — fetched live from `tasks` joined with `requests` and `customers`
3. Clicks "Update Status" pill → client sends `PATCH /tasks/:id {status}` → Supabase updates row → UI re-renders
4. Row written to `activities` table (entity_type=task, action=status_change)
5. Dashboard query re-runs and reflects new state

## Layer Order
1. **Database first** — tables, constraints, RLS policies, seed data
2. **App logic** — Next.js server actions / API routes for CRUD; all rules enforced server-side
3. **Smart features later** — AI scoring layered on top; core works without it

## Core Without AI
All status tracking, due-date filtering, and follow-up views are pure SQL queries. Removing the AI layer leaves a fully functional tracker.