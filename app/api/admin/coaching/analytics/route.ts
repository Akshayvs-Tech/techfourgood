import { NextResponse, NextRequest } from "next/server";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

// 1. GET handler (to fetch all dashboard data)
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
    // 2. This is one large, efficient SQL query to get all data at once.
    // It uses Common Table Expressions (CTEs) to build the data step-by-step.
    const query = `
      WITH program_roster AS (
        -- CTE 1: Get all players in this program
        SELECT 
          p.id, 
          p.full_name AS name
        FROM players p
        JOIN program_players pp ON p.id = pp.player_id
        WHERE pp.program_id = $1
      ),
      
      program_sessions AS (
        -- CTE 2: Get all sessions for this program
        SELECT id, date FROM sessions WHERE program_id = $1
      ),
      
      player_attendance AS (
        -- CTE 3: Calculate attendance stats for each player
        SELECT 
          player_id, 
          COUNT(*) AS attendance_count
        FROM attendance
        WHERE session_id IN (SELECT id FROM program_sessions)
          AND status = 'Present'
        GROUP BY player_id
      ),
      
      player_assessments AS (
        -- CTE 4: Calculate assessment stats for each player
        SELECT
          player_id,
          COUNT(*) AS assessments_count,
          -- Calculate the average of all 5 scores, then average that per player
          AVG((skill1_score + skill2_score + skill3_score + skill4_score + skill5_score) / 5.0) AS average_score
        FROM skill_assessments
        WHERE session_id IN (SELECT id FROM program_sessions)
        GROUP BY player_id
      ),

      session_attendance_summary AS (
        -- CTE 5: Calculate attendance rate for each session (for the chart)
        SELECT
          s.id,
          s.date,
          (COUNT(a.player_id)::float / GREATEST(1, (SELECT COUNT(*) FROM program_roster)) * 100) AS attendance_rate
        FROM program_sessions s
        LEFT JOIN attendance a ON s.id = a.session_id AND a.status = 'Present'
        GROUP BY s.id, s.date
        ORDER BY s.date
      )

      -- Final SELECT: Combine all the data
      SELECT
        -- Get Program Name
        (SELECT name FROM programs WHERE id = $1) AS program_name,
        
        -- Get all player data by joining roster with stats
        (
          SELECT json_agg(json_build_object(
            'id', r.id,
            'name', r.name,
            'attendanceCount', COALESCE(pa.attendance_count, 0)::int,
            'attendanceRate', COALESCE(pa.attendance_count, 0)::float / GREATEST(1, (SELECT COUNT(*) FROM program_sessions)),
            'averageScore', COALESCE(p_assess.average_score, 0)::float,
            'assessmentsCount', COALESCE(p_assess.assessments_count, 0)::int
          ))
          FROM program_roster r
          LEFT JOIN player_attendance pa ON r.id = pa.player_id
          LEFT JOIN player_assessments p_assess ON r.id = p_assess.player_id
        ) AS player_data,
        
        -- Get session attendance chart data
        (
          SELECT json_agg(json_build_object(
            'date', to_char(sas.date, 'YYYY-MM-DD'),
            'attendance', sas.attendance_rate
          ))
          FROM session_attendance_summary sas
        ) AS session_attendance_summary;
    `;
    
    const result = await client.query(query, [programId]);
    const raw = result.rows[0];

    // 3. Process the raw SQL data into the final JSON object
    
    // Ensure player_data is an array
    const playerData: any[] = raw.player_data || [];
    const totalSessions = (await client.query("SELECT COUNT(*) FROM sessions WHERE program_id = $1", [programId])).rows[0].count;

    // Calculate overall summaries
    const totalPlayers = playerData.length;
    const totalAttended = playerData.reduce((sum, p) => sum + p.attendanceCount, 0);
    const overallAttendanceRate = (totalPlayers > 0 && totalSessions > 0) ? (totalAttended / (totalPlayers * totalSessions)) : 0;
    
    const assessedPlayers = playerData.filter(p => p.assessmentsCount > 0);
    const overallAverageScore = assessedPlayers.length > 0
      ? assessedPlayers.reduce((sum, p) => sum + p.averageScore, 0) / assessedPlayers.length
      : 0;

    // Format data for charts
    const playerPerformanceSummary = playerData.map(p => ({
      name: p.name,
      avgScore: p.averageScore,
    })).sort((a, b) => b.avgScore - a.avgScore);
    
    const sessionAttendanceSummary = (raw.session_attendance_summary || []).map((s: any) => ({
      ...s,
      attendance: parseFloat(s.attendance.toFixed(1))
    }));

    // 4. Build the final response object
    const dashboardData = {
      programName: raw.program_name,
      totalPlayers: totalPlayers,
      totalSessions: parseInt(totalSessions, 10),
      overallAttendanceRate: overallAttendanceRate,
      overallAverageScore: overallAverageScore,
      sessionAttendanceSummary: sessionAttendanceSummary,
      playerPerformanceSummary: playerPerformanceSummary,
      playerData: playerData,
    };
    
    return NextResponse.json(dashboardData);
    
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}