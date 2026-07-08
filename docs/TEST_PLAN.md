# Test Plan

## v1 Success Scenario (manual)
Run after Sprint 2 is deployed.

1. Open `/` in a fresh browser tab (no login). Confirm dashboard loads with seeded tasks.
2. Confirm "Logo revision round 2" task shows overdue badge (red).
3. Click the status pill on that task → change to "In Progress". Confirm pill updates immediately and DB row reflects new status (check Supabase table viewer).
4. Click the task row to open the parent request. Add note: "Files exported — sending now". Save. Confirm note appears below without page reload.
5. Return to dashboard. Confirm task no longer shows overdue badge (status is In Progress, not done — badge logic: past due_date AND status != done).
6. Click "Add Customer" → fill form → save. Confirm new customer appears in `/customers` list.
7. Open new customer → add a request (title, priority: High, due_date: today). Save. Confirm request appears.
8. Add a task to that request. Save. Confirm task appears on dashboard within 3-day window.

## Empty States
- New Supabase project (no seed): dashboard shows "No follow-ups due — you're all caught up!"
- Customer with no requests: request list shows "No requests yet — add one above."
- Request with no tasks: task list shows "No tasks for this request yet."

## Error Cases
- Disconnect network → click status pill → error toast appears within 3 seconds with retry button.
- Submit request form with empty title → inline validation error, form does not submit.
- Delete customer → confirmation modal appears; cancel leaves record intact; confirm removes customer and all linked requests/tasks (verify in DB).

## Regression After Sprint 3 (auth)
- Visit `/` without session → redirected to `/login`.
- Log in → see only own data.
- Confirm no other user's rows visible.