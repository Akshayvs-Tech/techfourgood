import { NextRequest, NextResponse } from "next/server";

// Placeholder API to satisfy module resolution; wire real logic when needed
export async function GET(_req: NextRequest) {
  return NextResponse.json({ message: "Registration API not implemented" }, { status: 200 });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return NextResponse.json({ ok: true, received: body });
}


