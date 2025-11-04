import { NextResponse, NextRequest } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

// GET: Searches for players by name
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("search");

  if (!query || query.length < 2) {
    return NextResponse.json([]);
  }

  const client = await pool.connect();
  try {
    const sqlQuery = `
      SELECT id, full_name
      FROM players
      WHERE full_name ILIKE $1
      LIMIT 10;
    `;
    const result = await client.query(sqlQuery, [`%${query}%`]);

    const players = result.rows.map(row => ({
      id: row.id.toString(),
      name: row.full_name,
    }));

    return NextResponse.json(players);
  } catch (error) {
    console.error("Failed to search players:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}