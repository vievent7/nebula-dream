import fs from "node:fs/promises";
import path from "node:path";
import { parseFile } from "music-metadata";

export type Track = {
  slug: string;
  title: string;
  description: string;
  mood: string;
  duration: string;
  previewUrl: string | null;
  fullUrl: string | null;
  thumbnailUrl: string | null;
  previewFilePath: string | null;
  fullFilePath: string | null;
  thumbnailFilePath: string | null;
};

export type PublicTrack = Omit<Track, "previewFilePath" | "fullFilePath" | "thumbnailFilePath">;

type TrackMeta = Partial<{
  title: string;
  description: string;
  mood: string;
  duration: string;
  preview: string;
  full: string;
  thumbnail: string;
  cover: string;
}>;

type RootAudioCandidate = {
  fileName: string;
  fullPath: string;
};

const AUDIO_EXTENSIONS = new Set([".mp3", ".wav", ".flac", ".m4a", ".ogg", ".aac"]);
const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif"]);

function isAudioFile(fileName: string): boolean {
  return AUDIO_EXTENSIONS.has(path.extname(fileName).toLowerCase());
}

function isImageFile(fileName: string): boolean {
  return IMAGE_EXTENSIONS.has(path.extname(fileName).toLowerCase());
}

function toTitle(value: string): string {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

function stripDuplicateSuffix(fileName: string): string {
  const stem = path.basename(fileName, path.extname(fileName));
  return stem.replace(/\s*\(\d+\)$/i, "").trim();
}

function pickPreviewAndFull(files: RootAudioCandidate[]): {
  previewFilePath: string | null;
  fullFilePath: string | null;
} {
  const sorted = [...files].sort((a, b) => a.fileName.localeCompare(b.fileName));
  const preview =
    sorted.find((entry) => /\(\d+\)/i.test(entry.fileName)) ??
    sorted.find((entry) => entry.fileName.toLowerCase().includes("preview")) ??
    sorted[0];

  const full = sorted.find((entry) => entry.fileName !== preview.fileName) ?? preview;
  return {
    previewFilePath: preview?.fullPath ?? null,
    fullFilePath: full?.fullPath ?? null,
  };
}

async function readTrackMeta(trackFolder: string): Promise<TrackMeta> {
  const candidates = ["track.json", "metadata.json"];
  for (const fileName of candidates) {
    const metaPath = path.join(trackFolder, fileName);
    try {
      const raw = await fs.readFile(metaPath, "utf8");
      return JSON.parse(raw) as TrackMeta;
    } catch {
      // continue
    }
  }
  return {};
}

function resolveAudioPaths(
  trackFolder: string,
  audioFiles: string[],
  meta: TrackMeta,
): { previewFilePath: string | null; fullFilePath: string | null } {
  const sorted = [...audioFiles].sort((a, b) => a.localeCompare(b));
  const previewCandidate =
    meta.preview ??
    sorted.find((fileName) => fileName.toLowerCase().includes("preview")) ??
    sorted.find((fileName) => /\(\d+\)/i.test(fileName)) ??
    sorted[0];
  const fullCandidate =
    meta.full ??
    sorted.find((fileName) => fileName !== previewCandidate) ??
    previewCandidate;

  const previewFilePath = previewCandidate
    ? path.join(trackFolder, previewCandidate)
    : null;
  const fullFilePath = fullCandidate ? path.join(trackFolder, fullCandidate) : null;

  return { previewFilePath, fullFilePath };
}

function resolveThumbnailInFolder(
  trackFolder: string,
  fileEntries: import("node:fs").Dirent[],
  meta: TrackMeta,
): string | null {
  const metaCover = meta.thumbnail ?? meta.cover;
  if (metaCover) {
    return path.join(trackFolder, metaCover);
  }

  const image = fileEntries.find((entry) => entry.isFile() && isImageFile(entry.name));
  return image ? path.join(trackFolder, image.name) : null;
}

function buildTrack(
  slug: string,
  title: string,
  previewFilePath: string | null,
  fullFilePath: string | null,
  thumbnailFilePath: string | null,
  duration: string,
  meta?: TrackMeta,
): Track {
  return {
    slug,
    title,
    description: meta?.description ?? "Ambient relaxant pour respiration et concentration.",
    mood: meta?.mood ?? "Cosmic Calm",
    duration,
    previewUrl: previewFilePath ? `/api/audio/${slug}/preview` : null,
    fullUrl: fullFilePath ? `/api/audio/${slug}/full` : null,
    thumbnailUrl: `/api/cover/${slug}`,
    previewFilePath,
    fullFilePath,
    thumbnailFilePath,
  };
}

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "00:00";
  }

  const total = Math.floor(seconds);
  const minutes = Math.floor(total / 60);
  const secs = total % 60;
  return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

