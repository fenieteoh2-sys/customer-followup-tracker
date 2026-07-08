create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  name text not null,
  email text,
  phone text,
  company text,
  created_at timestamptz not null default now()
);
alter table customers enable row level security;
drop policy if exists "customers_v1_read" on customers;
create policy "customers_v1_read" on customers for select using (true);
drop policy if exists "customers_v1_write" on customers;
create policy "customers_v1_write" on customers for all using (true) with check (true);

create table if not exists requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  customer_id uuid not null references customers(id) on delete cascade,
  title text not null,
  description text,
  priority text not null default 'medium',
  status text not null default 'open',
  due_date date,
  priority_ai_value text,
  priority_ai_source text,
  priority_ai_confidence numeric,
  priority_ai_review_status text default 'unreviewed',
  created_at timestamptz not null default now()
);
alter table requests enable row level security;
drop policy if exists "requests_v1_read" on requests;
create policy "requests_v1_read" on requests for select using (true);
drop policy if exists "requests_v1_write" on requests;
create policy "requests_v1_write" on requests for all using (true) with check (true);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  request_id uuid not null references requests(id) on delete cascade,
  title text not null,
  assignee_name text,
  status text not null default 'open',
  due_date date,
  created_at timestamptz not null default now()
);
alter table tasks enable row level security;
drop policy if exists "tasks_v1_read" on tasks;
create policy "tasks_v1_read" on tasks for select using (true);
drop policy if exists "tasks_v1_write" on tasks;
create policy "tasks_v1_write" on tasks for all using (true) with check (true);

create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  request_id uuid references requests(id) on delete cascade,
  task_id uuid references tasks(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);
alter table notes enable row level security;
drop policy if exists "notes_v1_read" on notes;
create policy "notes_v1_read" on notes for select using (true);
drop policy if exists "notes_v1_write" on notes;
create policy "notes_v1_write" on notes for all using (true) with check (true);

create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  detail jsonb,
  created_at timestamptz not null default now()
);
alter table activities enable row level security;
drop policy if exists "activities_v1_read" on activities;
create policy "activities_v1_read" on activities for select using (true);
drop policy if exists "activities_v1_write" on activities;
create policy "activities_v1_write" on activities for all using (true) with check (true);

insert into customers (id, name, email, phone, company) values
  ('11111111-0000-0000-0000-000000000001', 'Sarah Mitchell', 'sarah@brightco.com', '555-0101', 'BrightCo Ltd'),
  ('11111111-0000-0000-0000-000000000002', 'James Okafor', 'james@vertexsupply.com', '555-0202', 'Vertex Supply'),
  ('11111111-0000-0000-0000-000000000003', 'Priya Nair', 'priya@nairdesigns.io', '555-0303', 'Nair Designs'),
  ('11111111-0000-0000-0000-000000000004', 'Tom Reyes', 'tom@reyes-tech.com', '555-0404', 'Reyes Tech');

insert into requests (id, customer_id, title, description, priority, status, due_date) values
  ('22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001', 'Fix invoice discrepancy', 'Invoice #1042 shows wrong tax rate — needs correction before end of month.', 'high', 'open', current_date + 2),
  ('22222222-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000002', 'Send updated product catalogue', 'James asked for the Q3 catalogue with new pricing.', 'medium', 'in_progress', current_date + 5),
  ('22222222-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000003', 'Logo revision round 2', 'Priya needs revised logo files in SVG and PNG.', 'high', 'open', current_date - 1),
  ('22222222-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000004', 'Schedule onboarding call', 'Tom is ready to start — book a 45-min onboarding session.', 'medium', 'open', current_date + 1),
  ('22222222-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000001', 'Confirm delivery address', 'Sarah moved offices — confirm new delivery address before next shipment.', 'low', 'waiting', current_date + 7);

insert into tasks (id, request_id, title, assignee_name, status, due_date) values
  ('33333333-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', 'Pull original invoice from system', 'Alex', 'done', current_date - 1),
  ('33333333-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000001', 'Issue corrected invoice to Sarah', 'Alex', 'open', current_date + 2),
  ('33333333-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000002', 'Export Q3 catalogue PDF', 'Jordan', 'in_progress', current_date + 3),
  ('33333333-0000-0000-0000-000000000004', '22222222-0000-0000-0000-000000000003', 'Export SVG and PNG logo files', 'Jordan', 'open', current_date - 1),
  ('33333333-0000-0000-0000-000000000005', '22222222-0000-0000-0000-000000000004', 'Send calendar invite to Tom', 'Alex', 'open', current_date + 1),
  ('33333333-0000-0000-0000-000000000006', '22222222-0000-0000-0000-000000000005', 'Email Sarah for new address', 'Jordan', 'waiting', current_date + 4);

insert into notes (request_id, body) values
  ('22222222-0000-0000-0000-000000000001', 'Sarah flagged this as urgent — she has an audit next week.'),
  ('22222222-0000-0000-0000-000000000003', 'Priya prefers files via Dropbox, not email attachment.'),
  ('22222222-0000-0000-0000-000000000004', 'Tom is available Mon/Wed afternoons only.');