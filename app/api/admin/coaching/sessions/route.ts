import { NextResponse, NextRequest } from "next/server";
import { getServiceSupabase } from "@/lib/supabaseClient";

// 2. GET handler (to fetch all sessions for a program)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const programId = searchParams.get("programId");

  if (!programId) {
    return NextResponse.json(
      { message: "Missing programId query parameter" },
      { status: 400 }
    );
  }

  try {
    const db = getServiceSupabase();
    const { data, error } = await db
      .from("sessions")
      .select("id, program_id, date, location, type")
      .eq("program_id", programId)
      .order("date", { ascending: false });
    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Failed to fetch sessions:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// 3. POST handler (to create a new session)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { programId, date, location, type } = body;
    if (!programId || !date || !location) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }
    const db = getServiceSupabase();
    const { data, error } = await db
      .from("sessions")
      .insert({ program_id: programId, date, location, type })
      .select()
      .maybeSingle();
    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Failed to create session:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// 4. DELETE handler (to remove a session)
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { sessionId } = body;
    if (!sessionId) {
      return NextResponse.json({ message: "Missing sessionId" }, { status: 400 });
    }
    const db = getServiceSupabase();
    const { error, count } = await db
      .from("sessions")
      .delete({ count: "exact" })
      .eq("id", sessionId);
    if (error) throw error;
    if ((count || 0) === 0) {
      return NextResponse.json({ message: "Session not found" }, { status: 404 });
    }
    return NextResponse.json({ message: "Session deleted successfully" });
  } catch (error) {
    console.error("Failed to delete session:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}