import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getAudioMimeType } from "@/lib/media";
import { getTrackBySlug } from "@/lib/tracks";

function getImageMimeType(filePath: string): string {
  const lower = filePath.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".avif")) return "image/avif";
  return getAudioMimeType(filePath);
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

  pos += 1; // picture type byte
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

async function serveFallback(): Promise<NextResponse> {
  const fallbackPath = path.join(process.cwd(), "public", "assets", "default-track-cover.png");
  const bytes = await fs.readFile(fallbackPath);
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400",
    },
  });
}

export async function GET(
  _: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { slug } = await context.params;
  const track = await getTrackBySlug(slug);
  if (!track) {
    return serveFallback();
  }

  if (track.thumbnailFilePath) {
    const bytes = await fs.readFile(track.thumbnailFilePath);
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": getImageMimeType(track.thumbnailFilePath),
        "Cache-Control": "public, max-age=86400",
      },
    });
  }

  const embeddedSource = track.fullFilePath ?? track.previewFilePath;
  if (embeddedSource) {
    const embedded = await extractEmbeddedCover(embeddedSource);
    if (embedded) {
      return new NextResponse(embedded.bytes as unknown as BodyInit, {
        headers: {
          "Content-Type": embedded.mimeType,
          "Cache-Control": "public, max-age=86400",
        },
      });
    }
  }

  return serveFallback();
}
