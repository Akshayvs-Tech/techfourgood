import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabaseClient";

// GET /api/pm/matches?tournamentId=...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tournamentId = searchParams.get("tournamentId");
    if (!tournamentId) return NextResponse.json({ matches: [] });
    const db = getServiceSupabase();
    const { data, error } = await db
      .from("matches")
      .select("id, match_number, round, pool, team1_id, team2_id, scheduled_date, scheduled_time, field, duration, status, score1, score2")
      .eq("tournament_id", tournamentId)
      .order("scheduled_date")
      .order("scheduled_time");
    if (error) throw error;
    return NextResponse.json({ matches: data || [] });
  } catch (e: any) {
    return NextResponse.json({ matches: [] });
  }
}

// POST create matches (bulk)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tournamentId, matches } = body as { tournamentId: string; matches: any[] };
    if (!tournamentId || !Array.isArray(matches)) {
      return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
    }
    const db = getServiceSupabase();
    const rows = matches.map((m) => ({
      tournament_id: tournamentId,
      match_number: m.matchNumber ?? null,
      round: m.round ?? null,
      pool: m.pool ?? null,
      team1_id: m.team1Id ?? null,
      team2_id: m.team2Id ?? null,
      scheduled_date: m.scheduledDate ?? null,
      scheduled_time: m.scheduledTime ?? null,
      field: m.field ?? null,
      duration: m.duration ?? 75,
      status: m.status ?? "scheduled",
      score1: m.score1 ?? null,
      score2: m.score2 ?? null,
    }));
    const { error } = await db.from("matches").insert(rows);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || "Failed" }, { status: 500 });
  }
}

// PATCH update score/status for one match
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { matchId, score1, score2, status } = body as { matchId: string; score1?: number; score2?: number; status?: string };
    if (!matchId) return NextResponse.json({ message: "matchId required" }, { status: 400 });
    const db = getServiceSupabase();
    const { error } = await db
      .from("matches")
      .update({ score1: score1 ?? null, score2: score2 ?? null, status: status ?? undefined })
      .eq("id", matchId);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || "Failed" }, { status: 500 });
  }
}


