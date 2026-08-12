import { NextRequest, NextResponse } from "next/server";
import { documentStore } from "@/lib/document-store";
import { sanitizeFilename } from "@/lib/utils";
import { checkRateLimit } from "@/lib/rate-limit";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  if (!checkRateLimit(ip, 40, 60_000)) {
    return NextResponse.json({ detail: "Rate limit exceeded" }, { status: 429 });
  }

  const { filename } = await params;

  let safeName: string;
  try {
    safeName = sanitizeFilename(decodeURIComponent(filename));
  } catch {
    return NextResponse.json({ detail: "Invalid filename" }, { status: 400 });
  }

  if (!documentStore.getFilenames().includes(safeName)) {
    return NextResponse.json({ detail: `${safeName} not found` }, { status: 404 });
  }

  try {
    documentStore.delete(safeName);
    return NextResponse.json({ success: true, message: `${safeName} deleted successfully` });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete document";
    return NextResponse.json({ detail: msg }, { status: 500 });
  }
}
