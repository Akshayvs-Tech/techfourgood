import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabaseClient";

export async function GET(_req: NextRequest, ctx: { params: { sessionId: string } } | any) {
  try {
    const awaitedParams = ctx?.params && typeof ctx.params.then === "function" ? await ctx.params : ctx.params;
    const sessionId = awaitedParams?.sessionId;
    const db = getServiceSupabase();
    const { data, error } = await db
      .from("session_assessments")
      .select("player_id, metrics, notes, score")
      .eq("session_id", sessionId);
    if (error) throw error;
    return NextResponse.json({ assessments: data || [] });
  } catch (e) {
    return NextResponse.json({ assessments: [] }, { status: 200 });
  }
}

export async function POST(req: NextRequest, ctx: { params: { sessionId: string } } | any) {
  try {
    const awaitedParams = ctx?.params && typeof ctx.params.then === "function" ? await ctx.params : ctx.params;
    const sessionId = awaitedParams?.sessionId;
    const body = await req.json();
    const assessments: { playerId: string; metrics?: any; notes?: string; score?: number }[] = body.assessments || [];
    const rows = assessments.map((a) => ({
      session_id: sessionId,
      player_id: a.playerId,
      metrics: a.metrics ?? {},
      notes: a.notes ?? null,
      score: a.score ?? null,
    }));

    const db = getServiceSupabase();
    if (rows.length > 0) {
      const { error } = await db
        .from("session_assessments")
        .upsert(rows, { onConflict: "session_id,player_id" });
      if (error) throw error;
    }
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || "Failed" }, { status: 500 });
  }
}


