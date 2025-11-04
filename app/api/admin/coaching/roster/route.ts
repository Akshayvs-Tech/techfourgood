import { NextResponse, NextRequest } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

// GET: Fetches the roster for a specific program
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const programId = searchParams.get("programId");

  if (!programId) {
    return NextResponse.json(
      { message: "Missing programId" },
      { status: 400 }
    );
  }

  const client = await pool.connect();
  try {
    // Join program_players with players to get player names
    const query = `
      SELECT p.id, p.full_name
      FROM players p
      JOIN program_players pp ON p.id = pp.player_id
      WHERE pp.program_id = $1
      ORDER BY p.full_name;
    `;
    const result = await client.query(query, [programId]);
    
    // Convert keys to camelCase
    const roster = result.rows.map(row => ({
      id: row.id.toString(),
      name: row.full_name,
    }));
    
    return NextResponse.json(roster);
  } catch (error) {
    console.error("Failed to fetch roster:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// POST: Adds or removes a player from a program's roster
export async function POST(request: Request) {
  const client = await pool.connect();
  try {
    const body = await request.json();
    const { programId, playerId, action } = body;

    if (!programId || !playerId || !action) {
      return NextResponse.json(
        { message: "Missing programId, playerId, or action" },
        { status: 400 }
      );
    }

    await client.query("BEGIN");

    if (action === "add") {
      const query = `
        INSERT INTO program_players (program_id, player_id)
        VALUES ($1, $2)
        ON CONFLICT (program_id, player_id) DO NOTHING;
      `;
      await client.query(query, [programId, playerId]);
      
    } else if (action === "remove") {
      const query = `
        DELETE FROM program_players
        WHERE program_id = $1 AND player_id = $2;
      `;
      await client.query(query, [programId, playerId]);
      
    } else {
      throw new Error("Invalid action. Must be 'add' or 'remove'.");
    }

    await client.query("COMMIT");
    
    return NextResponse.json({ message: `Player ${action}ed successfully` });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Failed to update roster:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}