import { NextResponse, NextRequest } from "next/server";
import { Pool } from "pg";

// 1. Initialize the database connection pool
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

// 2. GET handler (to fetch all sessions for a program)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const programId = searchParams.get("programId");

  if (!programId) {
    return NextResponse.json(
      { message: "Missing programId query parameter" },
      { status: 400 }
    );
  }

  const client = await pool.connect();
  try {
    const query = `
      SELECT id, program_id, date, location, type 
      FROM sessions 
      WHERE program_id = $1 
      ORDER BY date DESC
    `;
    const result = await client.query(query, [programId]);

    // Convert keys to camelCase for the frontend
    const sessions = result.rows.map(row => ({
      id: row.id,
      programId: row.program_id,
      date: row.date,
      location: row.location,
      type: row.type,
    }));

    return NextResponse.json(sessions);
  } catch (error) {
    console.error("Failed to fetch sessions:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// 3. POST handler (to create a new session)
export async function POST(request: Request) {
  const client = await pool.connect();
  try {
    const body = await request.json();
    const { programId, date, location, type } = body;

    if (!programId || !date || !location) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    await client.query("BEGIN");

    const query = `
      INSERT INTO sessions (program_id, date, location, type)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const result = await client.query(query, [programId, date, location, type]);
    const newSession = result.rows[0];

    await client.query("COMMIT");

    return NextResponse.json(newSession, { status: 201 });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Failed to create session:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// 4. DELETE handler (to remove a session)
export async function DELETE(request: Request) {
  const client = await pool.connect();
  try {
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { message: "Missing sessionId" },
        { status: 400 }
      );
    }

    await client.query("BEGIN");

    const result = await client.query(
      "DELETE FROM sessions WHERE id = $1 RETURNING *",
      [sessionId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { message: "Session not found" },
        { status: 404 }
      );
    }

    await client.query("COMMIT");

    return NextResponse.json({ message: "Session deleted successfully" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Failed to delete session:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}