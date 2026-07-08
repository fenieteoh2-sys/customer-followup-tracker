# Security

## Secrets
- Supabase service role key: server-side only (Next.js server actions / API routes). Never in client bundle or `.env.local` committed to git.
- Supabase anon key: safe for client — scoped by RLS policies.
- Add `.env.local` to `.gitignore` before first commit.

## Permission Model
- **v1 (demo):** Open RLS policies — all rows readable and writable without login. Safe for internal preview only.
- **Lock-down sprint:** Replace with `auth.uid() = user_id` policies. Every query automatically scoped to the signed-in user.
- Agents inherit the permissions of the user who triggered them — no elevated service-role calls from the frontend.

## Approved Tools Rule
Only named, scoped functions (see AGENTIC_LAYER.md) may be called by any automated step. No generic `run_query` or `send_any` tools.

## Audit Principle
Every meaningful state change (create / update / delete / status change) writes a row to `activities`. Audit rows are append-only — no delete policy on the activities table, ever.

## Before Real Users or Sensitive Data Go In
The lock-down sprint (Sprint 3) MUST be complete: RLS owner policies live, auth enforced, no open policies remaining. Do not skip this before sharing the app externally.