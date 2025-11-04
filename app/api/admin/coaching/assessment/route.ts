import { NextResponse, NextRequest } from "next/server";
import { getServiceSupabase } from "@/lib/supabaseClient";

// 1. UPDATED: GET handler (to fetch one OR all assessments)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const playerId = searchParams.get("playerId");
  const sessionId = searchParams.get("sessionId");

  if (!playerId) {
    return NextResponse.json(
      { message: "Missing required query parameter: playerId" },
      { status: 400 }
    );
  }
  try {
    const db = getServiceSupabase();
    if (sessionId) {
      const { data, error } = await db
        .from("session_assessments")
        .select("metrics, notes, score")
        .eq("session_id", sessionId)
        .eq("player_id", playerId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return NextResponse.json({ message: "Assessment not found" }, { status: 404 });
      const m = (data.metrics || {}) as any;
      return NextResponse.json({
        skill1Score: m.skill1 ?? null,
        skill2Score: m.skill2 ?? null,
        skill3Score: m.skill3 ?? null,
        skill4Score: m.skill4 ?? null,
        skill5Score: m.skill5 ?? null,
        comments: data.notes ?? null,
        score: data.score ?? null,
      });
    } else {
      const { data, error } = await db
        .from("session_assessments")
        .select("session_id, metrics, notes, score, sessions!inner(date,location)")
        .eq("player_id", playerId)
        .order("sessions.date", { ascending: false });
      if (error) throw error;
      const feedbackHistory = (data || []).map((row: any) => ({
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
      return NextResponse.json(feedbackHistory);
    }
  } catch (error) {
    console.error("Failed to fetch assessment(s):", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// 2. POST handler (to save or update an assessment)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      sessionId,
      playerId,
      skill1Score,
      skill2Score,
      skill3Score,
      skill4Score,
      skill5Score,
      comments,
    } = body;

    if (!sessionId || !playerId || !skill1Score) {
      return NextResponse.json(
        { message: "Missing required assessment data" },
        { status: 400 }
      );
    }
    const db = getServiceSupabase();
    const metrics = {
      skill1: skill1Score ?? null,
      skill2: skill2Score ?? null,
      skill3: skill3Score ?? null,
      skill4: skill4Score ?? null,
      skill5: skill5Score ?? null,
    };
    const { error } = await db
      .from("session_assessments")
      .upsert(
        [{ session_id: sessionId, player_id: playerId, metrics, notes: comments ?? null }],
        { onConflict: "session_id,player_id" }
      );
    if (error) throw error;
    return NextResponse.json({ message: "Assessment saved successfully" });
  } catch (error) {
    console.error("Failed to save assessment:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}