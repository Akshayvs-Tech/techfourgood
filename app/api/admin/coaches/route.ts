import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabaseClient";

export async function GET() {
  try {
    const db = getServiceSupabase();
    const { data, error } = await db
      .from("coaches")
      .select("id, full_name, email, phone")
      .order("full_name");
    if (error) throw error;
    return NextResponse.json({ coaches: data });
  } catch (e: any) {
    return NextResponse.json({ coaches: [] });
  }
}

/**
 * POST /api/admin/coaches
 * 
 * Adds a new coach. This is called by ADMINS only.
 * Coaches are managed by admins - they don't self-register.
 * 
 * Note: Coaches will get a separate login and dashboard later.
 * For now, admins create coach accounts and coaches can login
 * (but coach dashboard/features are not implemented yet).
 */
export async function POST(req: NextRequest) {
  try {
    const { fullName, email, phone, password } = await req.json();
    if (!fullName || !email) {
      return NextResponse.json({ message: "fullName and email required" }, { status: 400 });
    }
    if (!password) {
      return NextResponse.json({ message: "password is required" }, { status: 400 });
    }
    const db = getServiceSupabase();
    
    // Check if user already exists
    const { data: existingUsers } = await db.auth.admin.listUsers();
    const existingUser = existingUsers.users.find((u) => u.email === email);
    
    let authUserId: string;
    
    if (existingUser) {
      // Update password if user exists
      await db.auth.admin.updateUserById(existingUser.id, {
        password: password,
      });
      authUserId = existingUser.id;
    } else {
      // Create auth user for coach with provided password
      const { data: newUser, error: createError } = await db.auth.admin.createUser({
        email,
        password: password,
        email_confirm: true,
        user_metadata: {
          role: "coach",
        },
      });
      
      if (createError || !newUser.user) {
        throw new Error(createError?.message || "Failed to create auth user");
      }
      
      authUserId = newUser.user.id;
    }
    
    // Insert coach with auth_user_id link
    const { data, error } = await db
      .from("coaches")
      .upsert(
        {
          auth_user_id: authUserId,
          full_name: fullName,
          email,
          phone: phone || null,
        },
        { onConflict: "email" }
      )
      .select()
      .maybeSingle();
      
    if (error) throw error;
    return NextResponse.json({ coach: data }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || "Failed" }, { status: 500 });
  }
}



