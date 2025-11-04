"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";

type Coach = { id: string; full_name: string; email: string; phone?: string | null };

export default function CoachesAdminPage() {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ fullName: "", email: "", phone: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("coaches")
      .select("id, full_name, email, phone")
      .order("full_name");
    setLoading(false);
    if (error) setError(error.message);
    else setCoaches((data as any) || []);
  };

  useEffect(() => {
    load();
  }, []);

  const onAddCoach = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/admin/coaches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: form.fullName,
        email: form.email,
        phone: form.phone || null,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.message || "Failed to add coach");
      return;
    }
    setForm({ fullName: "", email: "", phone: "" });
    load();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Coaches</h1>
        <div className="bg-white border rounded-lg p-4 mb-6">
          <form onSubmit={onAddCoach} className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              className="border rounded-md px-3 py-2"
              placeholder="Full name"
              value={form.fullName}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              required
            />
            <input
              type="email"
              className="border rounded-md px-3 py-2"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
            <input
              className="border rounded-md px-3 py-2"
              placeholder="Phone (optional)"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
            <Button type="submit" disabled={saving}>
              {saving ? "Adding..." : "Add Coach"}
            </Button>
          </form>
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        </div>
        <div className="bg-white border rounded-lg">
          {loading ? (
            <p className="p-4">Loading...</p>
          ) : coaches.length === 0 ? (
            <p className="p-4 text-gray-600">No coaches yet.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-600 border-b">
                  <th className="p-3">Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Phone</th>
                </tr>
              </thead>
              <tbody>
                {coaches.map((c) => (
                  <tr key={c.id} className="border-b last:border-0">
                    <td className="p-3">{c.full_name}</td>
                    <td className="p-3">{c.email}</td>
                    <td className="p-3">{c.phone || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}



