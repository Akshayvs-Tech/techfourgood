import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabaseClient";

export async function GET() {
  try {
    const db = getServiceSupabase();
    const { data, error } = await db
      .from("program_managers")
      .select("id, full_name, email, phone")
      .order("full_name");
    if (error) throw error;
    return NextResponse.json({ programManagers: data || [] });
  } catch (e: any) {
    return NextResponse.json({ programManagers: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { fullName, email, phone, password } = await req.json();
    if (!fullName || !email || !password) {
      return NextResponse.json({ message: "fullName, email, password required" }, { status: 400 });
    }
    const db = getServiceSupabase();
    // Create/find auth user
    const { data: existing } = await db.auth.admin.listUsers();
    const user = existing.users.find((u) => u.email === email);
    let authUserId: string;
    if (user) {
      await db.auth.admin.updateUserById(user.id, { password });
      authUserId = user.id;
    } else {
      const { data: created, error: cErr } = await db.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role: "program_manager" },
      });
      if (cErr || !created.user) throw new Error(cErr?.message || "create user failed");
      authUserId = created.user.id;
    }

    const { data, error } = await db
      .from("program_managers")
      .upsert({ auth_user_id: authUserId, full_name: fullName, email, phone: phone || null }, { onConflict: "email" })
      .select()
      .maybeSingle();
    if (error) throw error;
    return NextResponse.json({ programManager: data }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || "Failed" }, { status: 500 });
  }
}


