import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabaseClient";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { teamId, tournamentId, playerIds, minPlayers, maxPlayers } = body || {};
    if (!teamId || !tournamentId || !Array.isArray(playerIds)) {
      return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
    }
    const db = getServiceSupabase();
    const { error } = await db.from("team_rosters").upsert({
      team_id: teamId,
      tournament_id: tournamentId,
      player_ids: playerIds,
      status: "Submitted",
      min_players: minPlayers || null,
      max_players: maxPlayers || null,
      submitted_at: new Date().toISOString(),
    });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || "Failed" }, { status: 500 });
  }
}



