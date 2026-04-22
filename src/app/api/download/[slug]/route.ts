import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { hasUserPurchasedTrack } from "@/lib/orders";
import { getTrackBySlug } from "@/lib/tracks";

export async function GET(
  _: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }

  const hasAccess = await hasUserPurchasedTrack(user.id, slug);
  if (!hasAccess) {
    return NextResponse.json({ error: "Achat requis." }, { status: 403 });
  }

  const track = await getTrackBySlug(slug);
  if (!track?.fullFilePath) {
    return NextResponse.json({ error: "Fichier introuvable." }, { status: 404 });
  }

  const bytes = await fs.readFile(track.fullFilePath);
  const fileName = path.basename(track.fullFilePath);

  return new NextResponse(bytes, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "private, max-age=0, no-store",
    },
  });
}
