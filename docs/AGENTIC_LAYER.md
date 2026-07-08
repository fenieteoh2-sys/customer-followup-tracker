# Agentic Layer

## Risk Levels & Actions

### Low Risk — Auto-execute (no approval needed)
- Tag a request priority based on description text
- Score and sort follow-up dashboard rows
- Mark a task as overdue when due_date passes

### Medium Risk — Draft shown to user, one click to apply
- Suggest status change (e.g. "This request has been waiting 5 days — mark as Waiting?")
- Auto-draft a follow-up note: "Called customer — no answer. Will retry tomorrow."

### High Risk — Always requires explicit approval before action
- Send a follow-up email to the customer
- Reassign a task to a different team member

### Critical — Human only, no agent involvement
- Delete a customer and all their data
- Any action with legal or billing implications

## Named Tools (approved list)
- `update_task_status(task_id, new_status)` — medium
- `add_note(entity_type, entity_id, body)` — low
- `suggest_priority(request_id)` — low
- `draft_followup_email(request_id)` — high (draft only, human sends)

## Audit Log Fields
Every agent action writes to `activities`: `entity_type`, `entity_id`, `action`, `detail` (JSON with before/after), `user_id`, `created_at`.

## v1 vs Later
- **v1:** No agent actions. Rule-based scoring only.
- **Later:** Medium-risk drafts surfaced in dashboard; human approves; audit trail required before any outbound action.