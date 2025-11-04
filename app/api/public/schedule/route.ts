import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabaseClient";

interface PublicMatch {
  id: string;
  matchNumber: number;
  round: number;
  pool?: number;
  team1: string;
  team2: string;
  scheduledDate: string;
  scheduledTime: string;
  field: string;
  duration: number;
  status: "scheduled" | "in-progress" | "completed" | "cancelled";
  score?: { team1Score?: number; team2Score?: number };
}

interface Tournament {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  venue: string;
  format: string;
  status: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get("tournamentId");
    const date = searchParams.get("date");
    const field = searchParams.get("field");
    const round = searchParams.get("round");
    const team = searchParams.get("team");

    const db = getServiceSupabase();

    // If tournamentId is provided, scope by tournament; else fetch all upcoming/in-progress matches
    let matchesQuery = db
      .from("matches")
      .select("id, tournament_id, match_number, round, pool, team1_id, team2_id, scheduled_date, scheduled_time, field, duration, status, score1, score2")
      .order("scheduled_date")
      .order("scheduled_time");
    if (tournamentId) {
      matchesQuery = matchesQuery.eq("tournament_id", tournamentId);
    }
    const { data: matchesData, error: mErr } = await matchesQuery;
    if (mErr) throw mErr;

    const teamIds = Array.from(
      new Set((matchesData || []).flatMap((m: any) => [m.team1_id, m.team2_id]).filter(Boolean))
    );
    const { data: teams } = teamIds.length
      ? await db.from("teams").select("id, name").in("id", teamIds)
      : ({ data: [] } as any);
    const teamById = new Map((teams || []).map((t: any) => [t.id, t.name]));

    const tournamentIds = Array.from(new Set((matchesData || []).map((m: any) => m.tournament_id)));
    const { data: tournaments } = tournamentIds.length
      ? await db.from("tournaments").select("id, name, start_date, end_date, venue, format, status").in("id", tournamentIds)
      : ({ data: [] } as any);
    const tById = new Map((tournaments || []).map((t: any) => [t.id, t]));

    let matches: PublicMatch[] = (matchesData || []).map((m: any) => ({
      id: m.id,
      matchNumber: m.match_number || 0,
      round: m.round || 0,
      pool: m.pool || undefined,
      team1: (teamById.get(m.team1_id) as string) || "TBD",
      team2: (teamById.get(m.team2_id) as string) || "TBD",
      scheduledDate: m.scheduled_date || "",
      scheduledTime: m.scheduled_time || "",
      field: m.field || "",
      duration: m.duration || 75,
      status: ((m.status as any) || "scheduled") as PublicMatch["status"],
      score: m.score1 != null || m.score2 != null ? { team1Score: m.score1 || 0, team2Score: m.score2 || 0 } : undefined,
    }));

    // Filters
    if (date) matches = matches.filter((m) => m.scheduledDate === date);
    if (field) matches = matches.filter((m) => m.field === field);
    if (round) matches = matches.filter((m) => m.round === parseInt(round));
    if (team) {
      const searchTerm = team.toLowerCase();
      matches = matches.filter(
        (m) => m.team1.toLowerCase().includes(searchTerm) || m.team2.toLowerCase().includes(searchTerm)
      );
    }

    const matchesByDate = matches.reduce((acc, match) => {
      if (!acc[match.scheduledDate]) acc[match.scheduledDate] = [];
      acc[match.scheduledDate].push(match);
      return acc;
    }, {} as Record<string, PublicMatch[]>);

    const uniqueDates = [...new Set(matches.map((m) => m.scheduledDate))].sort();
    const uniqueRounds = [...new Set(matches.map((m) => m.round))].sort();
    const uniqueFields = [...new Set(matches.map((m) => m.field))].sort();
    const uniqueTeams = [...new Set(matches.flatMap((m) => [m.team1, m.team2]))].sort();

    // If a specific tournament was requested, include it; otherwise omit
    const tObj = tournamentId ? (tById.get(tournamentId) as any) : null;
    const tournamentPayload = tournamentId && tObj ? {
      id: tObj.id as string,
      name: tObj.name as string,
      startDate: tObj.start_date as string,
      endDate: tObj.end_date as string,
      venue: tObj.venue as string,
      format: tObj.format as string,
      status: tObj.status as string,
    } as Tournament : null;

    return NextResponse.json({
      tournament: tournamentPayload,
      matches,
      matchesByDate,
      filters: { dates: uniqueDates, rounds: uniqueRounds, fields: uniqueFields, teams: uniqueTeams },
      totalMatches: matches.length,
    });
  } catch (error) {
    console.error("Error fetching schedule:", error);
    return NextResponse.json({ error: "Failed to fetch schedule" }, { status: 500 });
  }
}
