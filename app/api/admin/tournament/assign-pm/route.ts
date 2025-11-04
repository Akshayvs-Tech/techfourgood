import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabaseClient";

// POST { tournamentId, programManagerId }
export async function POST(req: NextRequest) {
  try {
    const { tournamentId, programManagerId } = await req.json();
    if (!tournamentId || !programManagerId) {
      return NextResponse.json({ message: "tournamentId and programManagerId required" }, { status: 400 });
    }
    const db = getServiceSupabase();
    const { error } = await db
      .from("tournament_program_managers")
      .upsert({ tournament_id: tournamentId, program_manager_id: programManagerId });
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || "Failed" }, { status: 500 });
  }
}


