import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import {
  isStorageConfigured,
  uploadPublicFile,
  uniqueUploadName,
  MAX_KV_OBJECT_BYTES,
} from "@/lib/storage";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const AUDIO_TYPES = ["audio/mpeg", "audio/mp4", "audio/wav", "audio/ogg"];
const MAX_IMAGE = 5 * 1024 * 1024;
const MAX_MEDIA = Math.min(50 * 1024 * 1024, MAX_KV_OBJECT_BYTES);

export async function POST(request: Request) {
  const { error, session } = await requireRole(["MENTOR", "MENTEE"]);
  if (error || !session) return error;

  if (!isStorageConfigured()) {
    return NextResponse.json(
      {
        error:
          "File upload is not available right now. Please try again later.",
      },
      { status: 503 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const isImage = IMAGE_TYPES.includes(file.type);
  const isVideo = VIDEO_TYPES.includes(file.type);
  const isAudio = AUDIO_TYPES.includes(file.type);

  if (!isImage && !isVideo && !isAudio) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }

  const maxSize = isImage ? MAX_IMAGE : MAX_MEDIA;
  if (file.size > maxSize) {
    return NextResponse.json(
      {
        error: `File too large. Max ${isImage ? "5MB" : `${Math.floor(MAX_MEDIA / (1024 * 1024))}MB`}.`,
      },
      { status: 400 }
    );
  }

  try {
    const key = `feed/${session.user.id}/${uniqueUploadName(file.name)}`;
    const buffer = await file.arrayBuffer();
    const uploaded = await uploadPublicFile(key, buffer, file.type);
    return NextResponse.json({
      fileUrl: uploaded.fileUrl,
      storageKey: uploaded.storageKey,
      mimeType: file.type,
      fileSize: file.size,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
