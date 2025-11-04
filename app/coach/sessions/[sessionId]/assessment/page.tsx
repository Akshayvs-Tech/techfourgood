"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Player = { id: string; name: string };

export default function CoachAssessmentPage() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId;
  const [roster, setRoster] = useState<Player[]>([]);
  const [scores, setScores] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [detailRes, assRes] = await Promise.all([
          fetch(`/api/coach/sessions/${sessionId}`),
          fetch(`/api/coach/sessions/${sessionId}/assessment`),
        ]);
        if (!detailRes.ok) throw new Error("Failed to load roster");
        const detail = await detailRes.json();
        setRoster(detail.roster || []);
        if (assRes.ok) {
          const j = await assRes.json();
          const s: Record<string, string> = {};
          const n: Record<string, string> = {};
          (j.assessments || []).forEach((r: any) => {
            if (r.score != null) s[r.player_id] = String(r.score);
            if (r.notes) n[r.player_id] = r.notes;
          });
          setScores(s);
          setNotes(n);
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
      const assessments = roster.map((p) => ({
        playerId: p.id,
        metrics: {},
        notes: notes[p.id] || null,
        score: scores[p.id] ? Number(scores[p.id]) : null,
      }));
      const res = await fetch(`/api/coach/sessions/${sessionId}/assessment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessments }),
      });
      if (!res.ok) throw new Error("Failed to save assessments");
      alert("Assessments saved");
    } catch (e: any) {
      setError(e?.message || "Failed to save assessments");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Skill Assessment</h1>
        <p className="text-gray-600 mb-4">Session: {sessionId}</p>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            {error && <p className="text-red-600 mb-2">{error}</p>}
            <div className="bg-white border rounded-md p-3 space-y-3">
              {roster.length === 0 ? (
                <p className="text-sm text-gray-500">No players in roster.</p>
              ) : (
                roster.map((p) => (
                  <div key={p.id} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-start border-b last:border-0 py-2">
                    <div className="font-medium">{p.name}</div>
                    <input
                      className="border rounded-md px-2 py-1"
                      placeholder="Score"
                      value={scores[p.id] || ""}
                      onChange={(e) => setScores((m) => ({ ...m, [p.id]: e.target.value }))}
                    />
                    <textarea
                      className="border rounded-md px-2 py-1"
                      placeholder="Notes"
                      value={notes[p.id] || ""}
                      onChange={(e) => setNotes((m) => ({ ...m, [p.id]: e.target.value }))}
                    />
                  </div>
                ))
              )}
            </div>
            <div className="flex justify-end mt-4">
              <button className="px-4 py-2 rounded-md bg-blue-600 text-white" disabled={saving} onClick={save}>
                {saving ? "Saving..." : "Save Assessments"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


