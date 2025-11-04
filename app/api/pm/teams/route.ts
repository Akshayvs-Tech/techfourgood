import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabaseClient";

// GET /api/pm/teams?tournamentId=...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tournamentId = searchParams.get("tournamentId");
    if (!tournamentId) return NextResponse.json({ teams: [] });
    const db = getServiceSupabase();

    // Try teams.status ~ approved (case-insensitive)
    const { data: teamsApproved, error: tErr } = await db
      .from("teams")
      .select("id, name, status")
      .eq("tournament_id", tournamentId)
      .ilike("status", "approved%")
      .order("name");
    if (tErr) throw tErr;

    if (teamsApproved && teamsApproved.length > 0) {
      return NextResponse.json({ teams: teamsApproved });
    }

    // Fallback: derive approved teams from team_rosters
    const { data: rosters } = await db
      .from("team_rosters")
      .select("team_id")
      .eq("tournament_id", tournamentId)
      .ilike("status", "approved%");

    const teamIds = Array.from(new Set((rosters || []).map((r: any) => r.team_id).filter(Boolean)));
    if (teamIds.length === 0) return NextResponse.json({ teams: [] });

    const { data: fallbackTeams } = await db
      .from("teams")
      .select("id, name, status")
      .in("id", teamIds)
      .order("name");

    return NextResponse.json({ teams: fallbackTeams || [] });
  } catch (e) {
    return NextResponse.json({ teams: [] });
  }
}


