"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AudioPlayer } from "@/components/audio-player";
import { computeOptimizedPrice, formatCad } from "@/lib/pricing";
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
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
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

    setCheckoutError(null);
    setLoadingCheckout(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackSlugs: selectedTracks.map((track) => track.slug) }),
      });

      const data = (await res.json()) as { error?: string; url?: string };
      if (!res.ok) {
        setCheckoutError(data.error ?? "Le paiement est indisponible pour le moment.");
        return;
      }

      if (data.url) {
        window.location.href = data.url;
        return;
      }

      setCheckoutError("Lien de paiement introuvable.");
    } catch {
      setCheckoutError("Impossible de contacter le serveur de paiement.");
    } finally {
      setLoadingCheckout(false);
    }
  };

  return (
    <section className="fade-in grid grid-cols-[minmax(0,1fr)_132px] gap-2.5 md:gap-6 lg:grid-cols-[1fr_350px]">
      <div className="space-y-3 md:space-y-5">
        {visibleTracks.map((track) => {
          const isOwned = ownedSet.has(track.slug);
          const inCart = cartSet.has(track.slug);
          return (
            <article
              key={track.slug}
              className="track-card group flex gap-2 rounded-xl border border-white/20 bg-[#171725]/68 p-2 backdrop-blur-md transition duration-300 hover:scale-[1.01] hover:border-cyan-200/45 hover:shadow-[0_0_28px_rgba(56,189,248,0.24)] md:gap-3.5 md:rounded-2xl md:p-3.5"
            >
              <div className="w-20 shrink-0 md:w-32">
                <div className="relative aspect-square overflow-hidden rounded-lg border border-white/15 md:rounded-xl">
                  <Image
                    src={track.thumbnailUrl ?? "/assets/default-track-cover.png"}
                    alt={`Miniature de ${track.title}`}
                    fill
                    className="object-cover transition duration-300 group-hover:scale-[1.03]"
                    sizes="(max-width: 768px) 80px, 160px"
                  />
                </div>
                <p className="mt-1.5 text-center text-xs font-semibold tracking-[0.12em] text-cyan-200 md:text-sm md:tracking-[0.16em]">
                  {isOwned ? "DEJA ACHETEE" : formatCad(199)}
                </p>
                <button
                  type="button"
                  disabled={isOwned}
                  onClick={() => toggleTrackInCart(track.slug)}
                  className="mt-1.5 w-full rounded-lg bg-cyan-300 px-2 py-1.5 text-[11px] font-semibold text-[#04101c] transition hover:scale-[1.02] hover:brightness-110 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400 md:mt-2 md:px-3 md:py-2 md:text-xs"
                >
                  {isOwned ? "Possedee" : inCart ? "Retirer" : "Ajouter"}
                </button>
              </div>

              <div className="flex flex-1 flex-col justify-center text-center">
                <h3 className="text-sm font-semibold text-white md:text-xl">{track.title}</h3>
                <p className="mt-0.5 text-[10px] uppercase tracking-[0.15em] text-cyan-200/80 md:mt-1 md:text-xs md:tracking-[0.2em]">
                  Duree: {track.duration} | Ambiance: {track.mood}
                </p>
                <p className="mt-1 text-[11px] text-zinc-300 md:mt-1.5 md:text-sm">
                  Ideal pour: sommeil | relaxation | concentration
                </p>

                <div className="mt-2 grid gap-1.5 md:mt-2.5 md:gap-2">
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
          <div className="pt-0.5 md:pt-1">
            <button
              type="button"
              onClick={() => setShowAllTracks((prev) => !prev)}
              className="rounded-lg border border-cyan-200/35 bg-cyan-200/10 px-3 py-1.5 text-xs text-cyan-100 transition hover:scale-[1.02] hover:bg-cyan-200/20 md:px-4 md:py-2 md:text-sm"
            >
              {showAllTracks ? "Afficher moins de tracks" : "Afficher plus de tracks"}
            </button>
          </div>
        )}
      </div>

      <aside className="fade-in sticky top-2 h-fit self-start rounded-xl border border-cyan-200/30 bg-[#081223]/95 p-2.5 shadow-[0_0_36px_rgba(56,189,248,0.18)] md:top-4 md:rounded-2xl md:p-6 lg:top-5">
        <h2 className="text-sm font-semibold text-white md:text-2xl">Panier</h2>
        <p className="mt-1 text-[10px] text-zinc-300 md:mt-2 md:text-sm">{selectedTracks.length} track(s)</p>
        <div className="mt-3 rounded-xl border border-white/15 bg-black/30 p-3 md:mt-4 md:p-4">
          <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-400 md:text-xs md:tracking-[0.2em]">Sous-total (HT)</p>
          <p className="mt-1 text-lg font-bold text-cyan-100 md:text-4xl">{formatCad(pricing.totalCents)}</p>
          <p className="mt-1.5 text-[11px] text-zinc-400 md:mt-2 md:text-xs">
            Packs: {pricing.packs10}x10, {pricing.packs5}x5, {pricing.singles}x1
          </p>
          <p className="mt-2 text-[11px] text-cyan-100/85 md:text-xs">Taxes calculees a la caisse.</p>
          <div className="mt-2 space-y-0.5 text-[10px] text-zinc-300 md:mt-3 md:space-y-1 md:text-xs">
            <p>1 track = {formatCad(199)}</p>
            <p>5 tracks = {formatCad(799)}</p>
            <p>10 tracks = {formatCad(999)}</p>
          </div>
        </div>

        <ul className="mt-2.5 space-y-1 text-[10px] text-zinc-200 md:mt-4 md:text-sm">
          <li>Telechargement immediat</li>
          <li>Acces illimite</li>
          <li>Paiement securise</li>
        </ul>

        <button
          type="button"
          onClick={checkout}
          disabled={loadingCheckout || selectedTracks.length === 0}
          className="mt-3 w-full rounded-xl bg-gradient-to-r from-cyan-300 to-blue-300 px-2.5 py-2 text-xs font-bold text-[#071420] shadow-[0_10px_26px_rgba(45,212,191,0.35)] transition hover:scale-[1.02] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 md:mt-5 md:px-5 md:py-4 md:text-lg"
        >
          {loadingCheckout ? "Redirection..." : "Payer"}
        </button>
        {checkoutError && <p className="mt-2 text-xs text-rose-200">{checkoutError}</p>}
      </aside>
    </section>
  );
}
