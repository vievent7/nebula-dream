import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRequestIp } from "@/lib/request-ip";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const ip = getRequestIp(_request);
  const { allowed, retryAfterSeconds } = checkRateLimit(`admin:delete-user:${ip}`, {
    windowMs: 10 * 60 * 1000,
    max: 20,
  });
  if (!allowed) {
    return NextResponse.json(
      { error: "Trop de tentatives. Reessaie plus tard." },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfterSeconds) },
      },
    );
  }

  const admin = await requireUser();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Acces interdit." }, { status: 403 });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "ID invalide." }, { status: 400 });
  }
  if (id === admin.id) {
    return NextResponse.json(
      { error: "Tu ne peux pas supprimer ton propre compte admin." },
      { status: 400 },
    );
  }

  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true },
  });
  if (!target) {
    return NextResponse.json({ error: "Compte introuvable." }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.signupVerificationToken.deleteMany({ where: { email: target.email } });
    await tx.user.delete({ where: { id: target.id } });
  });

  return NextResponse.json({ ok: true });
}
