"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type AdminUser = {
  id: string;
  name: string | null;
  email: string;
  role: "ADMIN" | "USER";
  createdAt: string;
  orderCount: number;
};

type AdminUsersTableProps = {
  users: AdminUser[];
  currentAdminId: string;
};

export function AdminUsersTable({ users, currentAdminId }: AdminUsersTableProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const removeUser = async (user: AdminUser) => {
    const ok = window.confirm(`Supprimer le compte ${user.email} ?`);
    if (!ok) return;

    setError("");
    setDeletingId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Suppression impossible.");
        return;
      }
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="mt-8">
      <h2 className="mb-3 text-xl font-semibold text-white">Comptes utilisateurs</h2>
      {error && <p className="mb-3 text-sm text-rose-300">{error}</p>}
      <div className="overflow-x-auto rounded-2xl border border-white/15 bg-[#101a2a]/90">
        <table className="min-w-full text-sm text-zinc-200">
          <thead className="bg-black/30 text-xs uppercase tracking-[0.2em] text-zinc-300">
            <tr>
              <th className="px-4 py-3 text-left">Nom</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Commandes</th>
              <th className="px-4 py-3 text-left">Inscription</th>
              <th className="px-4 py-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const isSelf = user.id === currentAdminId;
              return (
                <tr key={user.id} className="border-t border-white/10 align-top">
                  <td className="px-4 py-3">{user.name ?? "-"}</td>
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3">{user.role}</td>
                  <td className="px-4 py-3">{user.orderCount}</td>
                  <td className="px-4 py-3">{new Date(user.createdAt).toLocaleString("fr-CA")}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={isSelf || deletingId === user.id}
                      onClick={() => removeUser(user)}
                      className="rounded-lg border border-rose-300/40 bg-rose-300/10 px-3 py-2 text-xs font-semibold text-rose-200 transition hover:bg-rose-300/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSelf
                        ? "Compte admin actif"
                        : deletingId === user.id
                          ? "Suppression..."
                          : "Supprimer"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
