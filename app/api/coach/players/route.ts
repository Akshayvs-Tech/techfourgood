import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabaseClient";

// GET /api/coach/players?search=...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") || "").trim();
    const db = getServiceSupabase();
    let query = db.from("players").select("id, full_name, email, contact_number").order("full_name");
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }
    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ players: data || [] });
  } catch (e) {
    return NextResponse.json({ players: [] });
  }
}


