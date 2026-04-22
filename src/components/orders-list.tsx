"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type OrderItem = {
  trackSlug: string;
  trackTitle: string;
};

type OrderRow = {
  id: string;
  createdAt: string;
  totalCents: number;
  currency: string;
  items: OrderItem[];
};

type OrdersListProps = {
  orders: OrderRow[];
};

function formatMoney(totalCents: number, currency: string) {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(totalCents / 100);
}

export function OrdersList({ orders }: OrdersListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const removeOrder = async (orderId: string) => {
    const ok = window.confirm("Supprimer cette commande de ton compte ?");
    if (!ok) return;

    setDeletingId(orderId);
    const response = await fetch(`/api/orders/${orderId}`, { method: "DELETE" });
    setDeletingId(null);
    if (!response.ok) return;
    router.refresh();
  };

  if (orders.length === 0) {
    return <p className="mt-3 text-zinc-300">Aucune commande pour le moment.</p>;
  }

  return (
    <ul className="mt-4 space-y-3">
      {orders.map((order) => (
        <li
          key={order.id}
          className="rounded-lg border border-white/15 bg-black/20 px-4 py-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-medium text-white">Commande {order.id.slice(0, 8)}</p>
              <p className="text-xs text-zinc-400">
                {new Date(order.createdAt).toLocaleString("fr-CA")} •{" "}
                {formatMoney(order.totalCents, order.currency)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => removeOrder(order.id)}
              disabled={deletingId === order.id}
              className="rounded-lg border border-rose-300/40 bg-rose-300/10 px-3 py-2 text-xs font-semibold text-rose-200 transition hover:bg-rose-300/20 disabled:opacity-50"
            >
              {deletingId === order.id ? "Suppression..." : "Supprimer"}
            </button>
          </div>
          <p className="mt-2 text-xs text-zinc-300">
            {order.items.map((item) => item.trackTitle).join(" • ")}
          </p>
        </li>
      ))}
    </ul>
  );
}
