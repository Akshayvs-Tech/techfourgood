import { NextResponse, NextRequest } from "next/server";
import { getServiceSupabase } from "@/lib/supabaseClient";

// GET: Fetches the roster for a specific program
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const programId = searchParams.get("programId");

  if (!programId) {
    return NextResponse.json(
      { message: "Missing programId" },
      { status: 400 }
    );
  }

  try {
    const db = getServiceSupabase();
    const { data: links, error } = await db
      .from("program_players")
      .select("player_id")
      .eq("program_id", programId)
      .order("player_id");
    if (error) throw error;
    const playerIds = (links || []).map((r: any) => r.player_id);
    if (playerIds.length === 0) return NextResponse.json([]);
    const { data: players, error: pErr } = await db
      .from("players")
      .select("id, full_name")
      .in("id", playerIds);
    if (pErr) throw pErr;
    const roster = (players || []).map((row: any) => ({ id: row.id, name: row.full_name }));
    return NextResponse.json(roster);
  } catch (error) {
    console.error("Failed to fetch roster:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// POST: Adds or removes a player from a program's roster
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { programId, playerId, action } = body;
    if (!programId || !playerId || !action) {
      return NextResponse.json({ message: "Missing programId, playerId, or action" }, { status: 400 });
    }
    const db = getServiceSupabase();
    if (action === "add") {
      const { error } = await db
        .from("program_players")
        .upsert({ program_id: programId, player_id: playerId }, { onConflict: "program_id,player_id" });
      if (error) throw error;
    } else if (action === "remove") {
      const { error } = await db
        .from("program_players")
        .delete()
        .eq("program_id", programId)
        .eq("player_id", playerId);
      if (error) throw error;
    } else {
      return NextResponse.json({ message: "Invalid action. Must be 'add' or 'remove'." }, { status: 400 });
    }
    return NextResponse.json({ message: `Player ${action}ed successfully` });
  } catch (error) {
    console.error("Failed to update roster:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}