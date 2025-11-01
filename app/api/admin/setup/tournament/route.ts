import { NextRequest, NextResponse } from "next/server";
import { ITournament } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const tournamentData: ITournament = await request.json();

    
    if (!tournamentData.name || tournamentData.name.trim() === "") {
      return NextResponse.json(
        { message: "Tournament name is required" },
        { status: 400 }
      );
    }

    if (!tournamentData.startDate || !tournamentData.endDate) {
      return NextResponse.json(
        { message: "Start and end dates are required" },
        { status: 400 }
      );
    }

    if (new Date(tournamentData.startDate) > new Date(tournamentData.endDate)) {
      return NextResponse.json(
        { message: "End date must be after start date" },
        { status: 400 }
      );
    }

    // TODO: Save to database
    console.log("Tournament saved:", tournamentData);

    return NextResponse.json(
      {
        message: "Tournament created successfully",
        tournament: tournamentData,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error saving tournament:", error);
    return NextResponse.json(
      { message: "Failed to save tournament" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // TODO: Fetch from database
    // For now, return mock data
    const tournament: ITournament = {
      id: "1",
      name: "",
      startDate: new Date(),
      endDate: new Date(),
      rules: "",
      status: "Setup",
    };

    return NextResponse.json({ tournament }, { status: 200 });
  } catch (error) {
    console.error("Error fetching tournament:", error);
    return NextResponse.json(
      { message: "Failed to fetch tournament" },
      { status: 500 }
    );
  }
}
