'use client';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

type Metric = { key: string; label: string; min?: number; max?: number };

export default function PlayerSpiritFormPage() {
  const search = useSearchParams();
  const router = useRouter();
  const matchId = search.get('matchId') || '';
  const tournamentId = search.get('tournamentId') || '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [match, setMatch] = useState<any>(null);
  const [scoringTeamId, setScoringTeamId] = useState<string>('');
  const [scoredTeamId, setScoredTeamId] = useState<string>('');
  const [metrics, setMetrics] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [opponentPlayers, setOpponentPlayers] = useState<any[]>([]);
  const [perPlayer, setPerPlayer] = useState<Record<string, Record<string, number>>>({});

  const defaultMetrics: Metric[] = useMemo(() => [
    { key: 'rules', label: 'Knowledge of the Rules', min: 0, max: 5 },
    { key: 'fouls', label: 'Fouls and Body Contact', min: 0, max: 5 },
    { key: 'fair', label: 'Fair-Mindedness', min: 0, max: 5 },
    { key: 'positive', label: 'Positive Attitude and Self-Control', min: 0, max: 5 },
    { key: 'communication', label: 'Communication', min: 0, max: 5 },
  ], []);

  useEffect(() => {
    const load = async () => {
      if (!matchId) { setError('Missing match'); setLoading(false); return; }
      try {
        const { data: user } = await supabase.auth.getUser();
        const email = user.user?.email || '';
        const { data: player } = await supabase.from('players').select('id').eq('email', email).maybeSingle();
        const { data: m } = await supabase.from('matches').select('*').eq('id', matchId).maybeSingle();
        setMatch(m);
        if (player && m) {
          const { data: membership } = await supabase
            .from('team_members')
            .select('team_id')
            .eq('player_id', player.id)
            .in('team_id', [m.team1_id, m.team2_id]);
          const myTeamId = membership?.[0]?.team_id;
          const oppTeamId = myTeamId === m.team1_id ? m.team2_id : m.team1_id;
          setScoringTeamId(myTeamId || '');
          setScoredTeamId(oppTeamId || '');
        }

        // Load spirit categories from config if available
        if (tournamentId) {
          try {
            const cfgRes = await fetch(`/api/admin/setup/spirit?tournamentId=${tournamentId}`);
            const cfg = await cfgRes.json();
            const cats: Metric[] = (cfg?.categories || []).map((c:any)=> ({ key: c.key || c.name, label: c.label || c.name, min: c.min ?? 0, max: c.max ?? 5 }));
            if (cats.length) {
              // replace defaults by mutating array reference via local var
              (defaultMetrics as any).splice(0, (defaultMetrics as any).length, ...cats);
            }
          } catch {}
        }

        // Load opponent players
        try {
          const pr = await fetch(`/api/public/spirit-scores/players?matchId=${matchId}`);
          const pj = await pr.json();
          const oppTeamId = (m?.team1_id && scoringTeamId) ? (scoringTeamId === m.team1_id ? m.team2_id : m.team1_id) : undefined;
          const opp = (pj.players || []).filter((r:any)=> !oppTeamId || r.team_id === oppTeamId).map((r:any)=> ({ id: r.player.id, name: r.player.full_name, email: r.player.email, team_id: r.team_id }));
          setOpponentPlayers(opp);
        } catch {}
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [matchId]);

  const total = Object.values(metrics).reduce((a, b) => a + (Number(b) || 0), 0);

  const submit = async () => {
    setSaving(true);
    try {
      // Ensure opponent team id is set
      let targetScoredTeamId = scoredTeamId;
      let myScoringTeamId = scoringTeamId;

      // Resolve current player and teams if missing
      const { data: auth } = await supabase.auth.getUser();
      const email = auth.user?.email || '';
      if ((!myScoringTeamId || !targetScoredTeamId) && match) {
        const { data: me } = await supabase.from('players').select('id,email').eq('email', email).maybeSingle();
        if (me) {
          const { data: membership } = await supabase
            .from('team_members')
            .select('team_id')
            .eq('player_id', me.id)
            .in('team_id', [match.team1_id, match.team2_id]);
          const myTeamId = membership?.[0]?.team_id;
          if (myTeamId) {
            myScoringTeamId = myTeamId;
            targetScoredTeamId = myTeamId === match.team1_id ? match.team2_id : match.team1_id;
          }
        }
      }

      if (!myScoringTeamId || !targetScoredTeamId) {
        // Fallback using opponent roster
        const oppTeamId = opponentPlayers?.[0]?.team_id;
        if (match && oppTeamId) {
          targetScoredTeamId = oppTeamId;
          myScoringTeamId = match.team1_id === oppTeamId ? match.team2_id : match.team1_id;
        }
      }
      if (!matchId || !myScoringTeamId || !targetScoredTeamId) {
        throw new Error('Unable to resolve teams for this match.');
      }
      const players = opponentPlayers.map(p => ({ playerId: p.id, metrics: perPlayer[p.id] || {}, total: Object.values(perPlayer[p.id] || {}).reduce((a,b)=> a + (Number(b)||0), 0) }));
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch('/api/public/spirit-scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ matchId, scoringTeamId: myScoringTeamId, scoredTeamId: targetScoredTeamId, metrics, total, notes, players }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(()=> '');
        throw new Error(txt || 'Failed to submit');
      }
      router.push('/public/player/dashboard');
    } catch (e:any) {
      setError(e?.message || 'Failed to submit');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-1">Spirit Score</h1>
      <p className="text-sm text-gray-600 mb-4">Match #{match?.id} • Field {match?.field} • {match?.scheduled_date} {match?.scheduled_time}</p>

      <div className="bg-white border rounded-xl p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {defaultMetrics.map(m => (
            <div key={m.key} className="flex items-center justify-between gap-3">
              <label className="text-sm text-gray-700">{m.label}</label>
              <input type="number" min={m.min} max={m.max} className="w-24 border rounded-md px-2 py-1" value={metrics[m.key] ?? ''} onChange={(e)=>setMetrics(v=>({ ...v, [m.key]: Number(e.target.value) }))} />
            </div>
          ))}
        </div>
        <div className="text-sm text-gray-700 mb-3">Total: <span className="font-semibold">{total}</span></div>
        <textarea placeholder="Notes (optional)" className="w-full border rounded-md px-3 py-2" rows={4} value={notes} onChange={(e)=>setNotes(e.target.value)} />

        {opponentPlayers.length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold mb-2">Per-Player Scores (opponent team)</h3>
            <div className="space-y-3">
              {opponentPlayers.map(p => (
                <div key={p.id} className="border rounded-md p-2">
                  <div className="text-sm font-medium mb-2">{p.name}</div>
                  <div className="grid grid-cols-2 gap-2">
                    {defaultMetrics.map(m => (
                      <div key={m.key} className="flex items-center justify-between gap-2">
                        <label className="text-xs text-gray-600">{m.label}</label>
                        <input type="number" min={m.min} max={m.max} className="w-20 border rounded px-2 py-1" value={(perPlayer[p.id]?.[m.key] ?? '') as any} onChange={(e)=> setPerPlayer(s => ({ ...s, [p.id]: { ...(s[p.id]||{}), [m.key]: Number(e.target.value) } }))} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="mt-4 flex gap-2">
          <button className="px-4 py-2 rounded-md border" onClick={()=>router.back()}>Cancel</button>
          <button className="px-4 py-2 rounded-md bg-blue-600 text-white" disabled={saving} onClick={submit}>Submit</button>
        </div>
      </div>
    </div>
  );
}


