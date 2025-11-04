import { NextResponse, NextRequest } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

// 1. GET handler (to fetch a specific assessment)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");
  const playerId = searchParams.get("playerId");

  if (!sessionId || !playerId) {
    return NextResponse.json(
      { message: "Missing sessionId or playerId" },
      { status: 400 }
    );
  }

  const client = await pool.connect();
  try {
    const query = `
      SELECT skill1_score, skill2_score, skill3_score, skill4_score, skill5_score, comments
      FROM skill_assessments
      WHERE session_id = $1 AND player_id = $2;
    `;
    const result = await client.query(query, [sessionId, playerId]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: "Assessment not found" },
        { status: 404 }
      );
    }

    const dbRow = result.rows[0];
    const assessment = {
      skill1Score: dbRow.skill1_score,
      skill2Score: dbRow.skill2_score,
      skill3Score: dbRow.skill3_score,
      skill4Score: dbRow.skill4_score,
      skill5Score: dbRow.skill5_score,
      comments: dbRow.comments,
    };

    return NextResponse.json(assessment);
  } catch (error) {
    console.error("Failed to fetch assessment:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// 2. POST handler (to save or update an assessment)
export async function POST(request: Request) {
  const client = await pool.connect();
  try {
    const body = await request.json();
    const {
      sessionId,
      playerId,
      skill1Score,
      skill2Score,
      skill3Score,
      skill4Score,
      skill5Score,
      comments,
    } = body;

    // Basic validation
    if (!sessionId || !playerId || !skill1Score) {
      return NextResponse.json(
        { message: "Missing required assessment data" },
        { status: 400 }
      );
    }

    await client.query("BEGIN");

    // Use "UPSERT" logic (ON CONFLICT... DO UPDATE)
    const upsertQuery = `
      INSERT INTO skill_assessments (
        session_id, player_id, 
        skill1_score, skill2_score, skill3_score, 
        skill4_score, skill5_score, comments
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (session_id, player_id) 
      DO UPDATE SET
        skill1_score = $3,
        skill2_score = $4,
        skill3_score = $5,
        skill4_score = $6,
        skill5_score = $7,
        comments = $8;
    `;

    await client.query(upsertQuery, [
      sessionId,
      playerId,
      skill1Score,
      skill2Score,
      skill3Score,
      skill4Score,
      skill5Score,
      comments,
    ]);

    await client.query("COMMIT");

    return NextResponse.json({ message: "Assessment saved successfully" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Failed to save assessment:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}