import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabaseClient";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { teamId, tournamentId } = body;

    if (!teamId || !tournamentId) {
      return NextResponse.json(
        { message: "Team ID and Tournament ID are required" },
        { status: 400 }
      );
    }

    const db = getServiceSupabase();

    // Get all team members for this team and tournament
    const { data: teamMembers, error: tmError } = await db
      .from("team_members")
      .select("player_id")
      .eq("team_id", teamId)
      .eq("tournament_id", tournamentId);

    if (tmError) {
      throw tmError;
    }

    if (!teamMembers || teamMembers.length === 0) {
      return NextResponse.json(
        { message: "No team members found" },
        { status: 400 }
      );
    }

    const playerIds = teamMembers.map((tm) => tm.player_id);

    // Create or update roster submission using service role (bypasses RLS)
    const { data: roster, error: rosterError } = await db
      .from("team_rosters")
      .upsert(
        {
          team_id: teamId,
          tournament_id: tournamentId,
          player_ids: playerIds,
          status: "Submitted",
          submitted_at: new Date().toISOString(),
        },
        { onConflict: "team_id,tournament_id" }
      )
      .select()
      .single();

    if (rosterError) {
      throw rosterError;
    }

    return NextResponse.json(
      {
        message: "Roster submitted successfully",
        roster,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error submitting roster:", error);
    return NextResponse.json(
      {
        message: "Failed to submit roster",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

