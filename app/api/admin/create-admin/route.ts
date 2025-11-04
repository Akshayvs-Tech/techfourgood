import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabaseClient";

/**
 * API Route to create admin user
 * This uses the service role key to bypass RLS
 * 
 * Usage:
 * POST /api/admin/create-admin
 * Body: {
 *   email: "admin@example.com",
 *   password: "SecurePassword123!",
 *   fullName: "Admin User",
 *   phone: "+1234567890" (optional)
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, fullName, phone } = body;

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { message: "email, password, and fullName are required" },
        { status: 400 }
      );
    }

    const serviceSupabase = getServiceSupabase();

    // Check if user already exists
    const { data: existingUser } = await serviceSupabase.auth.admin.listUsers();
    const userExists = existingUser.users.find((u) => u.email === email);

    let authUserId: string;

    if (userExists) {
      authUserId = userExists.id;
      console.log("User already exists, using existing user:", authUserId);
    } else {
      // Create new user
      const { data: newUser, error: createError } =
        await serviceSupabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            role: "admin",
          },
        });

      if (createError || !newUser.user) {
        console.error("Error creating user:", createError);
        return NextResponse.json(
          { message: createError?.message || "Failed to create user" },
          { status: 500 }
        );
      }

      authUserId = newUser.user.id;
      console.log("User created successfully:", authUserId);
    }

    // Create or update admin entry (NOT coaches - admins are different!)
    const { data: admin, error: adminError } = await serviceSupabase
      .from("admins")
      .upsert(
        {
          auth_user_id: authUserId,
          full_name: fullName,
          email,
          phone: phone || null,
          role: "admin", // Default role, can be 'admin' or 'super_admin'
        },
        { onConflict: "email" }
      )
      .select()
      .single();

    if (adminError) {
      console.error("Error creating admin entry:", adminError);
      return NextResponse.json(
        { message: adminError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "Admin user created successfully",
        user: {
          id: authUserId,
          email,
          adminId: admin.id,
          role: admin.role,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { message: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

