"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Customer, Note, RequestRecord, Status, TaskInput, TaskRecord } from "@/lib/types";
import { dueLabel, isOverdue, nextStatus, statusLabels, statusOptions } from "@/lib/workflow";

type RequestWithCustomer = RequestRecord & { customers: Customer | null };

const blankTask: TaskInput = {
  title: "",
  assignee_name: "",
  status: "waiting",
  due_date: "",
};

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const supabase = useMemo(() => createClient(), []);
  const [request, setRequest] = useState<RequestWithCustomer | null>(null);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [taskForm, setTaskForm] = useState<TaskInput>(blankTask);
  const [editingTask, setEditingTask] = useState<TaskRecord | null>(null);
  const [requestNote, setRequestNote] = useState("");
  const [taskNotes, setTaskNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadPage() {
    setLoading(true);
    const [requestResult, taskResult, noteResult] = await Promise.all([
      supabase.from("requests").select("*, customers(*)").eq("id", id).single(),
      supabase.from("tasks").select("*").eq("request_id", id).order("due_date", { ascending: true }),
      supabase.from("notes").select("*").or(`request_id.eq.${id},task_id.in.()`).order("created_at", { ascending: false }),
    ]);

    if (requestResult.error) setMessage(requestResult.error.message);
    else setRequest(requestResult.data as RequestWithCustomer);

    if (taskResult.error) setMessage(taskResult.error.message);
    else setTasks((taskResult.data ?? []) as TaskRecord[]);

    if (noteResult.error) {
      const fallback = await supabase.from("notes").select("*").eq("request_id", id).order("created_at", { ascending: false });
      if (fallback.error) setMessage(fallback.error.message);
      else setNotes((fallback.data ?? []) as Note[]);
    } else {
      setNotes((noteResult.data ?? []) as Note[]);
    }

    setLoading(false);
  }

  async function loadNotesForTasks(taskRows: TaskRecord[]) {
    const taskIds = taskRows.map((task) => task.id);
    const requestNotes = await supabase.from("notes").select("*").eq("request_id", id);
    const taskNoteRows = taskIds.length
      ? await supabase.from("notes").select("*").in("task_id", taskIds)
      : { data: [], error: null };

    if (requestNotes.error || taskNoteRows.error) return;
    setNotes([...(requestNotes.data ?? []), ...((taskNoteRows.data ?? []) as Note[])].sort((a, b) => b.created_at.localeCompare(a.created_at)));
  }

  useEffect(() => {
    async function hydrate() {
      setLoading(true);
      const [requestResult, taskResult] = await Promise.all([
        supabase.from("requests").select("*, customers(*)").eq("id", id).single(),
        supabase.from("tasks").select("*").eq("request_id", id).order("due_date", { ascending: true }),
      ]);

      if (requestResult.error) setMessage(requestResult.error.message);
      else setRequest(requestResult.data as RequestWithCustomer);

      if (taskResult.error) setMessage(taskResult.error.message);
      else {
        const rows = (taskResult.data ?? []) as TaskRecord[];
        setTasks(rows);
        await loadNotesForTasks(rows);
      }

      setLoading(false);
    }

    hydrate();
  }, [id]);

  function resetTaskForm() {
    setEditingTask(null);
    setTaskForm(blankTask);
  }

  function startTaskEdit(task: TaskRecord) {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      assignee_name: task.assignee_name ?? "",
      status: task.status,
      due_date: task.due_date ?? "",
    });
  }

  async function saveTask(event: FormEvent) {
    event.preventDefault();
    if (!taskForm.title.trim()) {
      setMessage("Task title is required.");
      return;
    }

    setSaving(true);
    const payload = {
      request_id: id,
      title: taskForm.title.trim(),
      assignee_name: taskForm.assignee_name.trim() || null,
      status: taskForm.status,
      due_date: taskForm.due_date || null,
    };

    const result = editingTask
      ? await supabase.from("tasks").update(payload).eq("id", editingTask.id)
      : await supabase.from("tasks").insert(payload);

    if (result.error) setMessage(result.error.message);
    else {
      resetTaskForm();
      await refreshTasksAndNotes();
    }

    setSaving(false);
  }

  async function refreshTasksAndNotes() {
    const { data, error } = await supabase.from("tasks").select("*").eq("request_id", id).order("due_date", { ascending: true });
    if (error) {
      setMessage(error.message);
      return;
    }
    const rows = (data ?? []) as TaskRecord[];
    setTasks(rows);
    await loadNotesForTasks(rows);
  }

  async function deleteTask(task: TaskRecord) {
    if (!window.confirm(`Delete task "${task.title}"?`)) return;
    const { error } = await supabase.from("tasks").delete().eq("id", task.id);
    if (error) setMessage(error.message);
    else await refreshTasksAndNotes();
  }

  async function updateTaskStatus(task: TaskRecord, status: Status) {
    const { error } = await supabase.from("tasks").update({ status }).eq("id", task.id);
    if (error) {
      setMessage(error.message);
      return;
    }

    await supabase.from("activities").insert({
      entity_type: "task",
      entity_id: task.id,
      action: "status_change",
      detail: { before: task.status, after: status, title: task.title },
    });

    await refreshTasksAndNotes();
  }

  async function addRequestNote(event: FormEvent) {
    event.preventDefault();
    if (!requestNote.trim()) return;
    const { error } = await supabase.from("notes").insert({ request_id: id, body: requestNote.trim() });
    if (error) setMessage(error.message);
    else {
      setRequestNote("");
      await refreshTasksAndNotes();
    }
  }

  async function addTaskNote(event: FormEvent, task: TaskRecord) {
    event.preventDefault();
    const body = taskNotes[task.id]?.trim();
    if (!body) return;
    const { error } = await supabase.from("notes").insert({ task_id: task.id, body });
    if (error) setMessage(error.message);
    else {
      setTaskNotes({ ...taskNotes, [task.id]: "" });
      await refreshTasksAndNotes();
    }
  }

  const requestNotes = notes.filter((note) => note.request_id === id);
  const notesByTask = notes.reduce<Record<string, Note[]>>((acc, note) => {
    if (!note.task_id) return acc;
    acc[note.task_id] = [...(acc[note.task_id] ?? []), note];
    return acc;
  }, {});

  return (
    <main className="min-h-screen px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-7">
        <header className="border-b border-slate-200 pb-6">
          <div className="flex flex-wrap gap-3 text-sm font-semibold text-indigo-700">
            <Link href="/">Dashboard</Link>
            <Link href="/customers">Customers</Link>
            {request?.customer_id ? <Link href={`/customers/${request.customer_id}/requests`}>Customer requests</Link> : null}
          </div>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">{request?.title ?? "Request"}</h1>
          <p className="mt-2 text-slate-600">{request?.description ?? "Loading request details..."}</p>
          {request ? (
            <p className="mt-2 text-sm text-slate-500">
              {request.customers?.name ?? "No customer"} · {statusLabels[request.status]} · {request.priority} priority
            </p>
          ) : null}
        </header>

        {message ? <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{message}</div> : null}
        {loading ? <div className="rounded-md bg-white p-6 text-slate-600 shadow-sm ring-1 ring-slate-200">Loading request...</div> : null}

        <section className="grid gap-5 lg:grid-cols-[420px_1fr]">
          <div className="space-y-5">
            <form className="rounded-md bg-white p-5 shadow-sm ring-1 ring-slate-200" onSubmit={saveTask}>
              <h2 className="text-lg font-semibold text-slate-950">{editingTask ? "Edit task" : "Add task"}</h2>
              <div className="mt-4 grid gap-3">
                <input className="rounded-md border border-slate-300 px-3 py-2" placeholder="Task title" value={taskForm.title} onChange={(event) => setTaskForm({ ...taskForm, title: event.target.value })} />
                <input className="rounded-md border border-slate-300 px-3 py-2" placeholder="Assignee" value={taskForm.assignee_name} onChange={(event) => setTaskForm({ ...taskForm, assignee_name: event.target.value })} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <select className="rounded-md border border-slate-300 px-3 py-2" value={taskForm.status} onChange={(event) => setTaskForm({ ...taskForm, status: event.target.value as Status })}>
                    {statusOptions.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
                  </select>
                  <input className="rounded-md border border-slate-300 px-3 py-2" type="date" value={taskForm.due_date} onChange={(event) => setTaskForm({ ...taskForm, due_date: event.target.value })} />
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white" disabled={saving}>{saving ? "Saving" : editingTask ? "Save task" : "Add task"}</button>
                {editingTask ? <button className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold" type="button" onClick={resetTaskForm}>Cancel</button> : null}
              </div>
            </form>

            <form className="rounded-md bg-white p-5 shadow-sm ring-1 ring-slate-200" onSubmit={addRequestNote}>
              <h2 className="text-lg font-semibold text-slate-950">Request notes</h2>
              <textarea className="mt-4 min-h-24 w-full rounded-md border border-slate-300 px-3 py-2" placeholder="Add a note to this request" value={requestNote} onChange={(event) => setRequestNote(event.target.value)} />
              <button className="mt-3 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Add note</button>
              <div className="mt-4 space-y-2">
                {requestNotes.length === 0 ? <p className="text-sm text-slate-500">No request notes yet.</p> : null}
                {requestNotes.map((note) => <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-700" key={note.id}>{note.body}</p>)}
              </div>
            </form>
          </div>

          <section className="space-y-3">
            {tasks.length === 0 ? <div className="rounded-md bg-white p-6 text-slate-600 shadow-sm ring-1 ring-slate-200">No tasks for this request yet.</div> : null}
            {tasks.map((task) => (
              <article className="rounded-md bg-white p-5 shadow-sm ring-1 ring-slate-200" key={task.id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-slate-950">{task.title}</h2>
                      {isOverdue(task) ? <span className="rounded-full bg-rose-100 px-2 py-1 text-xs font-semibold text-rose-700">Overdue</span> : null}
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{task.assignee_name || "Unassigned"} · {dueLabel(task.due_date)}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold" onClick={() => updateTaskStatus(task, nextStatus(task.status))}>{statusLabels[task.status]}</button>
                    {task.status !== "done" ? (
                      <button className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white" onClick={() => updateTaskStatus(task, "done")}>Done</button>
                    ) : null}
                    <button className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold" onClick={() => startTaskEdit(task)}>Edit</button>
                    <button className="rounded-md border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700" onClick={() => deleteTask(task)}>Delete</button>
                  </div>
                </div>

                <form className="mt-4 flex flex-col gap-2 sm:flex-row" onSubmit={(event) => addTaskNote(event, task)}>
                  <input className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2" placeholder="Add note to this task" value={taskNotes[task.id] ?? ""} onChange={(event) => setTaskNotes({ ...taskNotes, [task.id]: event.target.value })} />
                  <button className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Add note</button>
                </form>

                <div className="mt-4 space-y-2">
                  {(notesByTask[task.id] ?? []).length === 0 ? <p className="text-sm text-slate-500">No task notes yet.</p> : null}
                  {(notesByTask[task.id] ?? []).map((note) => <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-700" key={note.id}>{note.body}</p>)}
                </div>
              </article>
            ))}
          </section>
        </section>
      </div>
    </main>
  );
}
