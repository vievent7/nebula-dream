import Image from "next/image";
import Link from "next/link";
import { getFreePsalms } from "@/lib/free-psalms";

export const metadata = {
  title: "Psaumes en chanson – Accès libre | Nebula Dream",
};

export default async function PsaumesGratuitsPage() {
  const psalms = await getFreePsalms();

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-3 py-6 md:px-8 md:py-10">
      <section className="mb-5 rounded-2xl border border-white/15 bg-[#0b1120]/75 p-4 text-center backdrop-blur md:mb-8 md:rounded-3xl md:p-8">
        <h1 className="text-2xl font-bold text-white md:text-4xl">Psaumes en chanson – Accès libre</h1>
        <p className="mx-auto mt-2.5 max-w-3xl text-sm text-zinc-200 md:mt-4 md:text-base">
          Ces musiques sont offertes gratuitement, sans inscription, pour accompagner chacun dans
          son moment de paix.
        </p>
        <Link
          href="/"
          className="mt-4 inline-flex rounded-lg border border-cyan-200/35 bg-cyan-200/10 px-3 py-2 text-sm text-cyan-100 transition hover:bg-cyan-200/20 md:mt-5"
        >
          Retour à l&apos;accueil
        </Link>
      </section>

      {psalms.length === 0 ? (
        <div className="rounded-2xl border border-white/15 bg-black/25 p-5 text-center text-zinc-200">
          Aucun psaume detecte pour le moment. Ajoute simplement des fichiers audio dans{" "}
          <span className="font-semibold text-cyan-100">public/psaumes</span>.
        </div>
      ) : (
        <section className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {psalms.map((psalm) => (
            <article
              key={psalm.id}
              className="track-card flex h-full flex-col rounded-2xl border border-white/20 bg-[#171725]/68 p-3 backdrop-blur-md"
            >
              <div className="relative mb-3 aspect-square overflow-hidden rounded-xl border border-white/15">
                {psalm.imageUrl ? (
                  <Image
                    src={psalm.imageUrl}
                    alt={`Illustration pour ${psalm.title}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#0f1b2f] to-[#090f1d] text-sm tracking-[0.18em] text-cyan-100/80">
                    PSAUME
                  </div>
                )}
              </div>

              <h2 className="text-center text-lg font-semibold text-white">{psalm.title}</h2>
              <p className="mt-1 text-center text-xs text-zinc-400">{psalm.fileName}</p>

              <a
                href={psalm.audioUrl}
                download={psalm.fileName}
                className="mt-4 inline-flex items-center justify-center rounded-lg bg-cyan-300 px-4 py-2 text-sm font-semibold text-[#04101c] transition hover:scale-[1.02] hover:brightness-110"
              >
                Télécharger gratuitement
              </a>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
