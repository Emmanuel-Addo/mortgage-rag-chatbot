import { NextRequest, NextResponse } from "next/server";
import { documentStore } from "@/lib/document-store";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  if (!checkRateLimit(ip, 40, 60_000)) {
    return NextResponse.json({ detail: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const filenames = documentStore.getFilenames();
    return NextResponse.json(filenames.map((name) => ({ name })));
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
