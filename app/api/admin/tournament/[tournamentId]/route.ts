import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabaseClient";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tournamentId: string }> | { tournamentId: string } }
) {
  try {
    // Handle both Promise and direct object (for Next.js 13+ compatibility)
    const resolvedParams = params instanceof Promise ? await params : params;
    const tournamentId = resolvedParams.tournamentId;

    if (!tournamentId) {
      return NextResponse.json(
        { error: "Tournament ID is required" },
        { status: 400 }
      );
    }

    const db = getServiceSupabase();

    const { data: tournament, error } = await db
      .from("tournaments")
      .select("id, name, registration_deadline")
      .eq("id", tournamentId)
      .single();

    if (error || !tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: tournament.id,
      name: tournament.name,
      registrationDeadline: tournament.registration_deadline
        ? new Date(tournament.registration_deadline).toISOString().split("T")[0]
        : null,
    });
  } catch (error) {
    console.error("Error fetching tournament:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch tournament",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

