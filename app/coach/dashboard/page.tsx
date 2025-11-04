"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type AssignedSession = {
  id: string;
  programId?: string;
  date: string;
  location: string;
  type: string;
  programName?: string;
};

export default function CoachDashboardPage() {
  const [sessions, setSessions] = useState<AssignedSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        setError("Please login as a coach");
        return;
      }
      try {
        const res = await fetch(`/api/coach/sessions?userId=${user.id}`);
        if (!res.ok) throw new Error("Failed to load sessions");
        const j = await res.json();
        setSessions(j.sessions || []);
      } catch (e: any) {
        setError(e?.message || "Failed to load sessions");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Coach Dashboard</h1>
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : sessions.length === 0 ? (
          <p>No assigned sessions.</p>
        ) : (
          <div className="space-y-3">
            {sessions.map((s) => (
              <div key={s.id} className="border rounded-md p-3 bg-white">
                <div className="font-medium">{new Date(s.date).toLocaleString()}</div>
                <div className="text-sm text-gray-600">{s.location} • {s.type}</div>
                {s.programName && (
                  <div className="text-xs text-gray-500 mb-2">Program: {s.programName}</div>
                )}
                <div className="flex flex-wrap gap-2">
                  <button className="px-3 py-1 rounded-md border text-sm" onClick={() => window.location.assign(`/coach/sessions/${s.id}/attendance`)}>Attendance</button>
                  <button className="px-3 py-1 rounded-md border text-sm" onClick={() => window.location.assign(`/coach/player-development/skill-assessment?programId=${s.programId || ""}`)}>Skill Assessment</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


