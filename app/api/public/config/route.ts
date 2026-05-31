import { NextResponse } from "next/server";
import { getPublicConfig } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getPublicConfig());
}
