"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AdminSpiritScoresPage() {
  const search = useSearchParams();
  const tournamentId = search.get("tournamentId") || "";
  const [loading, setLoading] = useState(true);
  const [teamRows, setTeamRows] = useState<any[]>([]);
  const [playerRows, setPlayerRows] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data: matches } = await supabase
          .from('matches')
          .select('id, tournament_id, team1_id, team2_id, field, scheduled_date, scheduled_time')
          .eq('tournament_id', tournamentId);
        const matchIds = (matches||[]).map(m=>m.id);
        const { data: teams } = await supabase.from('teams').select('id, name');
        const teamMap = new Map((teams||[]).map(t=>[t.id, t.name]));
        const { data: teamScores } = matchIds.length ? await supabase
          .from('spirit_scores')
          .select('match_id, scoring_team_id, total')
          .in('match_id', matchIds) : ({ data: [] } as any);
        const { data: playerScores } = matchIds.length ? await supabase
          .from('spirit_player_scores')
          .select('match_id, scoring_team_id, scored_player_id, total, players:scored_player_id(full_name)')
          .in('match_id', matchIds) : ({ data: [] } as any);

        setTeamRows((teamScores||[]).map(s=> ({
          matchId: s.match_id,
          scoringTeam: teamMap.get(s.scoring_team_id) || s.scoring_team_id,
          total: s.total,
        })));

        setPlayerRows((playerScores||[]).map(s=> ({
          matchId: s.match_id,
          scoringTeam: teamMap.get(s.scoring_team_id) || s.scoring_team_id,
          player: s.players?.full_name || s.scored_player_id,
          total: s.total,
        })));
      } finally {
        setLoading(false);
      }
    };
    if (tournamentId) load();
  }, [tournamentId]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Spirit Scores</h1>
        {loading ? <p>Loading...</p> : (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white border rounded-xl p-4">
              <h2 className="font-semibold mb-2">Team Totals</h2>
              <div className="space-y-2">
                {teamRows.length === 0 ? <p className="text-sm text-gray-500">No submissions yet</p> : teamRows.map((r, i)=> (
                  <div key={i} className="flex items-center justify-between text-sm border rounded p-2">
                    <div>Match #{r.matchId} • {r.scoringTeam}</div>
                    <div className="font-semibold">{r.total}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white border rounded-xl p-4">
              <h2 className="font-semibold mb-2">Per-Player Scores</h2>
              <div className="space-y-2">
                {playerRows.length === 0 ? <p className="text-sm text-gray-500">No submissions yet</p> : playerRows.map((r, i)=> (
                  <div key={i} className="flex items-center justify-between text-sm border rounded p-2">
                    <div>Match #{r.matchId} • {r.scoringTeam} → {r.player}</div>
                    <div className="font-semibold">{r.total}</div>
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


