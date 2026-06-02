import { NextRequest, NextResponse } from "next/server";
import { listPublishedTemplates } from "@/lib/data";

export async function GET(request: NextRequest) {
  const teamId = request.nextUrl.searchParams.get("team");
  if (!teamId) {
    return NextResponse.json({ error: "缺少 team 參數" }, { status: 400 });
  }

  const templates = await listPublishedTemplates(teamId);
  return NextResponse.json({ templates });
}
