import { NextRequest, NextResponse } from "next/server";

interface Team {
  id: string;
  name: string;
  seedPosition?: number;
}

interface GenerateRequest {
  tournamentId: string;
  format: "bracket" | "round-robin" | "pool-play";
  teams: Team[];
  pools?: number;
}

interface Match {
  id: string;
  round: number;
  matchNumber: number;
  team1?: string;
  team2?: string;
  team1Id?: string;
  team2Id?: string;
  pool?: number;
  scheduledTime?: string;
  field?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();
    const { tournamentId, format, teams, pools } = body;

    // Validation
    if (!tournamentId) {
      return NextResponse.json(
        { error: "Tournament ID is required" },
        { status: 400 }
      );
    }

    if (!format || !["bracket", "round-robin", "pool-play"].includes(format)) {
      return NextResponse.json(
        { error: "Invalid tournament format" },
        { status: 400 }
      );
    }

    if (!teams || teams.length === 0) {
      return NextResponse.json(
        { error: "At least one team is required" },
        { status: 400 }
      );
    }

    let matches: Match[] = [];

    // Generate matches based on format
    switch (format) {
      case "bracket":
        matches = generateBracket(teams);
        break;
      case "round-robin":
        matches = generateRoundRobin(teams);
        break;
      case "pool-play":
        if (!pools || pools < 2) {
          return NextResponse.json(
            { error: "Pool play requires at least 2 pools" },
            { status: 400 }
          );
        }
        matches = generatePoolPlay(teams, pools);
        break;
    }

    // TODO: Save generated matches to database
    // await db.matches.createMany({
    //   data: matches.map(match => ({
    //     ...match,
    //     tournamentId,
    //     status: 'scheduled',
    //   })),
    // });

    return NextResponse.json({
      success: true,
      matches,
      totalMatches: matches.length,
      format,
    });
  } catch (error) {
    console.error("Error generating matches:", error);
    return NextResponse.json(
      { error: "Failed to generate matches" },
      { status: 500 }
    );
  }
}

// Generate single elimination bracket
function generateBracket(teams: Team[]): Match[] {
  const matches: Match[] = [];
  const sortedTeams = [...teams].sort(
    (a, b) => (a.seedPosition || 0) - (b.seedPosition || 0)
  );

  // Calculate number of rounds
  const totalTeams = sortedTeams.length;
  const rounds = Math.ceil(Math.log2(totalTeams));
  const firstRoundMatches = Math.pow(2, rounds - 1);

  let matchId = 1;

  // First round - pair teams by seeding (1 vs lowest, 2 vs 2nd lowest, etc.)
  for (let i = 0; i < firstRoundMatches; i++) {
    const team1Index = i;
    const team2Index = totalTeams - 1 - i;

    matches.push({
      id: `match-${matchId}`,
      round: 1,
      matchNumber: matchId,
      team1: sortedTeams[team1Index]?.name,
      team2:
        team2Index >= 0 && team2Index < totalTeams
          ? sortedTeams[team2Index]?.name
          : undefined,
      team1Id: sortedTeams[team1Index]?.id,
      team2Id:
        team2Index >= 0 && team2Index < totalTeams
          ? sortedTeams[team2Index]?.id
          : undefined,
    });
    matchId++;
  }

  // Subsequent rounds (TBD matches)
  for (let round = 2; round <= rounds; round++) {
    const matchesInRound = Math.pow(2, rounds - round);
    for (let i = 0; i < matchesInRound; i++) {
      matches.push({
        id: `match-${matchId}`,
        round,
        matchNumber: matchId,
        team1: undefined,
        team2: undefined,
      });
      matchId++;
    }
  }

  return matches;
}

// Generate round-robin tournament
function generateRoundRobin(teams: Team[]): Match[] {
  const matches: Match[] = [];
  let matchId = 1;

  // Every team plays every other team once
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      matches.push({
        id: `match-${matchId}`,
        round: 1,
        matchNumber: matchId,
        team1: teams[i].name,
        team2: teams[j].name,
        team1Id: teams[i].id,
        team2Id: teams[j].id,
      });
      matchId++;
    }
  }

  return matches;
}

// Generate pool play + bracket
function generatePoolPlay(teams: Team[], numberOfPools: number): Match[] {
  const matches: Match[] = [];
  const poolSize = Math.ceil(teams.length / numberOfPools);
  let matchId = 1;

  // Divide teams into pools (snake draft style for balance)
  const pools: Team[][] = Array.from({ length: numberOfPools }, () => []);

  teams.forEach((team, index) => {
    const poolIndex = Math.floor(index / poolSize) % numberOfPools;
    if (pools[poolIndex].length < poolSize) {
      pools[poolIndex].push(team);
    }
  });

  // Generate round-robin matches within each pool
  pools.forEach((pool, poolIndex) => {
    for (let i = 0; i < pool.length; i++) {
      for (let j = i + 1; j < pool.length; j++) {
        matches.push({
          id: `match-${matchId}`,
          round: poolIndex + 1,
          matchNumber: matchId,
          pool: poolIndex + 1,
          team1: pool[i].name,
          team2: pool[j].name,
          team1Id: pool[i].id,
          team2Id: pool[j].id,
        });
        matchId++;
      }
    }
  });

  // Add bracket matches (TBD - will be filled after pool play)
  const teamsAdvancing = numberOfPools * 2; // Top 2 from each pool
  const bracketRounds = Math.ceil(Math.log2(teamsAdvancing));
  const maxRound = Math.max(...matches.map((m) => m.round));

  for (let round = 1; round <= bracketRounds; round++) {
    const matchesInRound = Math.pow(2, bracketRounds - round);
    for (let i = 0; i < matchesInRound; i++) {
      matches.push({
        id: `match-${matchId}`,
        round: maxRound + round,
        matchNumber: matchId,
      });
      matchId++;
    }
  }

  return matches;
}
