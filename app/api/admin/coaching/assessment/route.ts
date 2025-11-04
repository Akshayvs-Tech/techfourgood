import { NextResponse, NextRequest } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

// 1. UPDATED: GET handler (to fetch one OR all assessments)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const playerId = searchParams.get("playerId");
  const sessionId = searchParams.get("sessionId");

  if (!playerId) {
    return NextResponse.json(
      { message: "Missing required query parameter: playerId" },
      { status: 400 }
    );
  }

  const client = await pool.connect();
  try {
    let query;
    let queryParams;

    if (sessionId) {
      // --- Logic 1: Get ONE assessment for a specific session ---
      query = `
        SELECT skill1_score, skill2_score, skill3_score, skill4_score, skill5_score, comments
        FROM skill_assessments
        WHERE session_id = $1 AND player_id = $2;
      `;
      queryParams = [sessionId, playerId];

      const result = await client.query(query, queryParams);
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

    } else {
      // --- Logic 2: Get ALL assessments for one player ---
      query = `
        SELECT 
          sa.session_id, 
          s.date AS session_date, 
          s.location AS session_location,
          sa.skill1_score, sa.skill2_score, sa.skill3_score,
          sa.skill4_score, sa.skill5_score, sa.comments
        FROM skill_assessments sa
        JOIN sessions s ON sa.session_id = s.id
        WHERE sa.player_id = $1
        ORDER BY s.date DESC; -- Tracked over time
      `;
      queryParams = [playerId];

      const result = await client.query(query, queryParams);
      
      const feedbackHistory = result.rows.map(row => ({
        sessionId: row.session_id.toString(),
        sessionDate: row.session_date,
        sessionLocation: row.session_location,
        skill1Score: row.skill1_score,
        skill2Score: row.skill2_score,
        skill3Score: row.skill3_score,
        skill4Score: row.skill4_score,
        skill5Score: row.skill5_score,
        comments: row.comments,
      }));
      
      return NextResponse.json(feedbackHistory);
    }
  } catch (error) {
    console.error("Failed to fetch assessment(s):", error);
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

    if (!sessionId || !playerId || !skill1Score) {
      return NextResponse.json(
        { message: "Missing required assessment data" },
        { status: 400 }
      );
    }

    await client.query("BEGIN");

    // "UPSERT" logic
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