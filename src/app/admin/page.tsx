import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminUsersTable } from "@/components/admin-users-table";
import { getCurrentUser } from "@/lib/auth";
import { formatCad } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    redirect("/");
  }

  const orders = await prisma.order.findMany({
    include: {
      user: { select: { email: true } },
      items: true,
    },
    orderBy: { createdAt: "desc" },
  });
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: { select: { orders: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  const userRows = users.map((item) => ({
    id: item.id,
    name: item.name,
    email: item.email,
    role: item.role,
    createdAt: item.createdAt.toISOString(),
    orderCount: item._count.orders,
  }));

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Admin • Commandes</h1>
        <Link href="/" className="rounded-lg border border-white/20 px-3 py-2 text-sm text-zinc-100">
          Retour site
        </Link>
      </header>

      <div className="overflow-x-auto rounded-2xl border border-white/15 bg-[#101a2a]/90">
        <table className="min-w-full text-sm text-zinc-200">
          <thead className="bg-black/30 text-xs uppercase tracking-[0.2em] text-zinc-300">
            <tr>
              <th className="px-4 py-3 text-left">Client</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Produits</th>
              <th className="px-4 py-3 text-left">Total</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Statut</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-t border-white/10 align-top">
                <td className="px-4 py-3">{order.user.email.split("@")[0]}</td>
                <td className="px-4 py-3">{order.user.email}</td>
                <td className="px-4 py-3">
                  <ul className="space-y-1">
                    {order.items.map((item) => (
                      <li key={item.id}>
                        {item.trackTitle} ({formatCad(item.unitPriceCents)})
                      </li>
                    ))}
                  </ul>
                </td>
                <td className="px-4 py-3">${(order.totalCents / 100).toFixed(2)}</td>
                <td className="px-4 py-3">{new Date(order.createdAt).toLocaleString("fr-FR")}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full border border-emerald-300/30 bg-emerald-300/15 px-2 py-1 text-xs text-emerald-100">
                    {order.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AdminUsersTable users={userRows} currentAdminId={user.id} />
    </main>
  );
}
