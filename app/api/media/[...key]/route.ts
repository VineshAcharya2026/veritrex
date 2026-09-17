import { NextResponse } from "next/server";
import { getKvMediaObject } from "@/lib/storage";

type RouteContext = { params: Promise<{ key: string[] }> };

/**
 * Public media served from AUTH_KV (used when R2 is not bound).
 * Keys look like: /api/media/feed/{userId}/{filename}
 */
export async function GET(_request: Request, { params }: RouteContext) {
  const { key: parts } = await params;
  if (!parts?.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Reject path traversal
  if (parts.some((p) => !p || p === "." || p === ".." || p.includes("\\"))) {
    return NextResponse.json({ error: "Invalid key" }, { status: 400 });
  }

  const storageKey = parts.map((p) => decodeURIComponent(p)).join("/");
  const object = await getKvMediaObject(storageKey);
  if (!object) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(object.body), {
    status: 200,
    headers: {
      "Content-Type": object.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
