import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 text-zinc-100">
      <Link href="/" className="mb-6 inline-block text-sm text-cyan-200 underline">
        Retour a l&apos;accueil
      </Link>
      <h1 className="text-2xl font-semibold">Conditions d&apos;utilisation</h1>
      <p className="mt-4 text-sm text-zinc-300">
        L&apos;utilisation du site implique l&apos;acceptation des presentes conditions. Les contenus audio
        restent soumis aux droits de propriete de Nebula Dream.
      </p>

      <section className="mt-8 space-y-4 text-sm text-zinc-300">
        <h2 className="text-xl font-semibold text-zinc-100">Licence d&apos;utilisation</h2>

        <p>
          Après achat, l’utilisateur est libre d’utiliser les fichiers audio de Nebula Dream pour
          un usage personnel ou dans ses propres projets (vidéos, relaxation, contenu créatif).
        </p>

        <div className="space-y-2">
          <p>Cependant, il est interdit de :</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>revendre les fichiers audio tels quels</li>
            <li>les redistribuer gratuitement</li>
            <li>les publier comme étant sa propre création musicale</li>
          </ul>
        </div>

        <p>Les droits d’auteur restent la propriété de Nebula Dream.</p>

        <p>
          La musique est créée pour accompagner chacun dans son univers, tout en respectant le
          travail de création.
        </p>
      </section>
    </main>
  );
}
