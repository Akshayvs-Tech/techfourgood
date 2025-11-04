import { NextResponse, NextRequest } from "next/server";
import { Pool } from "pg";

// 1. Initialize the database connection pool
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

// 2. NEW: GET handler (to fetch program details)
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
    const result = await client.query(
      "SELECT id, name, start_date, is_active, roles, schedule_notes FROM programs WHERE id = $1",
      [programId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: "Program not found" },
        { status: 404 }
      );
    }

    // Convert keys to camelCase
    const program = {
      id: result.rows[0].id,
      name: result.rows[0].name,
      startDate: result.rows[0].start_date,
      isActive: result.rows[0].is_active,
      roles: result.rows[0].roles || [],
      scheduleNotes: result.rows[0].schedule_notes || "",
    };

    return NextResponse.json(program);
  } catch (error) {
    console.error("Failed to fetch program:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// 3. UPDATED: POST handler (to create OR update a program)
export async function POST(request: Request) {
  const client = await pool.connect();
  try {
    const body = await request.json();
    const { programId, name, startDate, isActive, roles, scheduleNotes } = body;

    await client.query("BEGIN");

    let savedProgram;

    if (programId) {
      // --- UPDATE Logic ---
      const updateQuery = `
        UPDATE programs
        SET 
          roles = $1,
          schedule_notes = $2
        WHERE id = $3
        RETURNING *; 
      `;
      const result = await client.query(updateQuery, [
        roles,
        scheduleNotes,
        programId,
      ]);
      savedProgram = result.rows[0];
    } else {
      // --- CREATE Logic ---
      if (!name || !startDate) {
        throw new Error("Missing required fields: name and startDate");
      }
      
      const createQuery = `
        INSERT INTO programs (name, start_date, is_active)
        VALUES ($1, $2, $3)
        RETURNING *;
      `;
      const result = await client.query(createQuery, [
        name,
        startDate,
        isActive ?? true,
      ]);
      savedProgram = result.rows[0];
    }

    await client.query("COMMIT");

    return NextResponse.json(savedProgram, { status: 200 });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Failed to save program:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}