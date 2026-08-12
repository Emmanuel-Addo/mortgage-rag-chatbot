import { revalidatePath } from "next/cache";

export function sanitizeFilename(filename: string): string {
  const base = filename.replace(/^.*[\\\/]/, "");
  const sanitized = base.replace(/[^a-zA-Z0-9_\.\-]/g, "");
  if (!sanitized || sanitized.startsWith(".")) {
    throw new Error("Invalid filename");
  }
  return sanitized;
}

export function verifyPdfMagicBytes(content: Uint8Array): boolean {
  return content[0] === 0x25 && content[1] === 0x50 && content[2] === 0x44 && content[3] === 0x46;
}

export function splitText(text: string, chunkSize = 500, overlap = 50): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    chunks.push(text.slice(start, start + chunkSize));
    start += chunkSize - overlap;
  }
  return chunks;
}
