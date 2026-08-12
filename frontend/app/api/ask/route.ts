import { NextRequest, NextResponse } from "next/server";
import { ai } from "@/lib/gemini";
import { sanitizeFilename } from "@/lib/utils";
import { checkRateLimit } from "@/lib/rate-limit";
import { documentStore } from "@/lib/document-store";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  if (!checkRateLimit(ip, 20, 60_000)) {
    return NextResponse.json({ detail: "Rate limit exceeded. Try again later." }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { question, document_name } = body as { question: string; document_name?: string };

    if (!question || !question.trim()) {
      return NextResponse.json({ detail: "Question cannot be empty" }, { status: 400 });
    }

    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
      { text: question },
    ];

    if (document_name) {
      let safeName: string;
      try {
        safeName = sanitizeFilename(document_name);
      } catch {
        return NextResponse.json({ detail: "Invalid document name" }, { status: 400 });
      }

      const doc = documentStore.get(safeName);
      if (doc) {
        parts.push({
          inlineData: {
            mimeType: doc.mimeType,
            data: doc.bytes.toString("base64"),
          },
        });
      }
    }

    const response = await ai!.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts }],
    });
    const answer = response.text!;

    return NextResponse.json({ answer, sources: document_name ? [document_name] : [] });
  } catch (err: unknown) {
    console.error("Ask error:", err);
    const msg = err instanceof Error ? err.message : "Failed to get answer";
    return NextResponse.json({ detail: `Gemini API error: ${msg}` }, { status: 500 });
  }
}
