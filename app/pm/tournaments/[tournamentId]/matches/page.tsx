"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Team = { id: string; name: string };
type Match = {
  id?: string;
  matchNumber?: number;
  round?: number;
  pool?: number;
  team1Id?: string;
  team2Id?: string;
  field?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  duration?: number;
};

export default function PmManageMatchesPage() {
  const params = useParams<{ tournamentId: string }>();
  const tournamentId = params.tournamentId;
  const [teams, setTeams] = useState<Team[]>([]);
  const [fields, setFields] = useState<string[]>([]);
  const [existing, setExisting] = useState<any[]>([]);
  const [form, setForm] = useState<Match>({ duration: 75 });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [teamsRes, tRes, matchesRes] = await Promise.all([
          fetch(`/api/pm/teams?tournamentId=${tournamentId}`),
          fetch(`/api/admin/setup/tournament?tournamentId=${tournamentId}`),
          fetch(`/api/pm/matches?tournamentId=${tournamentId}`),
        ]);
        if (teamsRes.ok) {
          const j = await teamsRes.json();
          setTeams(j.teams || []);
        }
        if (tRes.ok) {
          const jt = await tRes.json();
          setFields(jt.tournament?.fields || []);
        }
        if (matchesRes.ok) {
          const jm = await matchesRes.json();
          setExisting(jm.matches || []);
        }
      } catch (e: any) {
        setError(e?.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tournamentId]);

  const createMatch = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = { tournamentId, matches: [{
        matchNumber: form.matchNumber,
        round: form.round,
        pool: form.pool,
        team1Id: form.team1Id,
        team2Id: form.team2Id,
        field: form.field,
        scheduledDate: form.scheduledDate,
        scheduledTime: form.scheduledTime,
        duration: form.duration,
      }]};
      const res = await fetch('/api/pm/matches', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('Failed to create match');
      // refresh
      const mRes = await fetch(`/api/pm/matches?tournamentId=${tournamentId}`);
      const jm = await mRes.json();
      setExisting(jm.matches || []);
      setForm({ duration: 75 });
    } catch (e: any) {
      setError(e?.message || 'Failed to create match');
    } finally { setSaving(false); }
  };

  const updateScore = async (m: any, score1: number | undefined, score2: number | undefined, status?: string) => {
    try {
      const res = await fetch('/api/pm/matches', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId: m.id, score1, score2, status }),
      });
      if (!res.ok) throw new Error('Failed to update score');
      const mRes = await fetch(`/api/pm/matches?tournamentId=${tournamentId}`);
      const jm = await mRes.json();
      setExisting(jm.matches || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to update score');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Manage Matches</h1>
        {loading ? <p>Loading...</p> : (
          <>
            {error && <p className="text-red-600 mb-2">{error}</p>}
            <div className="bg-white rounded-md border p-4 mb-6">
              <h2 className="font-semibold mb-3">Create Match</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Team A</label>
                  <select className="w-full border rounded px-2 py-2" value={form.team1Id || ''} onChange={(e) => setForm((f) => ({ ...f, team1Id: e.target.value }))}>
                    <option value="">Select</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Team B</label>
                  <select className="w-full border rounded px-2 py-2" value={form.team2Id || ''} onChange={(e) => setForm((f) => ({ ...f, team2Id: e.target.value }))}>
                    <option value="">Select</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Field</label>
                  <select className="w-full border rounded px-2 py-2" value={form.field || ''} onChange={(e) => setForm((f) => ({ ...f, field: e.target.value }))}>
                    <option value="">Select</option>
                    {fields.map((field) => <option key={field} value={field}>{field}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <input type="date" className="w-full border rounded px-2 py-2" value={form.scheduledDate || ''} onChange={(e) => setForm((f) => ({ ...f, scheduledDate: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Time</label>
                  <input type="text" placeholder="3:00 PM" className="w-full border rounded px-2 py-2" value={form.scheduledTime || ''} onChange={(e) => setForm((f) => ({ ...f, scheduledTime: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Duration (min)</label>
                  <input type="number" className="w-full border rounded px-2 py-2" value={form.duration || 75} onChange={(e) => setForm((f) => ({ ...f, duration: parseInt(e.target.value)||75 }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Round</label>
                  <input type="number" className="w-full border rounded px-2 py-2" value={form.round || 0} onChange={(e) => setForm((f) => ({ ...f, round: parseInt(e.target.value)||0 }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Pool</label>
                  <input type="number" className="w-full border rounded px-2 py-2" value={form.pool || 0} onChange={(e) => setForm((f) => ({ ...f, pool: parseInt(e.target.value)||0 }))} />
                </div>
              </div>
              <div className="flex justify-end mt-3">
                <button className="px-4 py-2 rounded-md bg-blue-600 text-white" disabled={saving} onClick={createMatch}>{saving ? 'Saving...' : 'Create Match'}</button>
              </div>
            </div>

            <div className="bg-white rounded-md border p-4">
              <h2 className="font-semibold mb-3">Existing Matches</h2>
              {existing.length === 0 ? <p className="text-sm text-gray-500">No matches yet</p> : (
                <div className="space-y-2">
                  {existing.map((m: any) => (
                    <div key={m.id} className="border rounded p-3">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                          <div className="font-medium">{m.match_number ? `Match #${m.match_number}` : 'Match'}</div>
                          <div className="text-xs text-gray-500">{m.scheduled_date || ''} {m.scheduled_time || ''} • {m.field || ''}</div>
                          <div className="text-xs text-gray-500">Round {m.round || 0} {m.pool ? `• Pool ${m.pool}` : ''}</div>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">{(teams.find(t=>t.id===m.team1_id)?.name) || 'TBD'}</span>
                          <span className="mx-2 text-gray-500">vs</span>
                          <span className="font-medium">{(teams.find(t=>t.id===m.team2_id)?.name) || 'TBD'}</span>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-2 items-center">
                        <input type="number" placeholder="Score A" className="border rounded px-2 py-1" defaultValue={m.score1 ?? ''} onBlur={(e)=>updateScore(m, parseInt(e.target.value)||0, m.score2, undefined)} />
                        <input type="number" placeholder="Score B" className="border rounded px-2 py-1" defaultValue={m.score2 ?? ''} onBlur={(e)=>updateScore(m, m.score1, parseInt(e.target.value)||0, undefined)} />
                        <select className="border rounded px-2 py-1" defaultValue={m.status || 'scheduled'} onChange={(e)=>updateScore(m, m.score1, m.score2, e.target.value)}>
                          <option value="scheduled">Scheduled</option>
                          <option value="in-progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        <button className="px-3 py-1 rounded-md border text-sm" onClick={()=>updateScore(m, m.score1, m.score2, 'in-progress')}>Start Live</button>
                        <button className="px-3 py-1 rounded-md border text-sm" onClick={()=>updateScore(m, m.score1, m.score2, 'completed')}>Finalize</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}


