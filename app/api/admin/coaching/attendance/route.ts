import { NextResponse, NextRequest } from "next/server";
import { getServiceSupabase } from "@/lib/supabaseClient";

// 1. GET handler (to fetch existing attendance for one session)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json(
      { message: "Missing sessionId" },
      { status: 400 }
    );
  }

  try {
    const db = getServiceSupabase();
    const { data, error } = await db
      .from("session_attendance")
      .select("player_id, status")
      .eq("session_id", sessionId);
    if (error) throw error;
    const attendanceRecords = (data || []).map((row: any) => ({
      playerId: row.player_id,
      status: row.status,
    }));
    return NextResponse.json(attendanceRecords);
  } catch (error) {
    console.error("Failed to fetch attendance:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// 2. POST handler (to save/update attendance for a session)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, attendanceData } = body;

    if (!sessionId || !attendanceData || !Array.isArray(attendanceData)) {
      return NextResponse.json(
        { message: "Missing sessionId or invalid attendanceData" },
        { status: 400 }
      );
    }
    const db = getServiceSupabase();
    const rows = attendanceData.map((r: any) => ({ session_id: sessionId, player_id: r.playerId, status: r.status }));
    if (rows.length > 0) {
      const { error } = await db
        .from("session_attendance")
        .upsert(rows, { onConflict: "session_id,player_id" });
      if (error) throw error;
    }
    return NextResponse.json({ message: "Attendance saved successfully" });
  } catch (error) {
    console.error("Failed to save attendance:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}