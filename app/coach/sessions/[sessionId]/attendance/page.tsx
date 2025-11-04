"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Player = { id: string; name: string };

export default function CoachAttendancePage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId;
  const [roster, setRoster] = useState<Player[]>([]);
  const [status, setStatus] = useState<Record<string, "Present" | "Absent" | undefined>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [detailRes, attRes] = await Promise.all([
          fetch(`/api/coach/sessions/${sessionId}`),
          fetch(`/api/coach/sessions/${sessionId}/attendance`),
        ]);
        if (!detailRes.ok) throw new Error("Failed to load roster");
        const detail = await detailRes.json();
        setRoster(detail.roster || []);
        if (attRes.ok) {
          const j = await attRes.json();
          const m: Record<string, "Present" | "Absent"> = {};
          (j.attendance || []).forEach((r: any) => {
            m[r.player_id] = r.status;
          });
          setStatus(m);
        }
      } catch (e: any) {
        setError(e?.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [sessionId]);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const attendance = roster
        .filter((p) => status[p.id])
        .map((p) => ({ playerId: p.id, status: status[p.id] as "Present" | "Absent" }));
      const res = await fetch(`/api/coach/sessions/${sessionId}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendance }),
      });
      if (!res.ok) throw new Error("Failed to save attendance");
      alert("Attendance saved");
    } catch (e: any) {
      setError(e?.message || "Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Mark Attendance</h1>
        <p className="text-gray-600 mb-4">Session: {sessionId}</p>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            {error && <p className="text-red-600 mb-2">{error}</p>}
            <div className="bg-white border rounded-md p-3 space-y-2">
              {roster.length === 0 ? (
                <p className="text-sm text-gray-500">No players in roster.</p>
              ) : (
                roster.map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span>{p.name}</span>
                    <div className="flex gap-2">
                      <button
                        className={`px-3 py-1 rounded-md text-sm border ${status[p.id] === "Present" ? "bg-green-600 text-white" : ""}`}
                        onClick={() => setStatus((m) => ({ ...m, [p.id]: "Present" }))}
                      >
                        Present
                      </button>
                      <button
                        className={`px-3 py-1 rounded-md text-sm border ${status[p.id] === "Absent" ? "bg-red-600 text-white" : ""}`}
                        onClick={() => setStatus((m) => ({ ...m, [p.id]: "Absent" }))}
                      >
                        Absent
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="flex justify-end mt-4">
              <button className="px-4 py-2 rounded-md bg-blue-600 text-white" disabled={saving} onClick={save}>
                {saving ? "Saving..." : "Save Attendance"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


