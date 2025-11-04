"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Player = { id: string; name: string };
type SessionDetail = {
  id: string;
  date: string;
  location: string;
  type: string;
  programId: string;
  programName?: string;
  roster: Player[];
};

export default function CoachSessionDetailPage() {
  const params = useParams<{ sessionId: string }>();
  const router = useRouter();
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/coach/sessions/${params.sessionId}`);
        if (!res.ok) throw new Error("Failed to load session");
        const j = await res.json();
        setDetail(j);
      } catch (e: any) {
        setError(e?.message || "Failed to load session");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params.sessionId]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!detail) return <div className="p-6">Not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Session Details</h1>
          <p className="text-gray-600">{detail.programName || "Program"}</p>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="font-medium">{new Date(detail.date).toLocaleString()}</div>
          <div className="text-sm text-gray-600">{detail.location} • {detail.type}</div>
        </div>

        <div className="flex gap-3">
          <button
            className="px-4 py-2 rounded-md bg-blue-600 text-white"
            onClick={() => router.push(`/coach/sessions/${detail.id}/attendance`)}
          >
            Mark Attendance
          </button>
          <button
            className="px-4 py-2 rounded-md border"
            onClick={() => router.push(`/coach/sessions/${detail.id}/assessment`)}
          >
            Skill Assessment
          </button>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Roster ({detail.roster.length})</h2>
          {detail.roster.length === 0 ? (
            <p className="text-sm text-gray-500">No players on this program roster.</p>
          ) : (
            <ul className="space-y-1">
              {detail.roster.map((p) => (
                <li key={p.id} className="text-sm">{p.name}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}


