"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

type HistoryRow = {
  sessionId: string;
  sessionDate?: string;
  sessionLocation?: string;
  skill1Score?: number | null;
  skill2Score?: number | null;
  skill3Score?: number | null;
  skill4Score?: number | null;
  skill5Score?: number | null;
  comments?: string | null;
  score?: number | null;
};

export default function CoachFeedbackHistoryPage() {
  const params = useParams<{ sessionId: string }>();
  const search = useSearchParams();
  const playerId = search.get("playerId");
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!playerId) {
        setError("Missing playerId");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/coach/assessments/history?playerId=${playerId}`);
        if (!res.ok) throw new Error("Failed to load feedback history");
        const j = await res.json();
        setRows(j.history || []);
      } catch (e: any) {
        setError(e?.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [playerId]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Feedback History</h1>
        <p className="text-gray-600 mb-4">Session: {params.sessionId}</p>
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-gray-500">No feedback yet.</p>
        ) : (
          <div className="bg-white border rounded-md">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="p-2">Date</th>
                  <th className="p-2">Location</th>
                  <th className="p-2">Scores (1-5)</th>
                  <th className="p-2">Comments</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="p-2">{r.sessionDate ? new Date(r.sessionDate).toLocaleDateString() : ""}</td>
                    <td className="p-2">{r.sessionLocation || ""}</td>
                    <td className="p-2">
                      {[r.skill1Score, r.skill2Score, r.skill3Score, r.skill4Score, r.skill5Score]
                        .filter((v) => v != null)
                        .join(", ")}
                    </td>
                    <td className="p-2">{r.comments || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


