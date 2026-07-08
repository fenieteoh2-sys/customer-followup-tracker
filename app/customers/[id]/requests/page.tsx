"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Customer, RequestInput, RequestRecord } from "@/lib/types";
import { priorityLabels, priorityOptions, statusLabels, statusOptions } from "@/lib/workflow";

const blankRequest: RequestInput = {
  title: "",
  description: "",
  priority: "medium",
  status: "open",
  due_date: "",
};

export default function CustomerRequestsPage() {
  const { id } = useParams<{ id: string }>();
  const supabase = useMemo(() => createClient(), []);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [requests, setRequests] = useState<RequestRecord[]>([]);
  const [form, setForm] = useState<RequestInput>(blankRequest);
  const [editing, setEditing] = useState<RequestRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadPage() {
    setLoading(true);
    const [customerResult, requestResult] = await Promise.all([
      supabase.from("customers").select("*").eq("id", id).single(),
      supabase.from("requests").select("*").eq("customer_id", id).order("created_at", { ascending: false }),
    ]);

    if (customerResult.error) setMessage(customerResult.error.message);
    else setCustomer(customerResult.data as Customer);

    if (requestResult.error) setMessage(requestResult.error.message);
    else setRequests((requestResult.data ?? []) as RequestRecord[]);

    setLoading(false);
  }

  useEffect(() => {
    loadPage();
  }, [id]);

  function startEdit(request: RequestRecord) {
    setEditing(request);
    setForm({
      title: request.title,
      description: request.description ?? "",
      priority: request.priority,
      status: request.status,
      due_date: request.due_date ?? "",
    });
  }

  function resetForm() {
    setEditing(null);
    setForm(blankRequest);
    setMessage("");
  }

  async function saveRequest(event: FormEvent) {
    event.preventDefault();
    if (!form.title.trim()) {
      setMessage("Request title is required.");
      return;
    }

    setSaving(true);
    const payload = {
      customer_id: id,
      title: form.title.trim(),
      description: form.description.trim() || null,
      priority: form.priority,
      status: form.status,
      due_date: form.due_date || null,
    };
    const result = editing
      ? await supabase.from("requests").update(payload).eq("id", editing.id)
      : await supabase.from("requests").insert(payload);

    if (result.error) setMessage(result.error.message);
    else {
      resetForm();
      await loadPage();
    }

    setSaving(false);
  }

  async function deleteRequest(request: RequestRecord) {
    if (!window.confirm(`Delete request "${request.title}" and its tasks/notes?`)) return;
    const { error } = await supabase.from("requests").delete().eq("id", request.id);
    if (error) setMessage(error.message);
    else await loadPage();
  }

  return (
    <main className="min-h-screen px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-7">
        <header className="border-b border-slate-200 pb-6">
          <div className="flex gap-3 text-sm font-semibold text-indigo-700">
            <Link href="/">Dashboard</Link>
            <Link href="/customers">Customers</Link>
          </div>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">{customer?.name ?? "Customer"} requests</h1>
          <p className="mt-2 text-slate-600">{customer?.company ?? "Track requests, tasks, and follow-ups."}</p>
        </header>

        {message ? <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{message}</div> : null}

        <section className="grid gap-5 lg:grid-cols-[420px_1fr]">
          <form className="rounded-md bg-white p-5 shadow-sm ring-1 ring-slate-200" onSubmit={saveRequest}>
            <h2 className="text-lg font-semibold text-slate-950">{editing ? "Edit request" : "Add request"}</h2>
            <div className="mt-4 grid gap-3">
              <input className="rounded-md border border-slate-300 px-3 py-2" placeholder="Title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
              <textarea className="min-h-28 rounded-md border border-slate-300 px-3 py-2" placeholder="Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
              <div className="grid gap-3 sm:grid-cols-3">
                <select className="rounded-md border border-slate-300 px-3 py-2" value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value as RequestInput["priority"] })}>
                  {priorityOptions.map((priority) => <option key={priority} value={priority}>{priorityLabels[priority]}</option>)}
                </select>
                <select className="rounded-md border border-slate-300 px-3 py-2" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as RequestInput["status"] })}>
                  {statusOptions.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
                </select>
                <input className="rounded-md border border-slate-300 px-3 py-2" type="date" value={form.due_date} onChange={(event) => setForm({ ...form, due_date: event.target.value })} />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white" disabled={saving}>{saving ? "Saving" : editing ? "Save changes" : "Add request"}</button>
              {editing ? <button className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold" type="button" onClick={resetForm}>Cancel</button> : null}
            </div>
          </form>

          <section className="overflow-hidden rounded-md bg-white shadow-sm ring-1 ring-slate-200">
            {loading ? <div className="p-6 text-slate-600">Loading requests...</div> : null}
            {!loading && requests.length === 0 ? <div className="p-6 text-slate-600">No requests yet. Add one above.</div> : null}
            {requests.map((request) => (
              <div className="grid gap-3 border-b border-slate-100 p-4 last:border-b-0 sm:grid-cols-[1fr_auto]" key={request.id}>
                <Link href={`/requests/${request.id}`}>
                  <h2 className="font-semibold text-slate-950">{request.title}</h2>
                  <p className="line-clamp-2 text-sm text-slate-600">{request.description || "No description"}</p>
                  <p className="mt-1 text-sm text-slate-500">{priorityLabels[request.priority]} · {statusLabels[request.status]} · {request.due_date || "No due date"}</p>
                </Link>
                <div className="flex items-start gap-2">
                  <button className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold" onClick={() => startEdit(request)}>Edit</button>
                  <button className="rounded-md border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700" onClick={() => deleteRequest(request)}>Delete</button>
                </div>
              </div>
            ))}
          </section>
        </section>
      </div>
    </main>
  );
}
