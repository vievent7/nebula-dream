import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<main className="p-10 text-zinc-200">Chargement...</main>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
