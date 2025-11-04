import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabaseClient";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tournamentId, playerData, teamRosterData } = body;

    // Validate essential data
    if (!tournamentId || !playerData || !teamRosterData) {
      return NextResponse.json(
        { message: "Missing required registration data." },
        { status: 400 }
      );
    }

    // Validate player data
    if (!playerData.fullName || !playerData.email) {
      return NextResponse.json(
        { message: "Player name and email are required." },
        { status: 400 }
      );
    }

    // Validate team data
    const teamName = teamRosterData.teamName || teamRosterData.joinExistingTeam;
    if (!teamName) {
      return NextResponse.json(
        { message: "Team name is required." },
        { status: 400 }
      );
    }

    const db = getServiceSupabase();

    // Verify tournament exists
    const { data: tournament, error: tournamentError } = await db
      .from("tournaments")
      .select("id")
      .eq("id", tournamentId)
      .single();

    if (tournamentError || !tournament) {
      return NextResponse.json(
        { message: "Tournament not found." },
        { status: 404 }
      );
    }

    // Get the player's auth user ID
    const { data: player } = await db
      .from("players")
      .select("id, auth_user_id")
      .eq("email", playerData.email)
      .maybeSingle();

    if (!player) {
      return NextResponse.json(
        { message: "Player not found. Please complete player registration first." },
        { status: 400 }
      );
    }

    // Create or get the team
    let teamId: string;
    const { data: existingTeam } = await db
      .from("teams")
      .select("id")
      .eq("name", teamName)
      .eq("tournament_id", tournamentId)
      .maybeSingle();

    if (existingTeam) {
      teamId = existingTeam.id;
    } else {
      // Create new team
      const { data: newTeam, error: teamError } = await db
        .from("teams")
        .insert({
          name: teamName,
          tournament_id: tournamentId,
          captain_email: playerData.email,
          captain_name: playerData.fullName,
          captain_phone: playerData.contactNumber || null,
          status: "pending",
        })
        .select("id")
        .single();

      if (teamError || !newTeam) {
        throw new Error(teamError?.message || "Failed to create team");
      }
      teamId = newTeam.id;
    }

    // Add captain to team_members if not already added
    const { data: existingMember } = await db
      .from("team_members")
      .select("id")
      .eq("team_id", teamId)
      .eq("player_id", player.id)
      .eq("tournament_id", tournamentId)
      .maybeSingle();

    if (!existingMember) {
      await db.from("team_members").insert({
        team_id: teamId,
        player_id: player.id,
        tournament_id: tournamentId,
      });
    }

    // Update player to be captain if they created the team
    if (!existingTeam) {
      await db
        .from("players")
        .update({ is_captain: true })
        .eq("id", player.id);
    }

    // Handle roster players - create player records and add to team_members
    // Note: rosterPlayers[0] is the captain, so we skip it
    const otherPlayers = teamRosterData.rosterPlayers?.slice(1) || [];
    
    for (const rosterPlayerData of otherPlayers) {
      if (rosterPlayerData && rosterPlayerData.fullName && rosterPlayerData.email) {
        // Check if player already exists by email
        const { data: existingPlayer } = await db
          .from("players")
          .select("id")
          .eq("email", rosterPlayerData.email)
          .maybeSingle();

        let rosterPlayerId: string;

        if (existingPlayer) {
          // Update existing player with new details
          const { data: updatedPlayer, error: updateError } = await db
            .from("players")
            .update({
              full_name: rosterPlayerData.fullName,
              contact_number: rosterPlayerData.contactNumber || null,
              gender: rosterPlayerData.gender || null,
              date_of_birth: rosterPlayerData.dateOfBirth || null,
              tournament_id: tournamentId,
              status: "Pending",
              is_captain: false,
            })
            .eq("id", existingPlayer.id)
            .select("id")
            .single();

          if (updateError || !updatedPlayer) {
            console.warn("Failed to update existing player:", updateError);
            continue;
          }
          rosterPlayerId = updatedPlayer.id;
        } else {
          // Create new player record with all details
          const { data: newRosterPlayer, error: createError } = await db
            .from("players")
            .insert({
              full_name: rosterPlayerData.fullName,
              email: rosterPlayerData.email,
              contact_number: rosterPlayerData.contactNumber || null,
              gender: rosterPlayerData.gender || null,
              date_of_birth: rosterPlayerData.dateOfBirth || null,
              tournament_id: tournamentId,
              status: "Pending",
              is_captain: false,
            })
            .select("id")
            .single();

          if (createError || !newRosterPlayer) {
            console.warn("Failed to create roster player:", createError);
            continue;
          }
          rosterPlayerId = newRosterPlayer.id;
        }

        // Add to team_members if not already added
        const { data: existingRosterMember } = await db
          .from("team_members")
          .select("id")
          .eq("team_id", teamId)
          .eq("player_id", rosterPlayerId)
          .eq("tournament_id", tournamentId)
          .maybeSingle();

        if (!existingRosterMember) {
          await db.from("team_members").insert({
            team_id: teamId,
            player_id: rosterPlayerId,
            tournament_id: tournamentId,
          });
        }
      }
    }

    // Send a success response
    return NextResponse.json(
      {
        message: "Registration successful",
        teamId: teamId,
        teamName,
        status: "pending",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration API Error:", error);
    return NextResponse.json(
      { message: "Registration failed: " + (error as Error).message },
      { status: 500 }
    );
  }
}

// Database implementation (commented out for now)
/*
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

export async function POST(request: Request) {
  const client = await pool.connect();

  try {
    const body = await request.json();
    const { tournamentId, playerData, teamRosterData } = body;

    if (!tournamentId || !playerData || !teamRosterData) {
      throw new Error("Missing required registration data.");
    }

    await client.query("BEGIN");

    // Verify tournament exists
    const tournamentRes = await client.query(
      "SELECT id FROM tournaments WHERE id = $1",
      [tournamentId]
    );

    if (tournamentRes.rows.length === 0) {
      throw new Error(`Tournament with ID '${tournamentId}' not found.`);
    }

    // Create the new team
    const teamName = teamRosterData.teamName || teamRosterData.joinExistingTeam;
    
    const teamRes = await client.query(
      `INSERT INTO teams (name, tournament_id, status) 
       VALUES ($1, $2, 'Pending Approval') 
       RETURNING id`,
      [teamName, tournamentId]
    );
    const newTeamId = teamRes.rows[0].id;

    // Create the captain (Player from Step 1)
    await client.query(
      `INSERT INTO players 
         (team_id, full_name, email, contact_number, gender, date_of_birth, is_captain) 
       VALUES ($1, $2, $3, $4, $5, $6, true)`,
      [
        newTeamId,
        playerData.fullName,
        playerData.email,
        playerData.contactNumber,
        playerData.gender,
        playerData.dateOfBirth,
      ]
    );

    // Create the other players (from the roster list)
    const otherPlayers = teamRosterData.rosterPlayers.slice(1);

    for (const playerName of otherPlayers) {
      if (playerName.trim() !== "") {
        await client.query(
          `INSERT INTO players (team_id, full_name, is_captain) 
           VALUES ($1, $2, false)`,
          [newTeamId, playerName.trim()]
        );
      }
    }

    await client.query("COMMIT");

    return NextResponse.json(
      { message: "Registration successful", teamId: newTeamId },
      { status: 201 }
    );

  } catch (error) {
    await client.query("ROLLBACK");
    
    console.error("Registration API Error:", error);
    return NextResponse.json(
      { message: "Registration failed: " + (error as Error).message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
*/
