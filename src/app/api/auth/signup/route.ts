import { NextResponse } from "next/server";
import { z } from "zod";
import { UserRole } from "@/generated/prisma/enums";
import {
  applySessionCookie,
  createSessionCookie,
  hashPassword,
  isAdminEmail,
} from "@/lib/auth";
import { sendAccountCreatedEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

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
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        role: isAdminEmail(data.email) ? UserRole.ADMIN : UserRole.USER,
      },
      select: { id: true, email: true },
    });

    const token = await createSessionCookie(user.id, user.email);
    const response = NextResponse.json({ ok: true });
    applySessionCookie(response, token);
    try {
      await sendAccountCreatedEmail(user.email);
    } catch {
      // Ne bloque jamais l'inscription sur un incident email.
    }
    return response;
  } catch {
    return NextResponse.json({ error: "Donnees invalides." }, { status: 400 });
  }
}
