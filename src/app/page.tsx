import Link from "next/link";
import Image from "next/image";
import type { CSSProperties } from "react";
import { HeroScrollButton } from "@/components/hero-scroll-button";
import { LogoutButton } from "@/components/logout-button";
import { Storefront } from "@/components/storefront";
import { getCurrentUser } from "@/lib/auth";
import { getHeroCards } from "@/lib/hero-cards";
import { getPurchasedTrackSlugs } from "@/lib/orders";
import { getTracks, toPublicTrack } from "@/lib/tracks";

export default async function HomePage() {
  const [user, tracks, heroCards] = await Promise.all([getCurrentUser(), getTracks(), getHeroCards()]);
  const ownedSlugs = user ? await getPurchasedTrackSlugs(user.id) : [];
  const publicTracks = tracks.map(toPublicTrack);
  const desktopHeroCardPositions: Record<number, CSSProperties> = {
    1: { width: "250px", height: "170px", left: "5%", top: "10%", transform: "rotate(-6deg)" },
    2: { width: "195px", height: "140px", left: "14%", top: "66%", transform: "rotate(6deg)" },
    3: { width: "250px", height: "170px", left: "40%", top: "10%", transform: "rotate(-5deg)" },
    4: { width: "195px", height: "140px", left: "66%", top: "66%", transform: "rotate(5deg)" },
    5: { width: "250px", height: "170px", left: "74%", top: "10%", transform: "rotate(-5deg)" },
    6: { width: "195px", height: "140px", left: "76%", top: "67%", transform: "rotate(4deg)" },
  };
  const mobileHeroCards = heroCards.slice(0, 2);

  return (
    <div className="mx-auto min-h-screen w-full max-w-7xl px-4 py-6 md:px-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/80">Nebula Dream</p>
          <h1 className="text-3xl font-bold text-white md:text-4xl">Musiques Relaxantes</h1>
        </div>
        <nav className="flex items-center gap-2">
          {user ? (
            <>
              <Link
                href="/compte"
                className="rounded-lg border border-white/20 px-3 py-2 text-sm hover:bg-white/10"
              >
                Mon compte
              </Link>
              {user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="rounded-lg border border-cyan-200/40 bg-cyan-200/10 px-3 py-2 text-sm text-cyan-100 hover:bg-cyan-200/20"
                >
                  Admin
                </Link>
              )}
              <LogoutButton />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg border border-white/20 px-3 py-2 text-sm hover:bg-white/10"
              >
                Connexion
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-[#071420]"
              >
                Inscription
              </Link>
            </>
          )}
        </nav>
      </header>

      <section className="nebula-hero fade-in mb-8 overflow-hidden rounded-3xl border border-white/20 bg-black/25">
        <div className="relative h-52 w-full md:h-64">
          <Image
            src="/assets/banner-top.png"
            alt="Ambiance relaxante"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-[#040912]/70" />
          <p className="hero-banner-copy absolute bottom-4 left-1/2 w-[90%] -translate-x-1/2 text-center md:bottom-6">
            Respire. Ralentis. Laisse la nuit, la nature et les textures cosmiques guider ton
            calme.
          </p>
        </div>

        <div className="relative min-h-[40vh] px-6 py-8 text-center md:min-h-[46vh]">
          <div className="pointer-events-none absolute inset-0 hidden md:block">
            {heroCards.map((card) => {
              const positionStyle = desktopHeroCardPositions[card.slot];
              if (!positionStyle) {
                return null;
              }

              return (
                <div
                  key={`${card.src}-${card.slot}`}
                  className="hero-card absolute overflow-hidden rounded-2xl border border-cyan-100/35 shadow-[0_18px_55px_rgba(0,0,0,0.52)]"
                  style={positionStyle}
                >
                  <Image src={card.src} alt="" fill className="object-cover" sizes="250px" />
                </div>
              );
            })}
          </div>

          <div className="pointer-events-none absolute inset-0 md:hidden">
            {mobileHeroCards.map((card, index) => (
              <div
                key={`mobile-${card.src}-${index}`}
                className="hero-card absolute overflow-hidden rounded-full border border-cyan-100/35 opacity-40"
                style={{
                  width: "145px",
                  height: "145px",
                  left: index === 0 ? "-4%" : "66%",
                  top: index === 0 ? "69%" : "71%",
                }}
              >
                <Image src={card.src} alt="" fill className="object-cover" sizes="145px" />
              </div>
            ))}
          </div>

          <div className="relative z-10 flex min-h-[40vh] flex-col items-center justify-center md:min-h-[46vh]">
            <h2 className="hero-copy max-w-2xl text-center text-3xl text-white md:text-5xl">
              Entrez dans un univers calme et apaisant
            </h2>
            <p className="mt-3 max-w-xl text-center text-sm text-zinc-200 md:text-base">
              Ecoute immersive, ambiance cosmique et acces instantane a tes musiques relaxantes.
            </p>
            <div className="mt-6">
              <HeroScrollButton />
            </div>
          </div>
        </div>
      </section>

      <div
        id="tracks"
        className="nebula-catalog tracks-hidden rounded-3xl border border-white/10 p-4 scroll-mt-20"
      >
        <Storefront tracks={publicTracks} ownedSlugs={ownedSlugs} isLoggedIn={Boolean(user)} />
      </div>
    </div>
  );
}
