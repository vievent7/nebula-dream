import { NextResponse } from "next/server";
import { z } from "zod";
import { sendPasswordResetEmail } from "@/lib/email";
import { hashResetToken, generateResetToken } from "@/lib/password-reset";
import { prisma } from "@/lib/prisma";
import { getPublicAppUrl } from "@/lib/public-url";

const schema = z.object({
  email: z.string().email().toLowerCase(),
});

export async function POST(request: Request) {
  try {
    const { email } = schema.parse(await request.json());
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({
        ok: true,
        message: "Si cet email existe, un lien de reinitialisation a ete genere.",
      });
    }

    const rawToken = generateResetToken();
    const tokenHash = hashResetToken(rawToken);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const appUrl = getPublicAppUrl();
    const resetUrl = `${appUrl}/reset-password?token=${rawToken}`;
    const mailResult = await sendPasswordResetEmail(user.email, resetUrl);

    if (!mailResult.sent) {
      const debugResetEnabled = process.env.SHOW_DEBUG_RESET_URL === "true";
      return NextResponse.json(
        {
          ok: false,
          message: "Service email indisponible temporairement. Merci de reessayer.",
          ...(debugResetEnabled ? { resetUrl } : {}),
        },
        { status: 503 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Si cet email existe, un lien de reinitialisation vient d'etre envoye.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("SMTP")) {
      return NextResponse.json(
        { error: "Service email indisponible temporairement. Verifie la configuration SMTP." },
        { status: 503 },
      );
    }
    if (message.includes("APP_URL")) {
      return NextResponse.json(
        { error: "Service email indisponible: APP_URL non configure." },
        { status: 500 },
      );
    }
    return NextResponse.json(
      { error: "Service email indisponible temporairement. Merci de reessayer." },
      { status: 503 },
    );
  }
}
