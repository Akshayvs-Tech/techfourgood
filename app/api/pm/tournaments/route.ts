import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabaseClient";

// GET /api/pm/tournaments?userId=auth_user_id
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    if (!userId) return NextResponse.json({ upcoming: [], past: [] });
    const db = getServiceSupabase();
    const { data: pm } = await db
      .from("program_managers")
      .select("id")
      .eq("auth_user_id", userId)
      .maybeSingle();
    if (!pm) return NextResponse.json({ upcoming: [], past: [] });

    const { data: links } = await db
      .from("tournament_program_managers")
      .select("tournament_id")
      .eq("program_manager_id", pm.id);
    const tIds = (links || []).map((l: any) => l.tournament_id);
    if (tIds.length === 0) return NextResponse.json({ upcoming: [], past: [] });

    const nowIso = new Date().toISOString();
    const { data: tournaments } = await db
      .from("tournaments")
      .select("id,name,start_date,end_date,venue,status,fields")
      .in("id", tIds)
      .order("start_date");
    const upcoming = (tournaments || []).filter((t: any) => t.start_date >= nowIso);
    const past = (tournaments || []).filter((t: any) => t.start_date < nowIso).reverse();
    return NextResponse.json({ upcoming, past });
  } catch (e) {
    return NextResponse.json({ upcoming: [], past: [] });
  }
}


