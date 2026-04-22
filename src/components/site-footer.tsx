import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-white/10 bg-black/20 px-4 py-6 text-sm text-zinc-300">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap gap-4">
        <Link href="/legal/privacy" className="hover:text-cyan-200">
          Politique de confidentialité
        </Link>
        <Link href="/legal/terms" className="hover:text-cyan-200">
          Conditions d’utilisation
        </Link>
        <Link href="/legal/sales" className="hover:text-cyan-200">
          Conditions de vente
        </Link>
        <Link href="/contact" className="hover:text-cyan-200">
          Contact
        </Link>
      </div>
    </footer>
  );
}
