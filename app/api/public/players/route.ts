import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabaseClient";

export async function GET(req: NextRequest) {
  const tournamentId = req.nextUrl.searchParams.get("tournamentId");
  const status = req.nextUrl.searchParams.get("status") || "Approved";
  if (!tournamentId) {
    return NextResponse.json({ message: "tournamentId required" }, { status: 400 });
  }
  try {
    const db = getServiceSupabase();
    const { data, error } = await db
      .from("players")
      .select("id, full_name, email, contact_number, gender, date_of_birth")
      .eq("tournament_id", tournamentId)
      .eq("status", status);
    if (error) throw error;
    const players = (data || []).map((p) => ({
      id: p.id,
      name: p.full_name,
      email: p.email,
      contactNumber: p.contact_number,
      gender: p.gender,
      dateOfBirth: p.date_of_birth,
      profileData: { name: p.full_name, email: p.email },
    }));
    return NextResponse.json({ players });
  } catch (e: any) {
    return NextResponse.json({ players: [] });
  }
}



