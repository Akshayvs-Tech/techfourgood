import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabaseClient";

interface Player {
  id: string;
  fullName: string;
  email: string;
  contactNumber: string;
  gender: string;
  dateOfBirth: string;
}

interface Team {
  id: string;
  teamName: string;
  captainName: string;
  captainEmail: string;
  captainPhone: string;
  tournamentId: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  players: Player[];
  rejectionReason?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get("tournamentId");
    const status = searchParams.get("status"); // optional filter

    if (!tournamentId) {
      return NextResponse.json(
        { error: "Tournament ID is required" },
        { status: 400 }
      );
    }

    const db = getServiceSupabase();

    // Fetch teams for the tournament
    let query = db
      .from("teams")
      .select("*")
      .eq("tournament_id", tournamentId);

    if (status) {
      query = query.eq("status", status);
    }

    const { data: teams, error: teamsError } = await query.order("created_at", {
      ascending: false,
    });

    if (teamsError) {
      throw teamsError;
    }

    if (!teams || teams.length === 0) {
      return NextResponse.json([]);
    }

    // For each team, fetch the roster and players
    const teamsWithPlayers: Team[] = await Promise.all(
      teams.map(async (team) => {
        // Get the roster submission time
        const { data: roster } = await db
          .from("team_rosters")
          .select("submitted_at, player_ids")
          .eq("team_id", team.id)
          .eq("tournament_id", tournamentId)
          .maybeSingle();

        // Get players from team_members (or use player_ids from roster if available)
        let playerIds: string[] = [];

        if (roster && roster.player_ids && roster.player_ids.length > 0) {
          playerIds = roster.player_ids;
        } else {
          // Fallback: get players from team_members
          const { data: teamMembers } = await db
            .from("team_members")
            .select("player_id")
            .eq("team_id", team.id)
            .eq("tournament_id", tournamentId);

          if (teamMembers) {
            playerIds = teamMembers.map((tm) => tm.player_id);
          }
        }

        // Fetch player details
        let players: Player[] = [];
        if (playerIds.length > 0) {
          const { data: playersData } = await db
            .from("players")
            .select("id, full_name, email, contact_number, gender, date_of_birth")
            .in("id", playerIds);

          if (playersData) {
            players = playersData.map((p) => ({
              id: p.id,
              fullName: p.full_name || "",
              email: p.email || "",
              contactNumber: p.contact_number || "",
              gender: p.gender || "",
              dateOfBirth: p.date_of_birth
                ? new Date(p.date_of_birth).toISOString().split("T")[0]
                : "",
            }));
          }
        }

        return {
          id: team.id,
          teamName: team.name,
          captainName: team.captain_name,
          captainEmail: team.captain_email,
          captainPhone: team.captain_phone || "",
          tournamentId: team.tournament_id,
          status: team.status as "pending" | "approved" | "rejected",
          submittedAt: roster?.submitted_at
            ? new Date(roster.submitted_at).toISOString()
            : team.created_at
            ? new Date(team.created_at).toISOString()
            : new Date().toISOString(),
          players,
          rejectionReason: team.rejection_reason || undefined,
        };
      })
    );

    return NextResponse.json(teamsWithPlayers);
  } catch (error) {
    console.error("Error fetching teams:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch teams",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
