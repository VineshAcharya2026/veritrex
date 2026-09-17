import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { isStorageConfigured, uploadPublicFile, uniqueUploadName } from "@/lib/storage";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const DOC_TYPES = ["application/pdf"];
const MAX_SIZE = 10 * 1024 * 1024;

export async function POST(request: Request) {
  const { error, session } = await requireRole("MENTOR");
  if (error || !session) return error;

  if (!isStorageConfigured()) {
    return NextResponse.json({ error: "File upload not configured" }, { status: 503 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (![...IMAGE_TYPES, ...DOC_TYPES].includes(file.type)) {
    return NextResponse.json(
      { error: "Unsupported file type. Upload an image or PDF." },
      { status: 400 }
    );
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File too large. Max 10MB." }, { status: 400 });
  }

  const key = `nation-building/${session.user.id}/${uniqueUploadName(file.name)}`;
  const buffer = await file.arrayBuffer();
  const uploaded = await uploadPublicFile(key, buffer, file.type);

  return NextResponse.json({
    fileUrl: uploaded.fileUrl,
    storageKey: uploaded.storageKey,
    mimeType: file.type,
  });
}
