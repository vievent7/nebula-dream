import { NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword } from "@/lib/auth";
import { hashResetToken } from "@/lib/password-reset";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  token: z.string().min(20),
  password: z.string().min(8).max(128),
  passwordConfirm: z.string().min(8).max(128),
});

export async function POST(request: Request) {
  try {
    const { token, password, passwordConfirm } = schema.parse(await request.json());
    if (password !== passwordConfirm) {
      return NextResponse.json(
        { error: "La confirmation du mot de passe ne correspond pas." },
        { status: 400 },
      );
    }

    const tokenHash = hashResetToken(token);
    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!resetRecord || resetRecord.usedAt || resetRecord.expiresAt < new Date()) {
      return NextResponse.json({ error: "Token invalide ou expiré." }, { status: 400 });
    }

    const newHash = await hashPassword(password);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash: newHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Données invalides." }, { status: 400 });
  }
}
