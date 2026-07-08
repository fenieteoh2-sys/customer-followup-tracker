"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { DashboardTask, Status } from "@/lib/types";
import { dueLabel, isOverdue, nextStatus, statusLabels, urgencyScore } from "@/lib/workflow";

type LoadState = "loading" | "ready" | "error";

export default function Dashboard() {
  const supabase = useMemo(() => createClient(), []);
  const [tasks, setTasks] = useState<DashboardTask[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [message, setMessage] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  async function loadTasks() {
    setState("loading");
    const limit = new Date();
    limit.setDate(limit.getDate() + 3);
    const dueLimit = limit.toISOString().slice(0, 10);

    const { data, error } = await supabase
      .from("tasks")
      .select("*, requests(id, title, priority, status, due_date, customers(name, company))")
      .neq("status", "done")
      .lte("due_date", dueLimit)
      .order("due_date", { ascending: true });

    if (error) {
      setMessage(error.message);
      setState("error");
      return;
    }

    const ranked = ((data ?? []) as DashboardTask[]).sort((a, b) => {
      const aPriority = a.requests?.priority ?? "medium";
      const bPriority = b.requests?.priority ?? "medium";
      return urgencyScore(b, bPriority) - urgencyScore(a, aPriority);
    });

    setTasks(ranked);
    setMessage("");
    setState("ready");
  }

  useEffect(() => {
    loadTasks();
  }, []);

  async function cycleStatus(task: DashboardTask) {
    const newStatus = nextStatus(task.status);
    await updateTaskStatus(task, newStatus);
  }

  async function updateTaskStatus(task: DashboardTask, status: Status) {
    setSavingId(task.id);
    setMessage("");

    const { error } = await supabase.from("tasks").update({ status }).eq("id", task.id);

    if (error) {
      setMessage(`Could not update status: ${error.message}`);
      setSavingId(null);
      return;
    }

    await supabase.from("activities").insert({
      entity_type: "task",
      entity_id: task.id,
      action: "status_change",
      detail: { before: task.status, after: status, title: task.title },
    });

    setSavingId(null);
    await loadTasks();
  }

  return (
    <main className="min-h-screen px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-7">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">Dashboard</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-950">Pending follow-ups</h1>
            <p className="mt-2 max-w-2xl text-slate-600">
              Open, waiting, and in-progress work due in the next 3 days or already overdue.
            </p>
          </div>
          <nav className="flex gap-2">
            <Link className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white" href="/customers">
              Customers
            </Link>
          </nav>
        </header>

        {message ? (
          <div className="flex items-center justify-between rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            <span>{message}</span>
            <button className="font-semibold underline" onClick={loadTasks}>Retry</button>
          </div>
        ) : null}

        {state === "loading" ? (
          <section className="grid gap-3">
            {[0, 1, 2].map((item) => (
              <div className="h-28 animate-pulse rounded-md bg-white shadow-sm ring-1 ring-slate-200" key={item} />
            ))}
          </section>
        ) : null}

        {state === "ready" && tasks.length === 0 ? (
          <section className="rounded-md bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
            <h2 className="text-xl font-semibold text-slate-950">No follow-ups due. You&apos;re all caught up.</h2>
            <p className="mt-2 text-slate-600">New tasks due within 3 days will appear here automatically.</p>
          </section>
        ) : null}

        {state === "ready" && tasks.length > 0 ? (
          <section className="overflow-hidden rounded-md bg-white shadow-sm ring-1 ring-slate-200">
            <div className="grid grid-cols-[1fr_auto] gap-3 border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-500 sm:grid-cols-[1.2fr_1fr_0.7fr_0.7fr_auto]">
              <span>Task</span>
              <span className="hidden sm:block">Customer request</span>
              <span className="hidden sm:block">Due</span>
              <span className="hidden sm:block">Score</span>
              <span>Status</span>
            </div>
            {tasks.map((task) => {
              const priority = task.requests?.priority ?? "medium";
              const score = urgencyScore(task, priority);
              return (
                <div className="grid grid-cols-[1fr_auto] gap-3 border-b border-slate-100 px-4 py-4 last:border-b-0 sm:grid-cols-[1.2fr_1fr_0.7fr_0.7fr_auto]" key={task.id}>
                  <Link className="min-w-0" href={`/requests/${task.request_id}`}>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-slate-950">{task.title}</h2>
                      {isOverdue(task) ? (
                        <span className="rounded-full bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-700">Overdue</span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-slate-600">Assigned to {task.assignee_name || "Unassigned"}</p>
                  </Link>
                  <div className="hidden min-w-0 sm:block">
                    <p className="truncate font-medium text-slate-800">{task.requests?.title ?? "Untitled request"}</p>
                    <p className="truncate text-sm text-slate-500">{task.requests?.customers?.name ?? "No customer"}</p>
                  </div>
                  <div className="hidden text-sm sm:block">
                    <p className={isOverdue(task) ? "font-semibold text-rose-700" : "text-slate-700"}>{dueLabel(task.due_date)}</p>
                    <p className="text-slate-500">{task.due_date ?? ""}</p>
                  </div>
                  <div className="hidden sm:block">
                    <span className="rounded-full bg-indigo-50 px-2 py-1 text-sm font-semibold text-indigo-700">{score}</span>
                  </div>
                  <button
                    className="h-10 rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                    disabled={savingId === task.id}
                    onClick={() => cycleStatus(task)}
                  >
                    {savingId === task.id ? "Saving" : statusLabels[task.status]}
                  </button>
                </div>
              );
            })}
          </section>
        ) : null}
      </div>
    </main>
  );
}
