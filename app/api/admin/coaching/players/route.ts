import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabaseClient";

// GET /api/admin/coaching/players?search=...&limit=20
// Global player search for coaching program roster building
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = (searchParams.get("search") || "").trim();
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10) || 20, 50);

    const db = getServiceSupabase();

    // Build base player list (either latest or search results)
    const baseQuery = db
      .from("players")
      .select("id, full_name, email, contact_number")
      .order(search ? "full_name" : "created_at", { ascending: !search })
      .limit(limit);

    if (search) {
      baseQuery.or(
        `full_name.ilike.%${search}%,email.ilike.%${search}%,contact_number.ilike.%${search}%`
      );
    }

    const { data: players, error: pErr } = await baseQuery;
    if (pErr) throw pErr;

    const playerList = players || [];
    const playerIds = playerList.map((p: any) => p.id);

    if (playerIds.length === 0) return NextResponse.json([]);

    // Fetch team memberships for these players
    const { data: memberships, error: mErr } = await db
      .from("team_members")
      .select("player_id, team_id, tournament_id")
      .in("player_id", playerIds);
    if (mErr) throw mErr;

    const teamIds = Array.from(new Set((memberships || []).map((m: any) => m.team_id).filter(Boolean)));
    const tournamentIds = Array.from(new Set((memberships || []).map((m: any) => m.tournament_id).filter(Boolean)));

    // Fetch team and tournament names
    const [{ data: teams, error: tErr }, { data: tournaments, error: trErr }] = await Promise.all([
      db.from("teams").select("id, name").in("id", teamIds.length ? teamIds : ["00000000-0000-0000-0000-000000000000"]).returns<any[]>(),
      db.from("tournaments").select("id, name").in("id", tournamentIds.length ? tournamentIds : ["00000000-0000-0000-0000-000000000000"]).returns<any[]>(),
    ]);
    if (tErr) throw tErr;
    if (trErr) throw trErr;

    const teamById = new Map((teams || []).map((t: any) => [t.id, t.name]));
    const tournamentById = new Map((tournaments || []).map((t: any) => [t.id, t.name]));

    const membershipsByPlayer = new Map<string, { teamName: string; tournamentName: string }[]>();
    (memberships || []).forEach((m: any) => {
      const list = membershipsByPlayer.get(m.player_id) || [];
      list.push({
        teamName: teamById.get(m.team_id) || "",
        tournamentName: tournamentById.get(m.tournament_id) || "",
      });
      membershipsByPlayer.set(m.player_id, list);
    });

    const results = playerList.map((p: any) => ({
      id: p.id,
      name: p.full_name,
      email: p.email,
      phone: p.contact_number,
      affiliations: (membershipsByPlayer.get(p.id) || []).filter(a => a.teamName || a.tournamentName),
    }));

    return NextResponse.json(results);
  } catch (e) {
    return NextResponse.json({ message: "Failed to search players" }, { status: 500 });
  }
}


