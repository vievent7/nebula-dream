"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type AuthFormProps = {
  mode: "login" | "signup";
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
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
      setMessage(
        data.message ??
          "Inscription en attente: verifie ton email puis clique sur le lien de confirmation.",
      );
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
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          required
          minLength={8}
          className="mt-1 w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-white"
        />
      </label>
      {mode === "signup" && (
        <label className="block text-sm text-zinc-200">
          Confirmer le mot de passe
          <input
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            type="password"
            required
            minLength={8}
            className="mt-1 w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-white"
          />
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
    </form>
  );
}
