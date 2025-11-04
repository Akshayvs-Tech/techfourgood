import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabaseClient";

export async function GET(req: NextRequest, ctx: { params: { sessionId: string } } | any) {
  try {
    // Handle Next.js versions where params may be a Promise
    const awaitedParams = ctx?.params && typeof ctx.params.then === "function" ? await ctx.params : ctx.params;
    const sessionId = awaitedParams?.sessionId;
    if (!sessionId) return NextResponse.json({ message: "Missing sessionId" }, { status: 400 });

    const db = getServiceSupabase();

    const { data: session, error: sErr } = await db
      .from("sessions")
      .select("id, program_id, date, location, type")
      .eq("id", sessionId)
      .maybeSingle();
    if (sErr) throw sErr;
    if (!session) return NextResponse.json({ message: "Not found" }, { status: 404 });

    const [{ data: program }, { data: links }] = await Promise.all([
      db.from("programs").select("id, name").eq("id", session.program_id).maybeSingle(),
      db.from("program_players").select("player_id").eq("program_id", session.program_id),
    ]);

    const playerIds = (links || []).map((l: any) => l.player_id);
    let players: any[] = [];
    if (playerIds.length) {
      const { data } = await db
        .from("players")
        .select("id, full_name")
        .in("id", playerIds);
      players = data || [];
    }

    return NextResponse.json({
      id: session.id,
      date: session.date,
      location: session.location,
      type: session.type,
      programId: session.program_id,
      programName: program?.name,
      roster: players.map((p) => ({ id: p.id, name: p.full_name })),
    });
  } catch (e) {
    return NextResponse.json({ message: "Failed" }, { status: 500 });
  }
}


