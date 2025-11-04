import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabaseClient";

// GET /api/coach/assessments/history?playerId=...
// Returns assessment history for the player, limited by RLS to sessions the coach can access
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const playerId = searchParams.get("playerId");
    if (!playerId) return NextResponse.json({ message: "Missing playerId" }, { status: 400 });

    const db = getServiceSupabase();
    const { data, error } = await db
      .from("session_assessments")
      .select("session_id, metrics, notes, score, sessions!inner(date,location)")
      .eq("player_id", playerId)
      .order("sessions.date", { ascending: false });
    if (error) throw error;

    const history = (data || []).map((row: any) => ({
      sessionId: row.session_id,
      sessionDate: row.sessions?.date,
      sessionLocation: row.sessions?.location,
      skill1Score: row.metrics?.skill1 ?? null,
      skill2Score: row.metrics?.skill2 ?? null,
      skill3Score: row.metrics?.skill3 ?? null,
      skill4Score: row.metrics?.skill4 ?? null,
      skill5Score: row.metrics?.skill5 ?? null,
      comments: row.notes ?? null,
      score: row.score ?? null,
    }));

    return NextResponse.json({ history });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || "Failed" }, { status: 500 });
  }
}


