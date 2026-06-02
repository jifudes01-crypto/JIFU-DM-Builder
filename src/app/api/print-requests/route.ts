import { NextResponse } from "next/server";
import { listPrintRequests } from "@/lib/data";

export async function GET() {
  const printRequests = await listPrintRequests();
  return NextResponse.json({ printRequests });
}
