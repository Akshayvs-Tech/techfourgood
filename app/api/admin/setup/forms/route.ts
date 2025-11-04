import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabaseClient";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.json();

    // Validation
    if (!formData.tournamentId) {
      return NextResponse.json(
        { message: "Tournament ID is required" },
        { status: 400 }
      );
    }

    if (!formData.fields || formData.fields.length === 0) {
      return NextResponse.json(
        { message: "At least one field is required" },
        { status: 400 }
      );
    }

    // Validate each field has required properties
    for (const field of formData.fields) {
      if (!field.label || field.label.trim() === "") {
        return NextResponse.json(
          { message: "All field labels must be filled out" },
          { status: 400 }
        );
      }
      if (!field.fieldType) {
        return NextResponse.json(
          { message: "Field type is required" },
          { status: 400 }
        );
      }
    }

    const db = getServiceSupabase();
    const { error } = await db
      .from("registration_forms")
      .upsert({
        tournament_id: formData.tournamentId,
        player_fields: formData.fields,
      }, { onConflict: "tournament_id" });
    if (error) throw error;

    return NextResponse.json({ message: "Registration forms saved successfully" }, { status: 201 });
  } catch (error) {
    console.error("Error saving registration forms:", error);
    return NextResponse.json(
      { message: "Failed to save registration forms" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get("tournamentId");

    if (!tournamentId) {
      return NextResponse.json(
        { message: "Tournament ID is required" },
        { status: 400 }
      );
    }

    const db = getServiceSupabase();
    const { data, error } = await db
      .from("registration_forms")
      .select("player_fields")
      .eq("tournament_id", tournamentId)
      .maybeSingle();
    if (error) throw error;
    return NextResponse.json({ forms: { tournamentId, fields: data?.player_fields || [] } }, { status: 200 });
  } catch (error) {
    console.error("Error fetching registration forms:", error);
    return NextResponse.json(
      { message: "Failed to fetch forms" },
      { status: 500 }
    );
  }
}
