import fs from "node:fs/promises";
import path from "node:path";

const AUDIO_EXTENSIONS = new Set([".mp3", ".wav", ".flac", ".m4a", ".ogg", ".aac"]);
const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif"]);

export type FreePsalm = {
  id: string;
  title: string;
  fileName: string;
  audioUrl: string;
  imageUrl: string | null;
};

function toDisplayTitle(stem: string): string {
  const normalized = stem
    .replace(/\s*\(\d+\)\s*$/g, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const psalmWithNumber = normalized.match(/^psaume\s*(\d+)$/i);
  if (psalmWithNumber) {
    return `Psaume ${psalmWithNumber[1]}`;
  }

  return normalized.replace(/\b\p{L}/gu, (letter) => letter.toUpperCase());
}

export async function getFreePsalms(): Promise<FreePsalm[]> {
  const root = path.join(process.cwd(), "public", "psaumes");
  let entries: import("node:fs").Dirent[] = [];

  try {
    entries = await fs.readdir(root, { withFileTypes: true });
  } catch {
    return [];
  }

  const files = entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
  const imageByStem = new Map<string, string>();

  for (const fileName of files) {
    const extension = path.extname(fileName).toLowerCase();
    if (!IMAGE_EXTENSIONS.has(extension)) {
      continue;
    }
    const stem = path.basename(fileName, extension).toLowerCase();
    if (!imageByStem.has(stem)) {
      imageByStem.set(stem, fileName);
    }
  }

  const psalms: FreePsalm[] = [];
  for (const fileName of files) {
    const extension = path.extname(fileName).toLowerCase();
    if (!AUDIO_EXTENSIONS.has(extension)) {
      continue;
    }

    const stem = path.basename(fileName, extension);
    const stemKey = stem.toLowerCase();
    const imageFileName = imageByStem.get(stemKey) ?? null;

    psalms.push({
      id: stemKey,
      title: toDisplayTitle(stem),
      fileName,
      audioUrl: `/psaumes/${encodeURIComponent(fileName)}`,
      imageUrl: imageFileName ? `/psaumes/${encodeURIComponent(imageFileName)}` : null,
    });
  }

  return psalms.sort((a, b) => a.title.localeCompare(b.title, "fr"));
}

