"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function PmDashboardPage() {
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [past, setPast] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError("Please login"); setLoading(false); return; }
      try {
        const res = await fetch(`/api/pm/tournaments?userId=${user.id}`);
        const j = await res.json();
        setUpcoming(j.upcoming || []);
        setPast(j.past || []);
      } catch (e: any) {
        setError(e?.message || "Failed");
      } finally { setLoading(false); }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Program Manager Dashboard</h1>
        {loading ? <p>Loading...</p> : error ? <p className="text-red-600">{error}</p> : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-md border p-4">
              <h2 className="font-semibold mb-3">Upcoming Tournaments</h2>
              <div className="space-y-2">
                {upcoming.length === 0 ? <p className="text-sm text-gray-500">None</p> : upcoming.map((t: any) => (
                  <div key={t.id} className="flex items-center justify-between border rounded p-2">
                    <div>
                      <div className="font-medium">{t.name}</div>
                      <div className="text-xs text-gray-500">{new Date(t.start_date).toLocaleDateString()} - {new Date(t.end_date).toLocaleDateString()}</div>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-1 rounded-md border text-sm" onClick={() => window.location.assign(`/pm/tournaments/${t.id}/matches`)}>Manage Matches</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-md border p-4">
              <h2 className="font-semibold mb-3">Past Tournaments</h2>
              <div className="space-y-2">
                {past.length === 0 ? <p className="text-sm text-gray-500">None</p> : past.map((t: any) => (
                  <div key={t.id} className="flex items-center justify-between border rounded p-2">
                    <div>
                      <div className="font-medium">{t.name}</div>
                      <div className="text-xs text-gray-500">{new Date(t.start_date).toLocaleDateString()} - {new Date(t.end_date).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


