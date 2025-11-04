import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabaseClient";
import { createClient } from "@supabase/supabase-js";

// GET pending/completed spirit scores for the logged-in player (optional filters)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tournamentId = searchParams.get('tournamentId') || undefined;
    const status = searchParams.get('status') || undefined; // pending | submitted
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization') || '';
    const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL as string, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await anon.auth.getUser();
    const uid = user?.id;
    if (!uid) return NextResponse.json({ items: [] });

    const svc = getServiceSupabase();
    // Resolve player by email (auth_user_id may not be stored)
    const { data: userProfile } = await anon.auth.getUser();
    const email = userProfile.user?.email || '';
    const { data: player } = await svc.from('players').select('id,email').eq('email', email).maybeSingle();
    if (!player) return NextResponse.json({ items: [] });

    const { data: memberships } = await svc.from('team_members').select('team_id, tournament_id').eq('player_id', player.id);
    const teamIds = Array.from(new Set((memberships||[]).map((m:any)=>m.team_id)));
    const tIds = tournamentId ? [tournamentId] : Array.from(new Set((memberships||[]).map((m:any)=>m.tournament_id)));

    // Completed matches involving player's teams
    const { data: matches } = await svc
      .from('matches')
      .select('id, tournament_id, team1_id, team2_id, status, scheduled_date, scheduled_time, field')
      .in('tournament_id', tIds)
      .or(teamIds.map(id=>`team1_id.eq.${id},team2_id.eq.${id}`).join(','))
      .ilike('status', 'completed%');

    const matchIds = (matches||[]).map((m:any)=>m.id);
    if (matchIds.length === 0) return NextResponse.json({ items: [] });

    const { data: scores } = await svc
      .from('spirit_scores')
      .select('match_id, scoring_team_id')
      .in('match_id', matchIds)
      .in('scoring_team_id', teamIds);

    const submittedKeys = new Set((scores||[]).map((s:any)=>`${s.match_id}:${s.scoring_team_id}`));
    const items = (matches||[]).flatMap((m:any)=>
      teamIds
        .filter((tid)=> m.team1_id===tid || m.team2_id===tid)
        .map((tid)=>({ match: m, scoringTeamId: tid, submitted: submittedKeys.has(`${m.id}:${tid}`) }))
    );

    const filtered = status === 'pending' ? items.filter(i=>!i.submitted) : status === 'submitted' ? items.filter(i=>i.submitted) : items;
    return NextResponse.json({ items: filtered });
  } catch (e:any) {
    return NextResponse.json({ message: e?.message || 'Failed' }, { status: 500 });
  }
}

// POST submit spirit score
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { matchId, scoringTeamId, scoredTeamId, metrics, total, notes, players } = body;
    const svc = getServiceSupabase();
    // if per-player provided
    if (Array.isArray(players) && players.length) {
      const rows = players.map((p:any)=> ({ match_id: matchId, scoring_team_id: scoringTeamId, scored_player_id: p.playerId, metrics: p.metrics||{}, total: p.total||0, notes: p.notes||null }));
      const { error: insErr } = await svc.from('spirit_player_scores').upsert(rows, { onConflict: 'match_id,scoring_team_id,scored_player_id' });
      if (insErr) throw insErr;
      // Aggregate team total as sum of player totals (or average)
      const aggTotal = rows.reduce((a,b)=>a + (Number(b.total)||0), 0);
      await svc.from('spirit_scores').upsert({ match_id: matchId, scoring_team_id: scoringTeamId, scored_team_id: scoredTeamId, metrics: metrics || {}, total: total ?? aggTotal, notes: notes || null }, { onConflict: 'match_id,scoring_team_id' });
    } else {
      const { error } = await svc.from('spirit_scores').upsert({ match_id: matchId, scoring_team_id: scoringTeamId, scored_team_id: scoredTeamId, metrics: metrics || {}, total: total ?? 0, notes: notes || null }, { onConflict: 'match_id,scoring_team_id' });
      if (error) throw error;
    }
    return NextResponse.json({ success: true });
  } catch (e:any) {
    return NextResponse.json({ message: e?.message || 'Failed' }, { status: 500 });
  }
}


