import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Temporary migration endpoint, present only on the protected QA branch.
// The source is fixed: this cannot fetch arbitrary user-supplied URLs.
const SOURCE = "https://www.abmgood.com/assets/product/upload/ryDG8vHK4Jcl40jD3nJAYkYDx5NdZipyIInJ87xI.png";
const MAX_BYTES = 50 * 1024 * 1024;
const CHUNK_BYTES = 512000;
let original: Promise<Buffer> | undefined;

async function imageBytes() {
  if (!original) {
    original = (async () => {
      const response = await fetch(SOURCE, { signal: AbortSignal.timeout(30000) });
      if (!response.ok || !response.headers.get("content-type")?.startsWith("image/png")) throw new Error("Official original unavailable");
      if (Number(response.headers.get("content-length") || 0) > MAX_BYTES) throw new Error("Original exceeds migration limit");
      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.length > MAX_BYTES || bytes.length < 24 || bytes.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") throw new Error("Invalid PNG original");
      return bytes;
    })();
  }
  return original;
}

export async function GET(request: NextRequest) {
  const part = Number(request.nextUrl.searchParams.get("part") || 0);
  if (!Number.isInteger(part) || part < 0 || part > 103) return NextResponse.json({ error: "Invalid part" }, { status: 400 });
  try {
    const bytes = await imageBytes();
    const count = Math.ceil(bytes.length / CHUNK_BYTES);
    if (part >= count) return NextResponse.json({ error: "Part not found" }, { status: 404 });
    return NextResponse.json({
      part, count, bytes: bytes.length, width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20),
      sha256: createHash("sha256").update(bytes).digest("hex"),
      data: bytes.subarray(part * CHUNK_BYTES, (part + 1) * CHUNK_BYTES).toString("base64"),
    });
  } catch {
    original = undefined;
    return NextResponse.json({ error: "Official original unavailable" }, { status: 502 });
  }
}
