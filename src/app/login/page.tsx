import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/");
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-10">
      <Link href="/" className="mb-6 inline-block text-sm text-cyan-200 underline">
        Retour a l&apos;accueil
      </Link>
      <AuthForm mode="login" />
    </main>
  );
}
