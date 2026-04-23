import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { UserRole } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "nebula_dream_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

type SessionPayload = {
  sub: string;
  email: string;
};

function getSecret(): Uint8Array {
  const fallback = "dev-only-change-me";
  const secret = process.env.AUTH_SECRET ?? fallback;
  return new TextEncoder().encode(secret);
}

export function isAdminEmail(email: string): boolean {
  const configured = process.env.ADMIN_EMAILS ?? "vievent7@hotmail.com";
  const list = configured
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.trim().toLowerCase());
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecret());
}

async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (typeof payload.sub !== "string" || typeof payload.email !== "string") {
      return null;
    }
    return {
      sub: payload.sub,
      email: payload.email,
    };
  } catch {
    return null;
  }
}

export async function createSessionCookie(userId: string, email: string): Promise<string> {
  return signSession({ sub: userId, email });
}

export function applySessionCookie(response: Response, token: string): void {
  const nextResponse = response as Response & {
    cookies: { set: (name: string, value: string, options: Record<string, unknown>) => void };
  };
  nextResponse.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearSessionCookie(response: Response): void {
  const nextResponse = response as Response & {
    cookies: { set: (name: string, value: string, options: Record<string, unknown>) => void };
  };
  nextResponse.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const payload = await verifySession(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  if (!user) return null;
  if (isAdminEmail(user.email) && user.role !== UserRole.ADMIN) {
    const promoted = await prisma.user.update({
      where: { id: user.id },
      data: { role: UserRole.ADMIN },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    return promoted;
  }

  return user;
}

export async function requireUser() {
  return getCurrentUser();
}
