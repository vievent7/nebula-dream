"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={logout}
      className="rounded-lg border border-white/20 px-3 py-2 text-sm text-zinc-200 hover:bg-white/10"
    >
      Se deconnecter
    </button>
  );
}
