import { NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword } from "@/lib/auth";
import { sendSignupVerificationEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { getPublicAppUrl } from "@/lib/public-url";
import {
  generateSignupVerificationToken,
  hashSignupVerificationToken,
} from "@/lib/signup-verification";

const schema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).max(128),
  passwordConfirm: z.string().min(8).max(128),
});

export async function POST(request: Request) {
  try {
    const data = schema.parse(await request.json());
    if (data.password !== data.passwordConfirm) {
      return NextResponse.json(
        { error: "La confirmation du mot de passe ne correspond pas." },
        { status: 400 },
      );
    }
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return NextResponse.json(
        { error: "Cet email est deja utilise." },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(data.password);
    const rawToken = generateSignupVerificationToken();
    const tokenHash = hashSignupVerificationToken(rawToken);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60);
    const appUrl = getPublicAppUrl();

    await prisma.signupVerificationToken.updateMany({
      where: { email: data.email, usedAt: null },
      data: { usedAt: new Date() },
    });

    await prisma.signupVerificationToken.create({
      data: {
        email: data.email,
        passwordHash,
        tokenHash,
        expiresAt,
      },
    });

    const verifyUrl = `${appUrl}/verify-email?token=${rawToken}`;
    const mailResult = await sendSignupVerificationEmail(data.email, verifyUrl);
    if (!mailResult.sent) {
      return NextResponse.json(
        { error: "Email de verification indisponible. Verifie la configuration SMTP." },
        { status: 503 },
      );
    }

    return NextResponse.json({
      ok: true,
      message:
        "Inscription presque terminee. Verifie ton email et clique sur le lien pour activer ton compte.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("APP_URL")) {
      return NextResponse.json(
        { error: "Inscription indisponible: APP_URL non configure." },
        { status: 500 },
      );
    }
    return NextResponse.json({ error: "Donnees invalides." }, { status: 400 });
  }
}
