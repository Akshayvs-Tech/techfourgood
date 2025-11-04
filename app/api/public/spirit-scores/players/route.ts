import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabaseClient";

// GET /api/public/spirit-scores/players?matchId=...&teamRole=opponent
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const matchId = searchParams.get('matchId')!;
    if (!matchId) return NextResponse.json({ players: [] });
    const svc = getServiceSupabase();
    const { data: m } = await svc.from('matches').select('id,team1_id,team2_id').eq('id', matchId).maybeSingle();
    if (!m) return NextResponse.json({ players: [] });
    // Return roster for both teams; client will choose opponent
    const teamIds = [m.team1_id, m.team2_id];
    const { data: roster } = await svc
      .from('team_members')
      .select('player:player_id(id, full_name, email), team_id')
      .in('team_id', teamIds);
    return NextResponse.json({ players: roster || [], team1_id: m.team1_id, team2_id: m.team2_id });
  } catch (e:any) {
    return NextResponse.json({ players: [] });
  }
}


