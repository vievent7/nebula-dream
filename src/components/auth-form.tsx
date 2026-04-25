"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type AuthFormProps = {
  mode: "login" | "signup";
};

function getInboxUrl(email: string) {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return null;

  if (domain === "gmail.com" || domain === "googlemail.com") return "https://mail.google.com/";
  if (["outlook.com", "hotmail.com", "live.com", "msn.com"].includes(domain)) {
    return "https://outlook.live.com/mail/0/";
  }
  if (domain.startsWith("yahoo.")) return "https://mail.yahoo.com/";
  if (["icloud.com", "me.com", "mac.com"].includes(domain)) return "https://www.icloud.com/mail";
  if (domain === "proton.me" || domain === "protonmail.com") return "https://mail.proton.me/";
  return null;
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/signup";

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (mode === "signup" && password !== passwordConfirm) {
      setError("La confirmation du mot de passe ne correspond pas.");
      return;
    }

    setLoading(true);
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body:
        mode === "signup"
          ? JSON.stringify({ name, email, password, passwordConfirm })
          : JSON.stringify({ email, password }),
    });

    setLoading(false);
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? "Erreur.");
      return;
    }

    if (mode === "signup") {
      const data = (await res.json()) as { message?: string };
      const normalizedEmail = email.trim().toLowerCase();
      setMessage(
        data.message ??
          "Inscription en attente: verifie ton email (et tes spams) puis clique sur le lien de confirmation.",
      );
      setPendingEmail(normalizedEmail);
      setName("");
      setPassword("");
      setPasswordConfirm("");
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto w-full max-w-md space-y-4 rounded-2xl border border-white/20 bg-[#161d2b]/80 p-6 backdrop-blur"
    >
      <h1 className="text-2xl font-semibold text-white">
        {mode === "login" ? "Connexion" : "Inscription"}
      </h1>
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
      {mode === "signup" && (
        <label className="block text-sm text-zinc-200">
          Nom
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            type="text"
            required
            minLength={2}
            className="mt-1 w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-white"
          />
        </label>
      )}
      <label className="block text-sm text-zinc-200">
        Mot de passe
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
      {mode === "signup" && (
        <label className="block text-sm text-zinc-200">
          Confirmer le mot de passe
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
      )}
      {error && <p className="text-sm text-rose-300">{error}</p>}
      {message && <p className="text-sm text-cyan-200">{message}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-cyan-300 px-4 py-2 font-semibold text-[#031018] disabled:opacity-60"
      >
        {loading ? "Patiente..." : mode === "login" ? "Se connecter" : "Creer un compte"}
      </button>
      <p className="text-sm text-zinc-300">
        {mode === "login" ? "Pas encore de compte ?" : "Deja inscrit ?"}{" "}
        <Link
          href={mode === "login" ? "/signup" : "/login"}
          className="text-cyan-300 underline"
        >
          {mode === "login" ? "Inscription" : "Connexion"}
        </Link>
      </p>
      {mode === "login" && (
        <p className="text-sm text-zinc-300">
          <Link href="/forgot-password" className="text-cyan-300 underline">
            Mot de passe oublie ?
          </Link>
        </p>
      )}
      {mode === "signup" && message && pendingEmail && (
        <div className="rounded-lg border border-cyan-200/20 bg-cyan-900/10 p-3 text-sm text-cyan-100">
          <p className="mb-2">Clique sur le lien dans ton email pour confirmer ton inscription.</p>
          {getInboxUrl(pendingEmail) ? (
            <a
              href={getInboxUrl(pendingEmail) ?? "#"}
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-lg border border-cyan-300/40 px-3 py-1.5 text-cyan-100 hover:bg-cyan-300/10"
            >
              Confirmer l&apos;inscription (ouvrir ma boite mail)
            </a>
          ) : (
            <p className="text-cyan-200/90">Ouvre ta boite mail et verifie aussi le dossier spam.</p>
          )}
        </div>
      )}
    </form>
  );
}
