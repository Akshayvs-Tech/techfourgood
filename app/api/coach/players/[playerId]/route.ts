import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabaseClient";

export async function GET(req: NextRequest, ctx: { params: { playerId: string } } | any) {
  try {
    const awaitedParams = ctx?.params && typeof ctx.params.then === "function" ? await ctx.params : ctx.params;
    const playerId = awaitedParams?.playerId;
    const db = getServiceSupabase();

    const { data: player } = await db
      .from("players")
      .select("id, full_name, email, contact_number, gender, date_of_birth")
      .eq("id", playerId)
      .maybeSingle();

    const { data: memberships } = await db
      .from("team_members")
      .select("team_id, tournament_id")
      .eq("player_id", playerId);
    const teamIds = Array.from(new Set((memberships || []).map((m: any) => m.team_id).filter(Boolean)));
    const tournamentIds = Array.from(new Set((memberships || []).map((m: any) => m.tournament_id).filter(Boolean)));
    const { data: teams } = teamIds.length ? await db.from("teams").select("id, name, tournament_id").in("id", teamIds) : ({ data: [] } as any);
    const { data: tournaments } = tournamentIds.length ? await db.from("tournaments").select("id, name, start_date, end_date").in("id", tournamentIds) : ({ data: [] } as any);

    const { data: extra } = await db
      .from("player_extra")
      .select("address, other_info, updated_at")
      .eq("player_id", playerId)
      .maybeSingle();

    return NextResponse.json({ player, teams: teams || [], tournaments: tournaments || [], extra: extra || null });
  } catch (e) {
    return NextResponse.json({});
  }
}


