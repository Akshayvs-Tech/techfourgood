import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabaseClient";

export async function GET() {
  try {
    const db = getServiceSupabase();
    const { data: matches, error } = await db
      .from("matches")
      .select("team1_id, team2_id, score1, score2, status")
      .in("status", ["in-progress", "completed"])
      .order("updated_at", { ascending: false })
      .limit(10);
    if (error) throw error;

    const teamIds = Array.from(new Set((matches || []).flatMap((m: any) => [m.team1_id, m.team2_id]).filter(Boolean)));
    const { data: teams } = teamIds.length ? await db.from("teams").select("id,name").in("id", teamIds) : ({ data: [] } as any);
    const teamById = new Map((teams || []).map((t: any) => [t.id, t.name]));

    const payload = (matches || []).map((m: any) => ({
      teamA: teamById.get(m.team1_id) || "TBD",
      teamB: teamById.get(m.team2_id) || "TBD",
      scoreA: m.score1 || 0,
      scoreB: m.score2 || 0,
      status: m.status,
    }));
    return NextResponse.json(payload);
  } catch (error) {
    console.error("Error fetching live scores:", error);
    return NextResponse.json({ error: "Failed to fetch live scores" }, { status: 500 });
  }
}
