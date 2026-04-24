import Link from "next/link";
import { redirect } from "next/navigation";
import { OrdersList } from "@/components/orders-list";
import { PurchasedTracksList } from "@/components/purchased-tracks-list";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncRecentPaidSessionsForUser } from "@/lib/stripe-orders";

export default async function ComptePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  await syncRecentPaidSessionsForUser(user.id);

  const orders = await prisma.order.findMany({
    where: { userId: user.id, status: "paid" },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
  const serializedOrders = orders.map((order) => ({
    id: order.id,
    createdAt: order.createdAt.toISOString(),
    totalCents: order.totalCents,
    currency: order.currency,
    items: order.items.map((item) => ({
      trackSlug: item.trackSlug,
      trackTitle: item.trackTitle,
    })),
  }));

  const uniqueItems = new Map<string, { title: string; slug: string }>();
  for (const order of orders) {
    for (const item of order.items) {
      if (!uniqueItems.has(item.trackSlug)) {
        uniqueItems.set(item.trackSlug, {
          title: item.trackTitle,
          slug: item.trackSlug,
        });
      }
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-4 py-10">
      <Link href="/" className="text-sm text-cyan-200 underline">
        Retour a l&apos;accueil
      </Link>

      <h1 className="mt-4 text-3xl font-bold text-white">Mon compte</h1>
      <p className="mt-2 text-zinc-300">{user.email}</p>

      <section className="mt-8 rounded-2xl border border-white/20 bg-[#121b2a]/80 p-6">
        <h2 className="text-xl font-semibold text-white">Tracks achetees</h2>
        {uniqueItems.size === 0 ? (
          <p className="mt-3 text-zinc-300">Aucun achat pour le moment.</p>
        ) : (
          <PurchasedTracksList items={[...uniqueItems.values()]} />
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-white/20 bg-[#121b2a]/80 p-6">
        <h2 className="text-xl font-semibold text-white">Mes commandes</h2>
        <OrdersList orders={serializedOrders} />
      </section>
    </main>
  );
}
