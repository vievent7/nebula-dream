import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { upsertPaidOrderFromCheckoutSession } from "@/lib/stripe-orders";
import { getStripe } from "@/lib/stripe";

type SuccessPageProps = {
  searchParams: Promise<{ session_id?: string }>;
};

export default async function SuccessPage({ searchParams }: SuccessPageProps) {
  const params = await searchParams;
  const sessionId = params.session_id;
  const user = await getCurrentUser();

  if (user && sessionId) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(sessionId);
      if (session.metadata?.userId === user.id) {
        await upsertPaidOrderFromCheckoutSession(session);
      }
    } catch {
      // ignore sync errors and keep success page available
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-4 text-center">
      <h1 className="text-3xl font-bold text-white">Paiement confirme</h1>
      <p className="mt-3 text-zinc-300">
        Merci pour ton achat. Tes tracks sont disponibles dans ton compte.
      </p>
      <div className="mt-6 flex gap-3">
        <Link
          href="/compte"
          className="rounded-lg bg-white px-4 py-2 font-semibold text-[#06111d]"
        >
          Voir mes achats
        </Link>
        <Link href="/" className="rounded-lg border border-white/20 px-4 py-2 text-zinc-100">
          Retour accueil
        </Link>
      </div>
    </main>
  );
}
