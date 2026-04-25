"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

export function ResetPasswordForm() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password, passwordConfirm }),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    setLoading(false);
    setMessage(data.ok ? "Mot de passe réinitialisé. Tu peux te connecter." : data.error ?? "Erreur");
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-10">
      <Link href="/login" className="mb-6 inline-block text-sm text-cyan-200 underline">
        Retour connexion
      </Link>
      <form
        onSubmit={submit}
        className="mx-auto w-full max-w-md space-y-4 rounded-2xl border border-white/20 bg-[#161d2b]/80 p-6 backdrop-blur"
      >
        <h1 className="text-2xl font-semibold text-white">Réinitialiser le mot de passe</h1>
        <label className="block text-sm text-zinc-200">
          Nouveau mot de passe
          <div className="relative mt-1">
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 pr-11 text-white"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-zinc-300 hover:text-cyan-200"
              aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              title={showPassword ? "Masquer" : "Afficher"}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2">
                <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
          </div>
        </label>
        <label className="block text-sm text-zinc-200">
          Confirmation
          <div className="relative mt-1">
            <input
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              type={showPasswordConfirm ? "text" : "password"}
              required
              minLength={8}
              className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 pr-11 text-white"
            />
            <button
              type="button"
              onClick={() => setShowPasswordConfirm((value) => !value)}
              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-zinc-300 hover:text-cyan-200"
              aria-label={
                showPasswordConfirm
                  ? "Masquer la confirmation du mot de passe"
                  : "Afficher la confirmation du mot de passe"
              }
              title={showPasswordConfirm ? "Masquer" : "Afficher"}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-2">
                <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
          </div>
        </label>
        <button
          type="submit"
          disabled={loading || !token}
          className="w-full rounded-lg bg-cyan-300 px-4 py-2 font-semibold text-[#031018] disabled:opacity-60"
        >
          {loading ? "Mise à jour..." : "Valider"}
        </button>
        {message && <p className="text-sm text-zinc-200">{message}</p>}
      </form>
    </main>
  );
}
