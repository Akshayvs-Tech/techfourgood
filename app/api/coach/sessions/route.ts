import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabaseClient";

// GET /api/coach/sessions?userId=auth_user_id
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    if (!userId) return NextResponse.json({ sessions: [] });

    const db = getServiceSupabase();
    // Find coach id by auth user id
    const { data: coach, error: cErr } = await db
      .from("coaches")
      .select("id")
      .eq("auth_user_id", userId)
      .maybeSingle();
    if (cErr || !coach) return NextResponse.json({ sessions: [] });

    // Get sessions from direct session assignments
    const { data: links, error: lErr } = await db
      .from("session_coaches")
      .select("session_id")
      .eq("coach_id", coach.id);
    if (lErr) throw lErr;
    const sessionIds = (links || []).map((r: any) => r.session_id);
    
    // Get sessions via program-level assignments
    const { data: pLinks, error: pErr } = await db
      .from("program_coaches")
      .select("program_id")
      .eq("coach_id", coach.id);
    if (pErr) throw pErr;
    const programIdsFromLinks = (pLinks || []).map((r: any) => r.program_id);

    // Fetch sessions + program names
    const { data: sessions, error: sErr } = await db
      .from("sessions")
      .select("id, program_id, date, location, type")
      .or([
        sessionIds.length ? `id.in.(${sessionIds.join(',')})` : "",
        programIdsFromLinks.length ? `program_id.in.(${programIdsFromLinks.join(',')})` : "",
      ].filter(Boolean).join(","));
    if (sErr) throw sErr;

    const programIds = Array.from(new Set((sessions || []).map((s: any) => s.program_id)));
    const { data: programs } = await db
      .from("programs")
      .select("id, name")
      .in("id", programIds.length ? programIds : ["00000000-0000-0000-0000-000000000000"]);

    const programById = new Map((programs || []).map((p: any) => [p.id, p.name]));
    const out = (sessions || []).map((s: any) => ({
      id: s.id,
      date: s.date,
      location: s.location,
      type: s.type,
      programName: programById.get(s.program_id) || undefined,
    }));

    return NextResponse.json({ sessions: out });
  } catch (e) {
    return NextResponse.json({ sessions: [] });
  }
}


