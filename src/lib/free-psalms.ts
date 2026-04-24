import fs from "node:fs/promises";
import path from "node:path";

const AUDIO_EXTENSIONS = new Set([".mp3", ".wav", ".flac", ".m4a", ".ogg", ".aac"]);
const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif", ".svg"]);

export type FreePsalm = {
  slug: string;
  title: string;
  fileName: string;
  audioUrl: string;
  thumbnailUrl: string;
};

type FreePsalmAsset = FreePsalm & {
  audioFilePath: string;
  imageFilePath: string | null;
};

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

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

async function loadFreePsalmAssets(): Promise<FreePsalmAsset[]> {
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

  const psalms: FreePsalmAsset[] = [];
  for (const fileName of files) {
    const extension = path.extname(fileName).toLowerCase();
    if (!AUDIO_EXTENSIONS.has(extension)) {
      continue;
    }

    const stem = path.basename(fileName, extension);
    const stemKey = stem.toLowerCase();
    const imageFileName = imageByStem.get(stemKey) ?? null;
    const baseSlug = slugify(stem) || "psaume";
    let slug = baseSlug;
    let index = 2;
    while (psalms.some((item) => item.slug === slug)) {
      slug = `${baseSlug}-${index}`;
      index += 1;
    }

    psalms.push({
      slug,
      title: toDisplayTitle(stem),
      fileName,
      audioUrl: `/psaumes/${encodeURIComponent(fileName)}`,
      thumbnailUrl: `/api/psaumes-cover/${slug}`,
      audioFilePath: path.join(root, fileName),
      imageFilePath: imageFileName ? path.join(root, imageFileName) : null,
    });
  }

  return psalms.sort((a, b) => a.title.localeCompare(b.title, "fr"));
}

export async function getFreePsalms(): Promise<FreePsalm[]> {
  const assets = await loadFreePsalmAssets();
  return assets.map((item) => ({
    slug: item.slug,
    title: item.title,
    fileName: item.fileName,
    audioUrl: item.audioUrl,
    thumbnailUrl: item.thumbnailUrl,
  }));
}

export async function getFreePsalmAssetBySlug(slug: string): Promise<FreePsalmAsset | null> {
  const assets = await loadFreePsalmAssets();
  return assets.find((item) => item.slug === slug) ?? null;
}
