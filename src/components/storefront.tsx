"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AudioPlayer } from "@/components/audio-player";
import { computeOptimizedPrice, formatUsd } from "@/lib/pricing";
import type { PublicTrack } from "@/lib/tracks";

type StorefrontProps = {
  tracks: PublicTrack[];
  ownedSlugs: string[];
  isLoggedIn: boolean;
};

export function Storefront({ tracks, ownedSlugs, isLoggedIn }: StorefrontProps) {
  const router = useRouter();
  const [cart, setCart] = useState<string[]>([]);
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [showAllTracks, setShowAllTracks] = useState(false);
  const ownedSet = useMemo(() => new Set(ownedSlugs), [ownedSlugs]);
  const cartSet = useMemo(() => new Set(cart), [cart]);
  const initialVisibleCount = Math.max(1, Math.ceil(tracks.length / 2));
  const visibleTracks = showAllTracks ? tracks : tracks.slice(0, initialVisibleCount);

  const selectedTracks = useMemo(
    () => tracks.filter((track) => cartSet.has(track.slug)),
    [tracks, cartSet],
  );
  const pricing = computeOptimizedPrice(selectedTracks.length);

  const toggleTrackInCart = (slug: string) => {
    setCart((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
  };

  const checkout = async () => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    if (selectedTracks.length === 0) return;

    setLoadingCheckout(true);
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackSlugs: selectedTracks.map((track) => track.slug) }),
    });
    setLoadingCheckout(false);

    if (!res.ok) return;

    const data = (await res.json()) as { url?: string };
    if (data.url) {
      window.location.href = data.url;
    }
  };

  return (
    <section className="fade-in grid gap-6 lg:grid-cols-[1fr_350px]">
      <div className="space-y-5">
        {visibleTracks.map((track) => {
          const isOwned = ownedSet.has(track.slug);
          const inCart = cartSet.has(track.slug);
          return (
            <article
              key={track.slug}
              className="track-card group flex flex-col gap-2.5 rounded-2xl border border-white/20 bg-[#171725]/68 p-3.5 backdrop-blur-md transition duration-300 hover:scale-[1.01] hover:border-cyan-200/45 hover:shadow-[0_0_28px_rgba(56,189,248,0.24)] md:flex-row md:p-3.5"
            >
              <div className="w-full md:w-32 md:shrink-0">
                <div className="relative aspect-[5/4] overflow-hidden rounded-xl border border-white/15 md:aspect-square">
                  <Image
                    src={track.thumbnailUrl ?? "/assets/default-track-cover.png"}
                    alt={`Miniature de ${track.title}`}
                    fill
                    className="object-cover transition duration-300 group-hover:scale-[1.03]"
                    sizes="(max-width: 768px) 100vw, 160px"
                  />
                </div>
                <p className="mt-1.5 text-center text-sm font-semibold tracking-[0.16em] text-cyan-200">
                  {isOwned ? "DEJA ACHETEE" : "$1.99"}
                </p>
                <button
                  type="button"
                  disabled={isOwned}
                  onClick={() => toggleTrackInCart(track.slug)}
                  className="mt-2 w-full rounded-lg bg-cyan-300 px-3 py-2 text-xs font-semibold text-[#04101c] transition hover:scale-[1.02] hover:brightness-110 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
                >
                  {isOwned ? "Possedee" : inCart ? "Retirer" : "Ajouter"}
                </button>
              </div>

              <div className="flex flex-1 flex-col justify-center text-center">
                <h3 className="text-xl font-semibold text-white">{track.title}</h3>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-cyan-200/80">
                  Duree: {track.duration} • Ambiance: {track.mood}
                </p>
                <p className="mt-1.5 text-sm text-zinc-300">
                  Ideal pour: sommeil • relaxation • concentration
                </p>

                <div className="mt-2.5 grid gap-2">
                  {track.previewUrl && (
                    <AudioPlayer src={track.previewUrl} label="Preview" maxSeconds={30} />
                  )}

                  {isOwned && track.fullUrl && (
                    <AudioPlayer src={track.fullUrl} label="Ecoute complete" />
                  )}
                </div>

              </div>
            </article>
          );
        })}

        {tracks.length > initialVisibleCount && (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowAllTracks((prev) => !prev)}
              className="rounded-lg border border-cyan-200/35 bg-cyan-200/10 px-4 py-2 text-sm text-cyan-100 transition hover:scale-[1.02] hover:bg-cyan-200/20"
            >
              {showAllTracks ? "Afficher moins de tracks" : "Afficher plus de tracks"}
            </button>
          </div>
        )}
      </div>

      <aside className="fade-in h-fit rounded-2xl border border-cyan-200/30 bg-[#081223]/95 p-6 shadow-[0_0_36px_rgba(56,189,248,0.18)] lg:sticky lg:top-5">
        <h2 className="text-2xl font-semibold text-white">Panier</h2>
        <p className="mt-2 text-sm text-zinc-300">{selectedTracks.length} track(s)</p>
        <div className="mt-4 rounded-xl border border-white/15 bg-black/30 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-400">Total</p>
          <p className="mt-1 text-4xl font-bold text-cyan-100">{formatUsd(pricing.totalCents)}</p>
          <p className="mt-2 text-xs text-zinc-400">
            Packs: {pricing.packs10}x10, {pricing.packs5}x5, {pricing.singles}x1
          </p>
          <div className="mt-3 space-y-1 text-xs text-zinc-300">
            <p>1 track = $1.99</p>
            <p>5 tracks = $7.99</p>
            <p>10 tracks = $9.99</p>
          </div>
        </div>

        <ul className="mt-4 space-y-1 text-sm text-zinc-200">
          <li>✔ Telechargement immediat</li>
          <li>✔ Acces illimite</li>
          <li>✔ Paiement securise</li>
        </ul>

        <button
          type="button"
          onClick={checkout}
          disabled={loadingCheckout || selectedTracks.length === 0}
          className="mt-5 w-full rounded-xl bg-gradient-to-r from-cyan-300 to-blue-300 px-5 py-4 text-lg font-bold text-[#071420] shadow-[0_10px_26px_rgba(45,212,191,0.35)] transition hover:scale-[1.02] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loadingCheckout ? "Redirection..." : "Payer"}
        </button>
      </aside>
    </section>
  );
}
