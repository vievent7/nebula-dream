import Link from "next/link";

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 text-zinc-100">
      <Link href="/" className="mb-6 inline-block text-sm text-cyan-200 underline">
        Retour a l&apos;accueil
      </Link>
      <h1 className="text-2xl font-semibold">Contact</h1>
      <p className="mt-4 text-sm text-zinc-300">
        Pour toute question: <a className="underline" href="mailto:vievent7@hotmail.com">vievent7@hotmail.com</a>
      </p>
    </main>
  );
}
