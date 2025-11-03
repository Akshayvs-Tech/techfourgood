import { NextResponse } from "next/server";

interface Match {
  teamA: string;
  teamB: string;
  scoreA: number;
  scoreB: number;
  status: string;
}

export async function GET() {
  try {
    // TODO: Fetch live match data from database
    // const matches = await db.matches.findMany({
    //   where: {
    //     status: { in: ['in-progress', 'completed'] },
    //   },
    //   orderBy: {
    //     scheduledTime: 'desc',
    //   },
    //   take: 10,
    // });

    // Mock live score data
    const mockMatches: Match[] = [
      {
        teamA: "Thunder Bolts",
        teamB: "Lightning Strike",
        scoreA: 15,
        scoreB: 12,
        status: "Final",
      },
      {
        teamA: "Storm Chasers",
        teamB: "Wind Runners",
        scoreA: 8,
        scoreB: 6,
        status: "Live - Half Time",
      },
      {
        teamA: "Sky Warriors",
        teamB: "Cloud Nine",
        scoreA: 5,
        scoreB: 5,
        status: "Live - 1st Quarter",
      },
      {
        teamA: "Hurricane Force",
        teamB: "Tornado Twist",
        scoreA: 0,
        scoreB: 0,
        status: "Scheduled - 3:00 PM",
      },
    ];

    return NextResponse.json(mockMatches);
  } catch (error) {
    console.error("Error fetching live scores:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch live scores",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
