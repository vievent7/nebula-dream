import { NextResponse } from "next/server";
import { z } from "zod";
import { UserRole } from "@/generated/prisma/enums";
import { applySessionCookie, createSessionCookie, isAdminEmail } from "@/lib/auth";
import { sendAccountCreatedEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRequestIp } from "@/lib/request-ip";
import { hashSignupVerificationToken } from "@/lib/signup-verification";

const schema = z.object({
  token: z.string().min(32),
});

export async function POST(request: Request) {
  const ip = getRequestIp(request);
  const { allowed, retryAfterSeconds } = checkRateLimit(`auth:verify-email:${ip}`, {
    windowMs: 15 * 60 * 1000,
    max: 10,
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

  try {
    const { token } = schema.parse(await request.json());
    const tokenHash = hashSignupVerificationToken(token);

    const pending = await prisma.signupVerificationToken.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        displayName: true,
        email: true,
        passwordHash: true,
        expiresAt: true,
        usedAt: true,
      },
    });

    if (!pending || pending.usedAt || pending.expiresAt <= new Date()) {
      return NextResponse.json(
        { error: "Lien de verification invalide ou expire." },
        { status: 400 },
      );
    }

    const user = await prisma.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({
        where: { email: pending.email },
        select: { id: true, email: true },
      });

      const activeUser =
        existing ??
        (await tx.user.create({
          data: {
            name: pending.displayName,
            email: pending.email,
            passwordHash: pending.passwordHash,
            role: isAdminEmail(pending.email) ? UserRole.ADMIN : UserRole.USER,
          },
          select: { id: true, email: true },
        }));

      await tx.signupVerificationToken.update({
        where: { id: pending.id },
        data: { usedAt: new Date() },
      });
      await tx.signupVerificationToken.deleteMany({
        where: { email: pending.email, usedAt: null },
      });

      return activeUser;
    });

    const sessionToken = await createSessionCookie(user.id, user.email);
    const response = NextResponse.json({
      ok: true,
      message: "Email verifie. Ton compte est maintenant actif.",
    });
    applySessionCookie(response, sessionToken);

    try {
      await sendAccountCreatedEmail(user.email);
    } catch {
      // Ne bloque jamais la verification sur un incident email.
    }

    return response;
  } catch {
    return NextResponse.json({ error: "Donnees invalides." }, { status: 400 });
  }
}
