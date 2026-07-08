# PRD — Customer Follow-Up Tracker

## Problem
A small team loses track of customer requests and follow-ups when they live in email threads and sticky notes. Requests get forgotten; follow-up deadlines are missed.

## Target User
The business owner and 1–3 team members who handle customer requests day-to-day.

## Core Objects
- **Customer** — name, email, phone, company
- **Request** — title, description, priority, status, due date (linked to customer)
- **Task** — title, assignee, status, due date (linked to request)
- **Note** — free-text log entry (linked to request or task)

## MVP Must-Haves
- [ ] Add, edit, delete customers
- [ ] Log a customer request with title, description, priority, due date, and status
- [ ] Create one or more tasks per request, each with assignee and due date
- [ ] Add notes to any request or task
- [ ] Pending follow-ups dashboard: all open/in-progress/waiting tasks due within 3 days or overdue
- [ ] Quick status update from the dashboard (no page reload)
- [ ] App loads with demo data — no login required in v1

## Non-Goals (v1)
Payments, email sending, mobile app, WhatsApp, AI scoring, complex analytics, multi-tenant access control.

## Success Criteria
**End-to-end scenario:** A team member opens the app, sees the dashboard showing "Logo revision round 2" is overdue, clicks the task, bumps status to In Progress, adds a note "Files exported — sending now", and the dashboard updates immediately — all changes confirmed in the database.

**Definition of Done:** Every button and form persists to the database; the dashboard reflects real data; empty, loading, and error states are handled; no dead buttons; no secrets in the frontend; the success scenario above passes manually from a fresh browser tab.