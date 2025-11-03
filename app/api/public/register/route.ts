// Save this file at: app/api/public/register/route.ts

import { NextResponse } from "next/server";

// Mock implementation for development
// TODO: Replace with actual database implementation when ready
export async function POST(request: Request) {
  try {
    // Parse the incoming request body
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

    // Mock: Generate a unique team ID
    // TODO: Replace with actual database insertion
    const mockTeamId = `team-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    console.log("✅ Team Registration (Mock):", {
      teamId: mockTeamId,
      teamName,
      tournamentId,
      captain: {
        name: playerData.fullName,
        email: playerData.email,
        contact: playerData.contactNumber,
        gender: playerData.gender,
        dob: playerData.dateOfBirth,
      },
      rosterCount: teamRosterData.rosterPlayers?.length || 0,
      status: "Pending Approval",
    });

    // Send a success response
    return NextResponse.json(
      {
        message: "Registration successful",
        teamId: mockTeamId,
        teamName,
        status: "Pending Approval",
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
