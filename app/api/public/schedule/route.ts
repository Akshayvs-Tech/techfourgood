import { NextRequest, NextResponse } from "next/server";

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
  fieldLocation?: string;
  duration: number;
  status: "scheduled" | "in-progress" | "completed" | "cancelled";
  score?: {
    team1Score?: number;
    team2Score?: number;
  };
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

    if (!tournamentId) {
      return NextResponse.json(
        { error: "Tournament ID is required" },
        { status: 400 }
      );
    }

    // TODO: Fetch tournament from database
    // const tournament = await db.tournaments.findUnique({
    //   where: { id: tournamentId },
    // });

    // Mock tournament data
    const tournament: Tournament = {
      id: tournamentId,
      name: "Summer Ultimate Championship 2024",
      startDate: "2024-12-01",
      endDate: "2024-12-07",
      venue: "Central Sports Complex",
      format: "Pool Play + Bracket",
      status: "published",
    };

    if (tournament.status !== "published") {
      return NextResponse.json(
        { error: "Schedule not yet published" },
        { status: 404 }
      );
    }

    // TODO: Fetch matches from database with filters
    // const matches = await db.matches.findMany({
    //   where: {
    //     tournamentId,
    //     ...(date && { scheduledDate: new Date(date) }),
    //     ...(field && { fieldId: field }),
    //     ...(round && { round: parseInt(round) }),
    //     ...(team && {
    //       OR: [
    //         { team1: { contains: team, mode: 'insensitive' } },
    //         { team2: { contains: team, mode: 'insensitive' } },
    //       ],
    //     }),
    //   },
    //   include: {
    //     field: true,
    //   },
    //   orderBy: [
    //     { scheduledDate: 'asc' },
    //     { scheduledTime: 'asc' },
    //   ],
    // });

    // Mock matches data
    const mockMatches: PublicMatch[] = generateMockSchedule(tournamentId);

    // Apply filters
    let filteredMatches = mockMatches;

    if (date) {
      filteredMatches = filteredMatches.filter((m) => m.scheduledDate === date);
    }

    if (field) {
      filteredMatches = filteredMatches.filter((m) => m.field === field);
    }

    if (round) {
      filteredMatches = filteredMatches.filter(
        (m) => m.round === parseInt(round)
      );
    }

    if (team) {
      const searchTerm = team.toLowerCase();
      filteredMatches = filteredMatches.filter(
        (m) =>
          m.team1.toLowerCase().includes(searchTerm) ||
          m.team2.toLowerCase().includes(searchTerm)
      );
    }

    // Group matches by date
    const matchesByDate = filteredMatches.reduce((acc, match) => {
      if (!acc[match.scheduledDate]) {
        acc[match.scheduledDate] = [];
      }
      acc[match.scheduledDate].push(match);
      return acc;
    }, {} as Record<string, PublicMatch[]>);

    // Get unique dates, rounds, and fields for filters
    const uniqueDates = [
      ...new Set(mockMatches.map((m) => m.scheduledDate)),
    ].sort();
    const uniqueRounds = [...new Set(mockMatches.map((m) => m.round))].sort();
    const uniqueFields = [...new Set(mockMatches.map((m) => m.field))].sort();
    const uniqueTeams = [
      ...new Set(mockMatches.flatMap((m) => [m.team1, m.team2])),
    ].sort();

    return NextResponse.json({
      tournament,
      matches: filteredMatches,
      matchesByDate,
      filters: {
        dates: uniqueDates,
        rounds: uniqueRounds,
        fields: uniqueFields,
        teams: uniqueTeams,
      },
      totalMatches: filteredMatches.length,
    });
  } catch (error) {
    console.error("Error fetching schedule:", error);
    return NextResponse.json(
      { error: "Failed to fetch schedule" },
      { status: 500 }
    );
  }
}

// Generate mock schedule data
function generateMockSchedule(tournamentId: string): PublicMatch[] {
  const teams = [
    "Thunder Bolts",
    "Lightning Strike",
    "Storm Chasers",
    "Wind Runners",
    "Sky Warriors",
    "Cloud Nine",
    "Hurricane Force",
    "Tornado Twist",
  ];

  const fields = ["Field 1", "Field 2", "Field 3", "Field 4"];
  const dates = ["2024-12-01", "2024-12-02", "2024-12-03"];
  const times = ["9:00 AM", "10:30 AM", "12:00 PM", "1:30 PM", "3:00 PM"];
  const statuses: PublicMatch["status"][] = [
    "scheduled",
    "in-progress",
    "completed",
  ];

  const matches: PublicMatch[] = [];
  let matchId = 1;

  // Pool play matches
  for (let i = 0; i < 16; i++) {
    matches.push({
      id: `match-${matchId}`,
      matchNumber: matchId,
      round: Math.floor(i / 8) + 1,
      pool: (i % 2) + 1,
      team1: teams[i % teams.length],
      team2: teams[(i + 1) % teams.length],
      scheduledDate: dates[i % dates.length],
      scheduledTime: times[i % times.length],
      field: fields[i % fields.length],
      fieldLocation: i % 2 === 0 ? "Main Complex" : "South Side",
      duration: 75,
      status: i < 8 ? "completed" : i < 10 ? "in-progress" : "scheduled",
      ...(i < 8 && {
        score: {
          team1Score: Math.floor(Math.random() * 15) + 5,
          team2Score: Math.floor(Math.random() * 15) + 5,
        },
      }),
    });
    matchId++;
  }

  // Bracket matches
  for (let i = 0; i < 8; i++) {
    matches.push({
      id: `match-${matchId}`,
      matchNumber: matchId,
      round: 3 + Math.floor(i / 4),
      team1: i < 4 ? teams[i] : "TBD",
      team2: i < 4 ? teams[i + 4] : "TBD",
      scheduledDate: dates[2],
      scheduledTime: times[i % times.length],
      field: fields[i % fields.length],
      fieldLocation: i % 2 === 0 ? "Main Complex" : "South Side",
      duration: 90,
      status: "scheduled",
    });
    matchId++;
  }

  return matches;
}
