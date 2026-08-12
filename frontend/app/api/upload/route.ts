import { NextRequest, NextResponse } from "next/server";
import { sanitizeFilename, verifyPdfMagicBytes } from "@/lib/utils";
import { checkRateLimit } from "@/lib/rate-limit";
import { documentStore } from "@/lib/document-store";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  if (!checkRateLimit(ip, 5, 60_000)) {
    return NextResponse.json({ detail: "Rate limit exceeded. Try again later." }, { status: 429 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ detail: "No file provided" }, { status: 400 });

    let safeName: string;
    try {
      safeName = sanitizeFilename(file.name);
    } catch {
      return NextResponse.json({ detail: "Invalid filename" }, { status: 400 });
    }

    if (!safeName.endsWith(".pdf")) {
      return NextResponse.json({ detail: "Only PDF files are allowed" }, { status: 400 });
    }

    const arrayBuf = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuf);
    if (bytes.length > 10 * 1024 * 1024) {
      return NextResponse.json({ detail: "File size must be less than 10MB" }, { status: 400 });
    }

    if (!verifyPdfMagicBytes(bytes)) {
      return NextResponse.json({ detail: "Not a valid PDF document" }, { status: 400 });
    }

    documentStore.add(safeName, Buffer.from(arrayBuf), "application/pdf");

    return NextResponse.json({
      success: true,
      message: `${safeName} uploaded successfully`,
      filename: safeName,
    });
  } catch (err: unknown) {
    console.error("Upload error:", err);
    const msg = err instanceof Error ? err.message : "Failed to process document";
    return NextResponse.json({ detail: msg }, { status: 500 });
  }
}
