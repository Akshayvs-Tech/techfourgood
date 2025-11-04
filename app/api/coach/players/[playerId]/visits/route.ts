import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabaseClient";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest, ctx: { params: { playerId: string } } | any) {
  try {
    const awaitedParams = ctx?.params && typeof ctx.params.then === "function" ? await ctx.params : ctx.params;
    const playerId = awaitedParams?.playerId;
    const db = getServiceSupabase();
    const { data, error } = await db
      .from("home_visits")
      .select("id, player_id, coach_id, visit_date, notes, created_at, coaches:coach_id(full_name)")
      .eq("player_id", playerId)
      .order("visit_date", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ visits: data || [] });
  } catch (e: any) {
    return NextResponse.json({ visits: [] });
  }
}

export async function POST(req: NextRequest, ctx: { params: { playerId: string } } | any) {
  try {
    const awaitedParams = ctx?.params && typeof ctx.params.then === "function" ? await ctx.params : ctx.params;
    const playerId = awaitedParams?.playerId;
    const { coachId, visitDate, notes } = await req.json();
    const db = getServiceSupabase();
    let resolvedCoachId = coachId;
    try {
      if (!resolvedCoachId) {
        const authHeader = req.headers.get('authorization') || req.headers.get('Authorization') || '';
        if (authHeader?.toLowerCase().startsWith('bearer ')) {
          const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL as string, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string, { global: { headers: { Authorization: authHeader } } });
          const { data: { user } } = await anon.auth.getUser();
          const uid = user?.id;
          if (uid) {
            const { data: coach } = await db.from('coaches').select('id').eq('auth_user_id', uid).maybeSingle();
            resolvedCoachId = coach?.id || null;
          }
        }
      }
    } catch {}
    const { error } = await db
      .from("home_visits")
      .insert({ player_id: playerId, coach_id: resolvedCoachId, visit_date: visitDate, notes: notes || null });
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || "Failed" }, { status: 500 });
  }
}


