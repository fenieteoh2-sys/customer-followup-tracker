export type Status = "waiting" | "open" | "in_progress" | "pending" | "done";
export type Priority = "low" | "medium" | "high";

export type Customer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  created_at: string;
};

export type CustomerInput = {
  name: string;
  email: string;
  phone: string;
  company: string;
};

export type RequestRecord = {
  id: string;
  customer_id: string;
  title: string;
  description: string | null;
  priority: Priority;
  status: Status;
  due_date: string | null;
  created_at: string;
};

export type RequestInput = {
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  due_date: string;
};

export type TaskRecord = {
  id: string;
  request_id: string;
  title: string;
  assignee_name: string | null;
  status: Status;
  due_date: string | null;
  created_at: string;
};

export type TaskInput = {
  title: string;
  assignee_name: string;
  status: Status;
  due_date: string;
};

export type Note = {
  id: string;
  request_id: string | null;
  task_id: string | null;
  body: string;
  created_at: string;
};

export type DashboardTask = TaskRecord & {
  completed_at?: string;
  requests: {
    id: string;
    title: string;
    priority: Priority;
    status: Status;
    due_date: string | null;
    customers: {
      name: string;
      company: string | null;
    } | null;
  } | null;
};
