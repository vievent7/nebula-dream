"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type State = "loading" | "success" | "error";

type VerifyEmailClientProps = {
  token: string | null;
};

export function VerifyEmailClient({ token }: VerifyEmailClientProps) {
  const [state, setState] = useState<State>(token ? "loading" : "error");
  const [message, setMessage] = useState(
    token ? "Verification de ton email en cours..." : "Lien invalide: token manquant.",
  );

  useEffect(() => {
    if (!token) {
      return;
    }

    let active = true;
    const run = async () => {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = (await res.json()) as { error?: string; message?: string };
        if (!active) return;

        if (!res.ok) {
          setState("error");
          setMessage(data.error ?? "Impossible de verifier cet email.");
          return;
        }

        setState("success");
        setMessage(data.message ?? "Email verifie avec succes.");
      } catch {
        if (!active) return;
        setState("error");
        setMessage("Erreur reseau. Merci de reessayer.");
      }
    };

    void run();
    return () => {
      active = false;
    };
  }, [token]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-10">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-white/20 bg-[#161d2b]/80 p-6 backdrop-blur">
        <h1 className="text-2xl font-semibold text-white">Verification d&apos;email</h1>
        <p className="mt-3 text-sm text-zinc-200">{message}</p>

        {state === "success" && (
          <div className="mt-4">
            <Link href="/" className="text-cyan-300 underline">
              Continuer vers l&apos;accueil
            </Link>
          </div>
        )}

        {state === "error" && (
          <div className="mt-4">
            <Link href="/signup" className="text-cyan-300 underline">
              Retour a l&apos;inscription
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
