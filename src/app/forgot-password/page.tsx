"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setResetUrl("");

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = (await res.json()) as { message?: string; resetUrl?: string; error?: string };
    setLoading(false);
    setMessage(data.message ?? data.error ?? "Reponse recue.");
    if (data.resetUrl) {
      setResetUrl(data.resetUrl);
    }
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
        <h1 className="text-2xl font-semibold text-white">Mot de passe oublie</h1>
        <label className="block text-sm text-zinc-200">
          Email
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            className="mt-1 w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-white"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-cyan-300 px-4 py-2 font-semibold text-[#031018] disabled:opacity-60"
        >
          {loading ? "Generation..." : "Envoyer le lien"}
        </button>
        {message && <p className="text-sm text-zinc-200">{message}</p>}
        {resetUrl && (
          <p className="text-xs text-cyan-200">
            Lien direct:{" "}
            <a className="underline" href={resetUrl}>
              {resetUrl}
            </a>
          </p>
        )}
      </form>
    </main>
  );
}
