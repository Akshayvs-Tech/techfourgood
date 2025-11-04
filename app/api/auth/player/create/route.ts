import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabaseClient";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fullName, email, password, contactNumber, gender, dateOfBirth, tournamentId } = body || {};
    if (!fullName || !email) {
      return NextResponse.json(
        { message: "fullName and email are required" },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { message: "Password is required and must be at least 6 characters" },
        { status: 400 }
      );
    }

    const service = getServiceSupabase();

    // Check if user already exists
    const { data: existingUsers } = await service.auth.admin.listUsers();
    const existingUser = existingUsers.users.find((u) => u.email === email);

    let authUserId: string | null = null;
    
    if (existingUser) {
      // Update password if user exists
      await service.auth.admin.updateUserById(existingUser.id, {
        password: password,
      });
      authUserId = existingUser.id;
    } else {
      // Create new auth user with provided password
      const { data: signUpData, error: signUpError } = await service.auth.admin.createUser({
        email,
        password: password,
        email_confirm: true,
        user_metadata: {
          role: "player",
        },
      });
      if (signUpError || !signUpData.user) {
        return NextResponse.json(
          { message: signUpError?.message || "Failed to create auth user" },
          { status: 500 }
        );
      }
      authUserId = signUpData.user.id;
    }

    // Upsert player profile
    const { data: player, error: playerError } = await service
      .from("players")
      .upsert(
        {
          auth_user_id: authUserId,
          full_name: fullName,
          email,
          contact_number: contactNumber || null,
          gender: gender || null,
          date_of_birth: dateOfBirth || null,
          tournament_id: tournamentId || null,
          status: "Pending",
          is_captain: false,
        },
        { onConflict: "email" }
      )
      .select()
      .maybeSingle();

    if (playerError) {
      return NextResponse.json(
        { message: playerError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, player }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { message: e?.message || "Unknown error" },
      { status: 500 }
    );
  }
}



