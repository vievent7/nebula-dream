import fs from "node:fs/promises";
import { NextResponse } from "next/server";
import { getFreePsalmAssetBySlug } from "@/lib/free-psalms";

function getImageMimeType(filePath: string): string {
  const lower = filePath.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".avif")) return "image/avif";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  return "application/octet-stream";
}

function readSynchsafeInt(buffer: Buffer, offset: number): number {
  return (
    ((buffer[offset] & 0x7f) << 21) |
    ((buffer[offset + 1] & 0x7f) << 14) |
    ((buffer[offset + 2] & 0x7f) << 7) |
    (buffer[offset + 3] & 0x7f)
  );
}

function parseApicFrame(frame: Buffer): { bytes: Buffer; mimeType: string } | null {
  if (frame.length < 8) return null;

  let pos = 0;
  const encoding = frame[pos];
  pos += 1;

  const mimeEnd = frame.indexOf(0x00, pos);
  if (mimeEnd === -1) return null;
  const mimeType = frame.slice(pos, mimeEnd).toString("latin1");
  pos = mimeEnd + 1;

  pos += 1;
  if (pos >= frame.length) return null;

  if (encoding === 0x00 || encoding === 0x03) {
    const descEnd = frame.indexOf(0x00, pos);
    if (descEnd === -1) return null;
    pos = descEnd + 1;
  } else {
    while (pos + 1 < frame.length) {
      if (frame[pos] === 0x00 && frame[pos + 1] === 0x00) {
        pos += 2;
        break;
      }
      pos += 2;
    }
  }

  if (pos >= frame.length) return null;
  return { bytes: frame.subarray(pos), mimeType: mimeType || "image/jpeg" };
}

async function extractEmbeddedCover(filePath: string): Promise<{ bytes: Buffer; mimeType: string } | null> {
  if (!filePath.toLowerCase().endsWith(".mp3")) return null;

  const data = await fs.readFile(filePath);
  if (data.length < 10 || data.toString("latin1", 0, 3) !== "ID3") {
    return null;
  }

  const version = data[3];
  const tagSize = readSynchsafeInt(data, 6);
  let offset = 10;
  const end = Math.min(data.length, 10 + tagSize);

  while (offset + 10 <= end) {
    const frameId = data.toString("latin1", offset, offset + 4);
    if (!frameId.trim()) break;

    const frameSize =
      version === 4 ? readSynchsafeInt(data, offset + 4) : data.readUInt32BE(offset + 4);
    if (!Number.isFinite(frameSize) || frameSize <= 0) break;

    const frameStart = offset + 10;
    const frameEnd = frameStart + frameSize;
    if (frameEnd > end) break;

    if (frameId === "APIC") {
      return parseApicFrame(data.subarray(frameStart, frameEnd));
    }

    offset = frameEnd;
  }

  return null;
}

export async function GET(
  _: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const psalm = await getFreePsalmAssetBySlug(slug);
  if (!psalm) {
    return NextResponse.json({ error: "Psaume introuvable." }, { status: 404 });
  }

  if (psalm.imageFilePath) {
    const bytes = await fs.readFile(psalm.imageFilePath);
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": getImageMimeType(psalm.imageFilePath),
        "Cache-Control": "no-store",
      },
    });
  }

  const embedded = await extractEmbeddedCover(psalm.audioFilePath);
  if (embedded) {
    return new NextResponse(embedded.bytes as unknown as BodyInit, {
      headers: {
        "Content-Type": embedded.mimeType,
        "Cache-Control": "no-store",
      },
    });
  }

  return NextResponse.json({ error: "Miniature introuvable." }, { status: 404 });
}
