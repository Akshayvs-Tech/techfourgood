import { NextResponse, NextRequest } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

// 1. GET handler (to fetch existing attendance for one session)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json(
      { message: "Missing sessionId" },
      { status: 400 }
    );
  }

  const client = await pool.connect();
  try {
    const query = `
      SELECT player_id, status 
      FROM attendance 
      WHERE session_id = $1;
    `;
    const result = await client.query(query, [sessionId]);

    // Convert keys to camelCase for the frontend
    const attendanceRecords = result.rows.map(row => ({
      playerId: row.player_id.toString(), // Ensure ID is string
      status: row.status,
    }));

    return NextResponse.json(attendanceRecords);
  } catch (error) {
    console.error("Failed to fetch attendance:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// 2. POST handler (to save/update attendance for a session)
export async function POST(request: Request) {
  const client = await pool.connect();
  try {
    const body = await request.json();
    const { sessionId, attendanceData } = body;

    if (!sessionId || !attendanceData || !Array.isArray(attendanceData)) {
      return NextResponse.json(
        { message: "Missing sessionId or invalid attendanceData" },
        { status: 400 }
      );
    }

    // Start a transaction
    await client.query("BEGIN");

    // Loop through each record and perform an "UPSERT"
    for (const record of attendanceData) {
      const { playerId, status } = record;
      
      const upsertQuery = `
        INSERT INTO attendance (session_id, player_id, status)
        VALUES ($1, $2, $3)
        ON CONFLICT (session_id, player_id) 
        DO UPDATE SET status = $3;
      `;
      
      await client.query(upsertQuery, [sessionId, playerId, status]);
    }

    // Commit the transaction
    await client.query("COMMIT");

    return NextResponse.json({ message: "Attendance saved successfully" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Failed to save attendance:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}