import { NextResponse, NextRequest } from "next/server";
import { getServiceSupabase } from "@/lib/supabaseClient";

// 2. NEW: GET handler (to fetch program details)
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
      .from("programs")
      .select("id, name, start_date, is_active, roles, schedule_notes")
      .eq("id", programId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ message: "Program not found" }, { status: 404 });
    const program = {
      id: data.id,
      name: data.name,
      startDate: data.start_date,
      isActive: data.is_active,
      roles: data.roles || [],
      scheduleNotes: data.schedule_notes || "",
    };
    return NextResponse.json(program);
  } catch (error) {
    console.error("Failed to fetch program:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// 3. UPDATED: POST handler (to create OR update a program)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { programId, name, startDate, isActive, roles, scheduleNotes } = body;
    const db = getServiceSupabase();

    if (programId) {
      const { data, error } = await db
        .from("programs")
        .update({ roles, schedule_notes: scheduleNotes })
        .eq("id", programId)
        .select()
        .maybeSingle();
      if (error) throw error;
      return NextResponse.json(data, { status: 200 });
    } else {
      if (!name || !startDate) {
        return NextResponse.json({ message: "Missing required fields: name and startDate" }, { status: 400 });
      }
      const { data, error } = await db
        .from("programs")
        .insert({ name, start_date: startDate, is_active: isActive ?? true })
        .select()
        .maybeSingle();
      if (error) throw error;
      return NextResponse.json(data, { status: 201 });
    }
  } catch (error) {
    console.error("Failed to save program:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}