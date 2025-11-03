import { NextRequest, NextResponse } from "next/server";

interface Player {
  id: string;
  fullName: string;
  email: string;
  contactNumber: string;
  gender: string;
  dateOfBirth: string;
}

interface Team {
  id: string;
  teamName: string;
  captainName: string;
  captainEmail: string;
  captainPhone: string;
  tournamentId: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  players: Player[];
  rejectionReason?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get("tournamentId");
    const status = searchParams.get("status"); // optional filter

    if (!tournamentId) {
      return NextResponse.json(
        { error: "Tournament ID is required" },
        { status: 400 }
      );
    }

    console.log(`Fetching teams for tournament: ${tournamentId}`);

    // TODO: Fetch teams from database
    // const teams = await db.teams.findMany({
    //   where: {
    //     tournamentId,
    //     ...(status && { status }),
    //   },
    //   include: {
    //     players: true,
    //   },
    //   orderBy: {
    //     submittedAt: 'desc',
    //   },
    // });

    // Mock data
    await new Promise((resolve) => setTimeout(resolve, 500));

    const mockTeams: Team[] = [
      {
        id: "team-1",
        teamName: "Thunder Bolts",
        captainName: "John Smith",
        captainEmail: "john@thunderbolts.com",
        captainPhone: "+1234567890",
        tournamentId,
        status: "pending",
        submittedAt: "2024-11-01T10:30:00Z",
        players: [
          {
            id: "p1",
            fullName: "John Smith",
            email: "john@example.com",
            contactNumber: "+1234567890",
            gender: "Male",
            dateOfBirth: "1995-05-15",
          },
          {
            id: "p2",
            fullName: "Jane Doe",
            email: "jane@example.com",
            contactNumber: "+1234567891",
            gender: "Female",
            dateOfBirth: "1996-08-20",
          },
          {
            id: "p3",
            fullName: "Mike Johnson",
            email: "mike@example.com",
            contactNumber: "+1234567892",
            gender: "Male",
            dateOfBirth: "1994-03-10",
          },
          {
            id: "p4",
            fullName: "Sarah Williams",
            email: "sarah@example.com",
            contactNumber: "+1234567893",
            gender: "Female",
            dateOfBirth: "1997-11-25",
          },
          {
            id: "p5",
            fullName: "Tom Brown",
            email: "tom@example.com",
            contactNumber: "+1234567894",
            gender: "Male",
            dateOfBirth: "1995-07-08",
          },
          {
            id: "p6",
            fullName: "Emily Davis",
            email: "emily@example.com",
            contactNumber: "+1234567895",
            gender: "Female",
            dateOfBirth: "1996-12-30",
          },
          {
            id: "p7",
            fullName: "Chris Wilson",
            email: "chris@example.com",
            contactNumber: "+1234567896",
            gender: "Male",
            dateOfBirth: "1993-09-18",
          },
        ],
      },
      {
        id: "team-2",
        teamName: "Lightning Strike",
        captainName: "Alice Johnson",
        captainEmail: "alice@lightning.com",
        captainPhone: "+1234567897",
        tournamentId,
        status: "approved",
        submittedAt: "2024-10-28T14:20:00Z",
        players: Array.from({ length: 8 }, (_, i) => ({
          id: `p${i + 10}`,
          fullName: `Player ${i + 1}`,
          email: `player${i + 1}@lightning.com`,
          contactNumber: `+123456789${i}`,
          gender: i % 2 === 0 ? "Male" : "Female",
          dateOfBirth: "1995-01-01",
        })),
      },
      {
        id: "team-3",
        teamName: "Storm Chasers",
        captainName: "Bob Williams",
        captainEmail: "bob@stormchasers.com",
        captainPhone: "+1234567898",
        tournamentId,
        status: "pending",
        submittedAt: "2024-11-02T09:15:00Z",
        players: Array.from({ length: 10 }, (_, i) => ({
          id: `p${i + 20}`,
          fullName: `Player ${i + 1}`,
          email: `player${i + 1}@storm.com`,
          contactNumber: `+123456789${i}`,
          gender: i % 2 === 0 ? "Male" : "Female",
          dateOfBirth: "1996-06-15",
        })),
      },
      {
        id: "team-4",
        teamName: "Wind Runners",
        captainName: "Carol Martinez",
        captainEmail: "carol@windrunners.com",
        captainPhone: "+1234567899",
        tournamentId,
        status: "rejected",
        submittedAt: "2024-10-30T16:45:00Z",
        rejectionReason:
          "Incomplete roster - only 5 players submitted (minimum 7 required)",
        players: Array.from({ length: 5 }, (_, i) => ({
          id: `p${i + 30}`,
          fullName: `Player ${i + 1}`,
          email: `player${i + 1}@wind.com`,
          contactNumber: `+123456789${i}`,
          gender: i % 2 === 0 ? "Male" : "Female",
          dateOfBirth: "1994-04-20",
        })),
      },
      {
        id: "team-5",
        teamName: "Sky Warriors",
        captainName: "David Chen",
        captainEmail: "david@skywarriors.com",
        captainPhone: "+1234567900",
        tournamentId,
        status: "pending",
        submittedAt: "2024-11-03T11:00:00Z",
        players: Array.from({ length: 9 }, (_, i) => ({
          id: `p${i + 40}`,
          fullName: `Player ${i + 1}`,
          email: `player${i + 1}@sky.com`,
          contactNumber: `+123456790${i}`,
          gender: i % 2 === 0 ? "Male" : "Female",
          dateOfBirth: "1995-08-10",
        })),
      },
    ];

    // Apply status filter if provided
    const filteredTeams = status
      ? mockTeams.filter((team) => team.status === status)
      : mockTeams;

    return NextResponse.json(filteredTeams);
  } catch (error) {
    console.error("Error fetching teams:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch teams",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
