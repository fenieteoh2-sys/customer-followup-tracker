"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { DashboardTask } from "@/lib/types";
import { dueLabel, statusLabels } from "@/lib/workflow";

type LoadState = "loading" | "ready" | "error";

export default function ArchivePage() {
  const supabase = useMemo(() => createClient(), []);
  const [tasks, setTasks] = useState<DashboardTask[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadDoneTasks() {
      setState("loading");
      const { data, error } = await supabase
        .from("tasks")
        .select("*, requests(id, title, priority, status, due_date, customers(name, company))")
        .eq("status", "done")
        .order("created_at", { ascending: false });

      if (error) {
        setMessage(error.message);
        setState("error");
        return;
      }

      setTasks((data ?? []) as DashboardTask[]);
      setMessage("");
      setState("ready");
    }

    loadDoneTasks();
  }, []);

  return (
    <main className="min-h-screen px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-7">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link className="text-sm font-semibold text-indigo-700" href="/">Dashboard</Link>
            <h1 className="mt-2 text-3xl font-bold text-slate-950">Completed archive</h1>
            <p className="mt-2 max-w-2xl text-slate-600">
              Done jobs stay here as your work history after they leave the dashboard.
            </p>
          </div>
          <Link className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white" href="/customers">
            Customers
          </Link>
        </header>

        {message ? <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{message}</div> : null}

        {state === "loading" ? <div className="rounded-md bg-white p-6 text-slate-600 shadow-sm ring-1 ring-slate-200">Loading completed jobs...</div> : null}

        {state === "ready" && tasks.length === 0 ? (
          <section className="rounded-md bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
            <h2 className="text-xl font-semibold text-slate-950">No completed jobs yet.</h2>
            <p className="mt-2 text-slate-600">When a task is marked Done, it will appear here.</p>
          </section>
        ) : null}

        {state === "ready" && tasks.length > 0 ? (
          <section className="overflow-hidden rounded-md bg-white shadow-sm ring-1 ring-slate-200">
            <div className="grid gap-3 border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-500 sm:grid-cols-[1.2fr_1fr_0.7fr_0.5fr]">
              <span>Task</span>
              <span>Customer request</span>
              <span>Due</span>
              <span>Status</span>
            </div>
            {tasks.map((task) => (
              <Link
                className="grid gap-3 border-b border-slate-100 px-4 py-4 last:border-b-0 hover:bg-slate-50 sm:grid-cols-[1.2fr_1fr_0.7fr_0.5fr]"
                href={`/requests/${task.request_id}`}
                key={task.id}
              >
                <div>
                  <h2 className="font-semibold text-slate-950">{task.title}</h2>
                  <p className="mt-1 text-sm text-slate-600">Assigned to {task.assignee_name || "Unassigned"}</p>
                </div>
                <div>
                  <p className="font-medium text-slate-800">{task.requests?.title ?? "Untitled request"}</p>
                  <p className="text-sm text-slate-500">{task.requests?.customers?.name ?? "No customer"}</p>
                </div>
                <div className="text-sm text-slate-700">
                  <p>{dueLabel(task.due_date)}</p>
                  <p className="text-slate-500">{task.due_date ?? ""}</p>
                </div>
                <span className="text-sm font-semibold text-emerald-700">{statusLabels[task.status]}</span>
              </Link>
            ))}
          </section>
        ) : null}
      </div>
    </main>
  );
}
