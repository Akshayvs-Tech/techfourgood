import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabaseClient";

// POST: Assign coaches to a program (affects all sessions in program for visibility)
// Body: { programId: string, coachIds: string[] }
export async function POST(req: NextRequest) {
  try {
    const { programId, coachIds } = await req.json();
    if (!programId || !Array.isArray(coachIds)) {
      return NextResponse.json({ message: "programId and coachIds are required" }, { status: 400 });
    }

    const db = getServiceSupabase();

    // Remove assignments that are no longer selected
    await db
      .from("program_coaches")
      .delete()
      .eq("program_id", programId)
      .not("coach_id", "in", `(${coachIds.join(",") || ""})`);

    // Upsert current selections
    const rows = coachIds.map((id: string) => ({ program_id: programId, coach_id: id }));
    if (rows.length > 0) {
      const { error } = await db
        .from("program_coaches")
        .upsert(rows, { onConflict: "program_id,coach_id" });
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || "Failed to assign coaches" }, { status: 500 });
  }
}


