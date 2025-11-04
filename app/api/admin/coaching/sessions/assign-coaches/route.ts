import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabaseClient";

// POST: Assign coaches to a session
// Body: { sessionId: string, coachIds: string[] }
export async function POST(req: NextRequest) {
  try {
    const { sessionId, coachIds } = await req.json();
    if (!sessionId || !Array.isArray(coachIds)) {
      return NextResponse.json({ message: "sessionId and coachIds are required" }, { status: 400 });
    }

    const db = getServiceSupabase();

    // Remove existing assignments not in the new list
    await db.from("session_coaches").delete().eq("session_id", sessionId).not("coach_id", "in", `(${coachIds.join(",") || ""})`);

    // Upsert new/current assignments
    const rows = coachIds.map((id: string) => ({ session_id: sessionId, coach_id: id }));
    if (rows.length > 0) {
      const { error } = await db
        .from("session_coaches")
        .upsert(rows, { onConflict: "session_id,coach_id" });
      if (error) throw error;
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || "Failed to assign coaches" }, { status: 500 });
  }
}


