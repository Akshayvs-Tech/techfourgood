import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabaseClient";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest, ctx: { params: { playerId: string } } | any) {
  try {
    const awaitedParams = ctx?.params && typeof ctx.params.then === "function" ? await ctx.params : ctx.params;
    const playerId = awaitedParams?.playerId;
    const { address, otherInfo, coachId } = await req.json();
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
      .from("player_extra")
      .upsert({ player_id: playerId, address: address || null, other_info: otherInfo || {}, updated_by: resolvedCoachId || null }, { onConflict: "player_id" });
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || "Failed" }, { status: 500 });
  }
}


