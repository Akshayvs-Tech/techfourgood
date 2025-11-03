// Save this file at: app/api/public/register/route.ts

import { NextResponse } from "next/server";
import { Pool } from "pg";

// 1. Initialize the database connection pool
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

// 2. Define the handler for POST requests
export async function POST(request: Request) {
  // Get a single connection client from the pool
  const client = await pool.connect();

  try {
    // 3. Parse the incoming request body
    const body = await request.json();
    const { tournamentSlug, playerData, teamRosterData } = body;

    // 4. Validate essential data
    if (!tournamentSlug || !playerData || !teamRosterData) {
      throw new Error("Missing required registration data.");
    }

    // 5. Start a database transaction
    // This groups all our queries into a single "all or nothing" operation
    await client.query("BEGIN");

    // 6. Find the tournament's primary key (id) from its public slug
    const tournamentRes = await client.query(
      "SELECT id FROM tournaments WHERE slug = $1",
      [tournamentSlug]
    );

    if (tournamentRes.rows.length === 0) {
      throw new Error(`Tournament with ID '${tournamentSlug}' not found.`);
    }
    const tournamentId = tournamentRes.rows[0].id;

    // 7. Create the new team
    const teamName = teamRosterData.teamName || teamRosterData.joinExistingTeam;
    
    const teamRes = await client.query(
      `INSERT INTO teams (name, tournament_id, status) 
       VALUES ($1, $2, 'Pending Approval') 
       RETURNING id`,
      [teamName, tournamentId]
    );
    const newTeamId = teamRes.rows[0].id;

    // 8. Create the captain (Player from Step 1)
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

    // 9. Create the other players (from the roster list)
    // We skip index 0, because that is the captain (playerData.fullName)
    const otherPlayers = teamRosterData.rosterPlayers.slice(1);

    // Loop and insert each remaining player
    for (const playerName of otherPlayers) {
      if (playerName.trim() !== "") { // Ensure no empty names are added
        await client.query(
          `INSERT INTO players (team_id, full_name, is_captain) 
           VALUES ($1, $2, false)`,
          [newTeamId, playerName.trim()]
        );
      }
    }

    // 10. If all queries succeeded, commit the transaction
    await client.query("COMMIT");

    // 11. Send a success response
    return NextResponse.json(
      { message: "Registration successful", teamId: newTeamId },
      { status: 201 } // 201 means "Created"
    );

  } catch (error) {
    // 12. If any query failed, roll back the entire transaction
    await client.query("ROLLBACK");
    
    console.error("Registration API Error:", error);
    return NextResponse.json(
      { message: "Registration failed: " + (error as Error).message },
      { status: 500 } // 500 means "Internal Server Error"
    );
  } finally {
    // 13. ALWAYS release the client back to the pool
    client.release();
  }
}