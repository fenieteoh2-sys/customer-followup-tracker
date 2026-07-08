"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Customer, CustomerInput } from "@/lib/types";

const blankCustomer: CustomerInput = { name: "", email: "", phone: "", company: "" };

export default function CustomersPage() {
  const supabase = useMemo(() => createClient(), []);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [form, setForm] = useState<CustomerInput>(blankCustomer);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadCustomers() {
    setLoading(true);
    const { data, error } = await supabase.from("customers").select("*").order("created_at", { ascending: false });
    if (error) setMessage(error.message);
    else {
      setCustomers((data ?? []) as Customer[]);
      setMessage("");
    }
    setLoading(false);
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  function startEdit(customer: Customer) {
    setEditing(customer);
    setForm({
      name: customer.name,
      email: customer.email ?? "",
      phone: customer.phone ?? "",
      company: customer.company ?? "",
    });
  }

  function resetForm() {
    setEditing(null);
    setForm(blankCustomer);
    setMessage("");
  }

  async function saveCustomer(event: FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) {
      setMessage("Customer name is required.");
      return;
    }

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      company: form.company.trim() || null,
    };

    const result = editing
      ? await supabase.from("customers").update(payload).eq("id", editing.id)
      : await supabase.from("customers").insert(payload);

    if (result.error) setMessage(result.error.message);
    else {
      await supabase.from("activities").insert({
        entity_type: "customer",
        entity_id: editing?.id ?? "00000000-0000-0000-0000-000000000000",
        action: editing ? "updated" : "created",
        detail: payload,
      });
      resetForm();
      await loadCustomers();
    }

    setSaving(false);
  }

  async function deleteCustomer(customer: Customer) {
    if (!window.confirm(`Delete ${customer.name} and all linked requests, tasks, and notes?`)) return;
    const { error } = await supabase.from("customers").delete().eq("id", customer.id);
    if (error) setMessage(error.message);
    else await loadCustomers();
  }

  return (
    <main className="min-h-screen px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-7">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link className="text-sm font-semibold text-indigo-700" href="/">Dashboard</Link>
            <h1 className="mt-2 text-3xl font-bold text-slate-950">Customers</h1>
            <p className="mt-2 text-slate-600">Add customers, then open one to manage their requests.</p>
          </div>
        </header>

        {message ? <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{message}</div> : null}

        <section className="grid gap-5 lg:grid-cols-[360px_1fr]">
          <form className="rounded-md bg-white p-5 shadow-sm ring-1 ring-slate-200" onSubmit={saveCustomer}>
            <h2 className="text-lg font-semibold text-slate-950">{editing ? "Edit customer" : "Add customer"}</h2>
            <div className="mt-4 grid gap-3">
              <input className="rounded-md border border-slate-300 px-3 py-2" placeholder="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
              <input className="rounded-md border border-slate-300 px-3 py-2" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
              <input className="rounded-md border border-slate-300 px-3 py-2" placeholder="Phone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
              <input className="rounded-md border border-slate-300 px-3 py-2" placeholder="Company" value={form.company} onChange={(event) => setForm({ ...form, company: event.target.value })} />
            </div>
            <div className="mt-4 flex gap-2">
              <button className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white" disabled={saving}>{saving ? "Saving" : editing ? "Save changes" : "Add customer"}</button>
              {editing ? <button className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold" type="button" onClick={resetForm}>Cancel</button> : null}
            </div>
          </form>

          <section className="overflow-hidden rounded-md bg-white shadow-sm ring-1 ring-slate-200">
            {loading ? <div className="p-6 text-slate-600">Loading customers...</div> : null}
            {!loading && customers.length === 0 ? <div className="p-6 text-slate-600">No customers yet. Add one with the form.</div> : null}
            {customers.map((customer) => (
              <div className="grid gap-3 border-b border-slate-100 p-4 last:border-b-0 sm:grid-cols-[1fr_auto]" key={customer.id}>
                <Link href={`/customers/${customer.id}/requests`}>
                  <h2 className="font-semibold text-slate-950">{customer.name}</h2>
                  <p className="text-sm text-slate-600">{customer.company || "No company"} · {customer.email || "No email"}</p>
                  <p className="text-sm text-slate-500">{customer.phone || "No phone"}</p>
                </Link>
                <div className="flex items-start gap-2">
                  <button className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold" onClick={() => startEdit(customer)}>Edit</button>
                  <button className="rounded-md border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700" onClick={() => deleteCustomer(customer)}>Delete</button>
                </div>
              </div>
            ))}
          </section>
        </section>
      </div>
    </main>
  );
}
