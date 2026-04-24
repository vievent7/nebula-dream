import { NextResponse } from "next/server";
import { z } from "zod";
import {
  applySessionCookie,
  createSessionCookie,
  verifyPassword,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRequestIp } from "@/lib/request-ip";

const schema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const ip = getRequestIp(request);
  const { allowed, retryAfterSeconds } = checkRateLimit(`auth:login:${ip}`, {
    windowMs: 10 * 60 * 1000,
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
    const data = schema.parse(await request.json());
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      return NextResponse.json({ error: "Identifiants invalides." }, { status: 401 });
    }

    const ok = await verifyPassword(data.password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Identifiants invalides." }, { status: 401 });
    }

    const token = await createSessionCookie(user.id, user.email);
    const response = NextResponse.json({ ok: true });
    applySessionCookie(response, token);
    return response;
  } catch {
    return NextResponse.json({ error: "Donnees invalides." }, { status: 400 });
  }
}
