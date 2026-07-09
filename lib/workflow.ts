import type { Priority, Status, TaskRecord } from "./types";

export const statusOptions: Status[] = ["waiting", "open", "in_progress", "pending", "done"];
export const priorityOptions: Priority[] = ["low", "medium", "high"];

export const statusLabels: Record<Status, string> = {
  waiting: "Waiting",
  open: "Open",
  in_progress: "In Process",
  pending: "Pending",
  done: "Done",
};

export const priorityLabels: Record<Priority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export function nextStatus(status: Status): Status {
  if (status === "pending") return "in_progress";
  const index = statusOptions.indexOf(status);
  return statusOptions[(index + 1) % statusOptions.length];
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function daysFromToday(date: string | null) {
  if (!date) return Number.POSITIVE_INFINITY;
  const today = new Date(todayIso());
  const due = new Date(`${date}T00:00:00`);
  return Math.ceil((due.getTime() - today.getTime()) / 86_400_000);
}

export function isOverdue(task: Pick<TaskRecord, "due_date" | "status">) {
  return task.status !== "done" && daysFromToday(task.due_date) < 0;
}

export function urgencyScore(task: Pick<TaskRecord, "due_date" | "status">, priority: Priority) {
  const days = daysFromToday(task.due_date);
  if (task.status === "done") return 0;
  if (task.status === "waiting") return 30;
  if (task.status === "pending") return 90;
  if (days < 0 && priority === "high") return 100;
  if (days < 0 && priority === "medium") return 80;
  if (days < 0) return 65;
  if (days === 0 && priority === "high") return 75;
  if (days <= 3) return 50;
  return 10;
}

export function completedRecentlyLabel(completedAt?: string) {
  if (!completedAt) return "Done recently";
  const completed = new Date(completedAt);
  const today = new Date();
  const days = Math.max(0, Math.floor((today.getTime() - completed.getTime()) / 86_400_000));
  if (days === 0) return "Done today";
  if (days === 1) return "Done yesterday";
  return `Done ${days} days ago`;
}

export function dueLabel(date: string | null) {
  const days = daysFromToday(date);
  if (!date) return "No due date";
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} overdue`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days} days`;
}
