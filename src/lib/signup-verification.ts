import crypto from "node:crypto";

export function generateSignupVerificationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashSignupVerificationToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
