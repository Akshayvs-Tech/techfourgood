import { NextResponse, NextRequest } from "next/server";
import { getServiceSupabase } from "@/lib/supabaseClient";

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

  try {
    const db = getServiceSupabase();

    // Program name
    const { data: program, error: pErr } = await db
      .from("programs")
      .select("name")
      .eq("id", programId)
      .maybeSingle();
    if (pErr) throw pErr;

    // Roster
    const { data: rosterLinks } = await db
      .from("program_players")
      .select("player_id")
      .eq("program_id", programId);
    const playerIds = (rosterLinks || []).map((r: any) => r.player_id);
    const { data: players } = playerIds.length
      ? await db.from("players").select("id, full_name").in("id", playerIds)
      : { data: [] as any[] } as any;

    // Sessions for program
    const { data: sessions, error: sErr } = await db
      .from("sessions")
      .select("id, date")
      .eq("program_id", programId)
      .order("date");
    if (sErr) throw sErr;
    const sessionIds = (sessions || []).map((s: any) => s.id);

    // Attendance present per player and per session
    const { data: attendance } = sessionIds.length
      ? await db
          .from("session_attendance")
          .select("session_id, player_id, status")
          .in("session_id", sessionIds)
      : { data: [] as any[] } as any;

    // Assessments
    const { data: assessments } = sessionIds.length
      ? await db
          .from("session_assessments")
          .select("player_id, metrics, score, session_id")
          .in("session_id", sessionIds)
      : { data: [] as any[] } as any;

    // Compute per-player stats
    const attendancePresentByPlayer = new Map<string, number>();
    (attendance || []).forEach((a: any) => {
      if (a.status === "Present") {
        attendancePresentByPlayer.set(
          a.player_id,
          (attendancePresentByPlayer.get(a.player_id) || 0) + 1
        );
      }
    });

    const averageScoreByPlayer = new Map<string, number>();
    const assessmentsCountByPlayer = new Map<string, number>();
    (assessments || []).forEach((as: any) => {
      const score = as.score ?? (() => {
        const m = as.metrics || {};
        const vals = [m.skill1, m.skill2, m.skill3, m.skill4, m.skill5].filter((v: any) => typeof v === "number");
        return vals.length ? vals.reduce((s: number, v: number) => s + v, 0) / vals.length : 0;
      })();
      const prevSum = (averageScoreByPlayer.get(as.player_id) || 0) * (assessmentsCountByPlayer.get(as.player_id) || 0);
      const prevCount = assessmentsCountByPlayer.get(as.player_id) || 0;
      const newCount = prevCount + 1;
      const newAvg = (prevSum + score) / newCount;
      averageScoreByPlayer.set(as.player_id, newAvg);
      assessmentsCountByPlayer.set(as.player_id, newCount);
    });

    // Player data array
    const playerData = (players || []).map((p: any) => ({
      id: p.id,
      name: p.full_name,
      attendanceCount: attendancePresentByPlayer.get(p.id) || 0,
      attendanceRate: 0, // computed below
      averageScore: averageScoreByPlayer.get(p.id) || 0,
      assessmentsCount: assessmentsCountByPlayer.get(p.id) || 0,
    }));

    const totalSessions = (sessions || []).length;
    const totalPlayers = playerData.length;
    const totalAttended = playerData.reduce((sum, p) => sum + p.attendanceCount, 0);
    const overallAttendanceRate = (totalPlayers > 0 && totalSessions > 0) ? (totalAttended / (totalPlayers * totalSessions)) : 0;

    // Fill per-player attendance rate now that totalSessions is known
    playerData.forEach((p: any) => {
      p.attendanceRate = totalSessions > 0 ? p.attendanceCount / totalSessions : 0;
    });

    const assessedPlayers = playerData.filter((p: any) => p.assessmentsCount > 0);
    const overallAverageScore = assessedPlayers.length > 0
      ? assessedPlayers.reduce((sum: number, p: any) => sum + p.averageScore, 0) / assessedPlayers.length
      : 0;

    // Session attendance summary time series
    const sessionAttendanceSummary = (sessions || []).map((s: any) => {
      const present = (attendance || []).filter((a: any) => a.session_id === s.id && a.status === "Present").length;
      const rate = totalPlayers > 0 ? (present / totalPlayers) * 100 : 0;
      return { date: new Date(s.date).toISOString().slice(0,10), attendance: parseFloat(rate.toFixed(1)) };
    });

    const playerPerformanceSummary = playerData
      .map((p: any) => ({ name: p.name, avgScore: p.averageScore }))
      .sort((a: any, b: any) => b.avgScore - a.avgScore);

    const dashboardData = {
      programName: program?.name || "",
      totalPlayers,
      totalSessions,
      overallAttendanceRate,
      overallAverageScore,
      sessionAttendanceSummary,
      playerPerformanceSummary,
      playerData,
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}