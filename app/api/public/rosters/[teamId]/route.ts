import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabaseClient";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ teamId: string }> | { teamId: string } }
) {
  const tournamentId = req.nextUrl.searchParams.get("tournamentId");
  if (!tournamentId) {
    return NextResponse.json({ message: "tournamentId required" }, { status: 400 });
  }
  try {
    const resolved = (context?.params && typeof (context as any).params.then === "function")
      ? await (context as any).params
      : (context as any).params;
    const teamId = resolved?.teamId;
    const db = getServiceSupabase();
    const { data, error } = await db
      .from("team_rosters")
      .select("team_id, tournament_id, player_ids, status")
      .eq("team_id", teamId)
      .eq("tournament_id", tournamentId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({});
    return NextResponse.json({
      roster: {
        teamId: data.team_id,
        tournamentId: data.tournament_id,
        playerIds: data.player_ids || [],
        status: data.status,
      },
    });
  } catch (e: any) {
    return NextResponse.json({});
  }
}



