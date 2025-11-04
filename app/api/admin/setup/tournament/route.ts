import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabaseClient";

interface TournamentPayload {
  id?: string;
  name: string;
  startDate: Date | string;
  endDate: Date | string;
  rules: string;
  status?: string;
  registrationDeadline?: string;
  venue?: string;
  fields?: string[];
  format?: string;
  maxTeams?: number;
}

export async function POST(request: NextRequest) {
  try {
    const tournamentData: TournamentPayload = await request.json();

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

    const db = getServiceSupabase();

    // Insert tournament into database
    const { data, error } = await db
      .from("tournaments")
      .insert({
        name: tournamentData.name,
        start_date: new Date(tournamentData.startDate).toISOString(),
        end_date: new Date(tournamentData.endDate).toISOString(),
        registration_deadline: tournamentData.registrationDeadline 
          ? new Date(tournamentData.registrationDeadline).toISOString() 
          : null,
        venue: tournamentData.venue || null,
        fields: tournamentData.fields || [],
        format: tournamentData.format || null,
        max_teams: tournamentData.maxTeams || 16,
        rules: tournamentData.rules || "",
        status: tournamentData.status || "draft",
      })
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { message: error.message || "Failed to create tournament" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "Tournament created successfully",
        tournament: {
          id: data.id,
          name: data.name,
          startDate: data.start_date,
          endDate: data.end_date,
          rules: data.rules,
          status: data.status,
        },
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

export async function PUT(request: NextRequest) {
  try {
    const tournamentData: TournamentPayload = await request.json();

    if (!tournamentData.id) {
      return NextResponse.json(
        { message: "Tournament ID is required for update" },
        { status: 400 }
      );
    }

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

    const db = getServiceSupabase();

    // Update tournament in database
    const { data, error } = await db
      .from("tournaments")
      .update({
        name: tournamentData.name,
        start_date: new Date(tournamentData.startDate).toISOString(),
        end_date: new Date(tournamentData.endDate).toISOString(),
        registration_deadline: tournamentData.registrationDeadline 
          ? new Date(tournamentData.registrationDeadline).toISOString() 
          : null,
        venue: tournamentData.venue || null,
        fields: tournamentData.fields || [],
        format: tournamentData.format || null,
        max_teams: tournamentData.maxTeams || 16,
        rules: tournamentData.rules || "",
        status: tournamentData.status || "draft",
        updated_at: new Date().toISOString(),
      })
      .eq("id", tournamentData.id)
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { message: error.message || "Failed to update tournament" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "Tournament updated successfully",
        tournament: {
          id: data.id,
          name: data.name,
          startDate: data.start_date,
          endDate: data.end_date,
          rules: data.rules,
          status: data.status,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating tournament:", error);
    return NextResponse.json(
      { message: "Failed to update tournament" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const tournamentId = request.nextUrl.searchParams.get("tournamentId");
    
    if (!tournamentId) {
      return NextResponse.json(
        { message: "Tournament ID is required" },
        { status: 400 }
      );
    }

    const db = getServiceSupabase();
    
    const { data, error } = await db
      .from("tournaments")
      .select("*")
      .eq("id", tournamentId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { message: "Tournament not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      tournament: {
        id: data.id,
        name: data.name,
        startDate: data.start_date,
        endDate: data.end_date,
        rules: data.rules,
        status: data.status,
        registrationDeadline: data.registration_deadline,
        venue: data.venue,
        fields: data.fields,
        format: data.format,
        maxTeams: data.max_teams,
      },
    }, { status: 200 });
  } catch (error) {
    console.error("Error fetching tournament:", error);
    return NextResponse.json(
      { message: "Failed to fetch tournament" },
      { status: 500 }
    );
  }
}
