import { promises as fs } from "node:fs";
import path from "node:path";

const HERO_CARDS_DIR = path.join(process.cwd(), "public", "assets", "hero-cards");
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

export type HeroCard = {
  slot: number;
  src: string;
};

function isImageFile(filename: string) {
  return IMAGE_EXTENSIONS.has(path.extname(filename).toLowerCase());
}

function toPublicHeroCardPath(filename: string) {
  return encodeURI(`/assets/hero-cards/${filename}`);
}

export async function getHeroCards(): Promise<HeroCard[]> {
  try {
    const files = await fs.readdir(HERO_CARDS_DIR, { withFileTypes: true });
    return files
      .filter((entry) => entry.isFile() && isImageFile(entry.name))
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b))
      .slice(0, 6)
      .map((name, index) => ({ slot: index + 1, src: toPublicHeroCardPath(name) }));
  } catch {
    return [];
  }
}
