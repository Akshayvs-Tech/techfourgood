import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabaseClient";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ teamId: string }> | { teamId: string } }
) {
  try {
    const resolved = (context?.params && typeof (context as any).params.then === "function")
      ? await (context as any).params
      : (context as any).params;
    const teamId = resolved?.teamId;
    const db = getServiceSupabase();
    const { data, error } = await db
      .from("teams")
      .select("id, name")
      .eq("id", teamId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ message: "Not found" }, { status: 404 });
    return NextResponse.json({ team: { id: data.id, name: data.name } });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || "Error" }, { status: 500 });
  }
}