async function detectDuration(
  metaDuration: string | undefined,
  fullFilePath: string | null,
  previewFilePath: string | null,
): Promise<string> {
  if (metaDuration && metaDuration.trim()) {
    return metaDuration;
  }

  const candidate = fullFilePath ?? previewFilePath;
  if (!candidate) {
    return "00:00";
  }

  try {
    const parsed = await parseFile(candidate, { duration: true });
    const seconds = parsed.format.duration ?? 0;
    return formatDuration(seconds);
  } catch {
    return "00:00";
  }
}

export async function getTracks(): Promise<Track[]> {
  const tracksRoot = path.join(process.cwd(), "tracks");
  let entries: import("node:fs").Dirent[] = [];

  try {
    entries = await fs.readdir(tracksRoot, { withFileTypes: true });
  } catch {
    return [];
  }

  const folderEntries = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  const rawTracks = await Promise.all(
    folderEntries.map(async (folderName): Promise<Track | null> => {
      const trackFolder = path.join(tracksRoot, folderName);
      const fileEntries = await fs.readdir(trackFolder, { withFileTypes: true });
      const audioFiles = fileEntries
        .filter((entry) => entry.isFile() && isAudioFile(entry.name))
        .map((entry) => entry.name);

      if (audioFiles.length === 0) {
        return null;
      }

      const meta = await readTrackMeta(trackFolder);
      const paths = resolveAudioPaths(trackFolder, audioFiles, meta);
      const thumbnailFilePath = resolveThumbnailInFolder(trackFolder, fileEntries, meta);
      const duration = await detectDuration(meta.duration, paths.fullFilePath, paths.previewFilePath);
      const defaultTitle = toTitle(folderName.replace(/[-_]/g, " "));
      return buildTrack(
        folderName,
        meta.title ?? defaultTitle,
        paths.previewFilePath,
        paths.fullFilePath,
        thumbnailFilePath,
        duration,
        meta,
      );
    }),
  );

  const rootAudioFiles = entries
    .filter((entry) => entry.isFile() && isAudioFile(entry.name))
    .map((entry) => ({
      fileName: entry.name,
      fullPath: path.join(tracksRoot, entry.name),
    }));

  const rootImageFiles = entries
    .filter((entry) => entry.isFile() && isImageFile(entry.name))
    .map((entry) => ({
      fileName: entry.name,
      fullPath: path.join(tracksRoot, entry.name),
      key: stripDuplicateSuffix(entry.name).toLowerCase(),
    }));

  const imageByKey = new Map<string, string>();
  for (const image of rootImageFiles) {
    if (!imageByKey.has(image.key)) {
      imageByKey.set(image.key, image.fullPath);
    }
  }

  const groups = new Map<string, RootAudioCandidate[]>();
  for (const entry of rootAudioFiles) {
    const groupKey = stripDuplicateSuffix(entry.fileName);
    const existing = groups.get(groupKey) ?? [];
    existing.push(entry);
    groups.set(groupKey, existing);
  }

  const slugCounts = new Map<string, number>();
  const rootTracks = await Promise.all(
    [...groups.entries()].map(async ([groupName, files]) => {
      const baseSlug = slugify(groupName) || "track";
      const currentCount = slugCounts.get(baseSlug) ?? 0;
      slugCounts.set(baseSlug, currentCount + 1);
      const slug = currentCount === 0 ? baseSlug : `${baseSlug}-${currentCount + 1}`;

      const { previewFilePath, fullFilePath } = pickPreviewAndFull(files);
      const thumbnailFilePath = imageByKey.get(groupName.toLowerCase()) ?? null;
      const duration = await detectDuration(undefined, fullFilePath, previewFilePath);
      return buildTrack(
        slug,
        groupName,
        previewFilePath,
        fullFilePath,
        thumbnailFilePath,
        duration,
      );
    }),
  );

  const allTracks = [...rawTracks.filter((track): track is Track => track !== null), ...rootTracks];
  return allTracks.sort((a, b) => a.title.localeCompare(b.title));
}

export async function getTrackBySlug(slug: string): Promise<Track | null> {
  const tracks = await getTracks();
  return tracks.find((track) => track.slug === slug) ?? null;
}

export function toPublicTrack(track: Track): PublicTrack {
  return {
    slug: track.slug,
    title: track.title,
    description: track.description,
    mood: track.mood,
    duration: track.duration,
    previewUrl: track.previewUrl,
    fullUrl: track.fullUrl,
    thumbnailUrl: track.thumbnailUrl,
  };
}
