import { NextResponse } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

interface QueryResultRow {
  team_id: string;
  team_name: string;
  tournament_slug: string;
  status: "Pending Approval" | "Approved" | "Rejected";
  player_full_name: string;
  player_email: string | null;
}

export async function GET() {
  try {
    const sqlQuery = `
      SELECT 
        t.id AS team_id,
        t.name AS team_name,       -- Use 'name' from 'teams' table
        tr.slug AS tournament_slug, -- Get the slug from 'tournaments' table
        t.status,
        p.full_name AS player_full_name,
        p.email AS player_email
      FROM 
        teams t
      INNER JOIN 
        players p ON t.id = p.team_id
      INNER JOIN
        tournaments tr ON t.tournament_id = tr.id -- Join with tournaments
      WHERE 
        t.status = 'Pending Approval'
      ORDER BY 
        t.id, p.is_captain DESC, p.full_name;
    `;

    const { rows } = await pool.query<QueryResultRow>(sqlQuery);

    const teamsMap = new Map();

    for (const row of rows) {
      if (!teamsMap.has(row.team_id)) {
        teamsMap.set(row.team_id, {
          teamId: row.team_id,
          teamName: row.team_name,
          tournamentId: row.tournament_slug,
          status: row.status,
          rosterPlayers: [],
        });
      }

      teamsMap.get(row.team_id).rosterPlayers.push({
        fullName: row.player_full_name,
        email: row.player_email || "N/A",
      });
    }

    const pendingTeams = Array.from(teamsMap.values());

    return NextResponse.json(pendingTeams);

  } catch (error) {
    console.error("Failed to fetch pending teams:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}