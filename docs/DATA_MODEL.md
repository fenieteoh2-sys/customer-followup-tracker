# Data Model

## customers
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | gen_random_uuid() |
| user_id | uuid | nullable; owner FK added at lock-down sprint |
| name | text | not null |
| email | text | |
| phone | text | |
| company | text | |
| created_at | timestamptz | default now() |

## requests
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid | nullable |
| customer_id | uuid FK → customers | cascade delete |
| title | text | not null |
| description | text | |
| priority | text | 'low' / 'medium' / 'high' |
| status | text | 'open' / 'in_progress' / 'waiting' / 'done' |
| due_date | date | |
| priority_ai_value | text | AI field |
| priority_ai_source | text | AI field |
| priority_ai_confidence | numeric | AI field |
| priority_ai_review_status | text | default 'unreviewed' |
| created_at | timestamptz | |

## tasks
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid | nullable |
| request_id | uuid FK → requests | cascade delete |
| title | text | not null |
| assignee_name | text | |
| status | text | 'open' / 'in_progress' / 'waiting' / 'done' |
| due_date | date | |
| created_at | timestamptz | |

## notes
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid | nullable |
| request_id | uuid FK → requests | nullable |
| task_id | uuid FK → tasks | nullable |
| body | text | not null |
| created_at | timestamptz | |

## activities
| Field | Type | Notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid | nullable |
| entity_type | text | 'customer' / 'request' / 'task' / 'note' |
| entity_id | uuid | |
| action | text | e.g. 'status_change' / 'created' / 'deleted' |
| detail | jsonb | before/after values |
| created_at | timestamptz | |

## RLS
All tables: RLS enabled. v1 = permissive open policies (read + write for all). Lock-down sprint replaces with `auth.uid() = user_id`.