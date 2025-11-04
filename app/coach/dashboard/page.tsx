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
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Coach Dashboard</h1>
          <div className="flex items-center gap-2">
            <button className="text-sm px-3 py-1 rounded-md border hover:bg-gray-50" onClick={() => window.location.assign('/coach/home-visits')}>Home Visits</button>
            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">Sessions: {sessions.length}</span>
          </div>
        </div>
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse border rounded-md p-3 bg-white">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/4 mb-3" />
                <div className="h-8 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : sessions.length === 0 ? (
          <div className="bg-white border rounded-md p-6 text-center text-gray-600">
            No assigned sessions yet.
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((s) => (
              <div key={s.id} className="border rounded-md p-3 bg-white shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{new Date(s.date).toLocaleString()}</div>
                  <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">{s.type}</span>
                </div>
                <div className="text-sm text-gray-600 mt-1">{s.location}</div>
                {s.programName && (
                  <div className="text-xs text-gray-500 mb-2">Program: {s.programName}</div>
                )}
                <div className="flex flex-wrap gap-2 pt-1">
                  <button className="px-3 py-1 rounded-md border text-sm hover:bg-gray-50" onClick={() => window.location.assign(`/coach/sessions/${s.id}/attendance`)}>Attendance</button>
                  <button className="px-3 py-1 rounded-md border text-sm hover:bg-gray-50" onClick={() => window.location.assign(`/coach/player-development/skill-assessment?programId=${s.programId || ""}`)}>Skill Assessment</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


