"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type PurchasedTrack = {
  title: string;
  slug: string;
};

type PurchasedTracksListProps = {
  items: PurchasedTrack[];
};

export function PurchasedTracksList({ items }: PurchasedTracksListProps) {
  const router = useRouter();
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);

  const removeTrack = async (slug: string) => {
    const ok = window.confirm("Supprimer cette track de tes commandes ?");
    if (!ok) return;

    setDeletingSlug(slug);
    const response = await fetch(`/api/purchases/${slug}`, { method: "DELETE" });
    setDeletingSlug(null);
    if (!response.ok) return;
    router.refresh();
  };

  return (
    <ul className="mt-4 space-y-3">
      {items.map((item) => (
        <li
          key={item.slug}
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/15 bg-black/20 px-4 py-3"
        >
          <div>
            <p className="font-medium text-white">{item.title}</p>
            <p className="text-xs text-zinc-400">{item.slug}</p>
          </div>
          <div className="flex gap-2">
            <a
              href={`/api/audio/${item.slug}/full`}
              className="rounded-lg border border-white/20 px-3 py-2 text-sm hover:bg-white/10"
            >
              Ecouter
            </a>
            <a
              href={`/api/download/${item.slug}`}
              className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-[#06111d]"
            >
              Telecharger
            </a>
            <button
              type="button"
              onClick={() => removeTrack(item.slug)}
              disabled={deletingSlug === item.slug}
              className="rounded-lg border border-rose-300/40 bg-rose-300/10 px-3 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-300/20 disabled:opacity-50"
            >
              {deletingSlug === item.slug ? "Suppression..." : "Supprimer"}
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
