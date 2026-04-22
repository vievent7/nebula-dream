import fs from "node:fs/promises";
import { NextResponse } from "next/server";
import { getAudioMimeType } from "@/lib/media";
import { getTrackBySlug } from "@/lib/tracks";

export async function GET(
  _: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const track = await getTrackBySlug(slug);
  if (!track?.previewFilePath) {
    return NextResponse.json({ error: "Preview introuvable." }, { status: 404 });
  }

  const bytes = await fs.readFile(track.previewFilePath);
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": getAudioMimeType(track.previewFilePath),
      "Cache-Control": "public, max-age=600",
    },
  });
}
