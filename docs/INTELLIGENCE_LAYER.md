# Intelligence Layer

## Messy Input
Free-text request descriptions like "Sarah is annoyed about her invoice, fix it ASAP" — no structured priority.

## Auto-Structure (later sprint)
On request save, send description to LLM. Parse response into:
```json
{
  "priority_ai_value": "high",
  "priority_ai_source": "gpt-4o",
  "priority_ai_confidence": 0.88,
  "priority_ai_review_status": "unreviewed"
}
```
Store alongside user-set priority. Never overwrite user's explicit choice without approval.

## Events to Track
- Request created (description length, manually set priority)
- Task status changed (how quickly after creation)
- Due date missed (task overdue at status != done)
- Note added to overdue item

## Scoring Rules (v1 — rule-based, no AI)
- Overdue + high priority = score 100 (show first)
- Overdue + medium = 80
- Due today + high = 75
- Due within 3 days + any = 50
- Waiting status = 40 (deprioritise)

## What Gets Ranked
Follow-up dashboard rows ordered by score descending — most urgent at top.

## v1 vs Later
- **v1:** Rule-based scoring, manual priority
- **Later:** AI suggests priority; human approves in review queue; score blends rule + AI confidence