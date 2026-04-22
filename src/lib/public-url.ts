function sanitizeUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

function isLocalhostHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

export function getPublicAppUrl(): string {
  const configured =
    process.env.APP_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL;

  if (!configured) {
    throw new Error("APP_URL manquant. Configure un domaine public (ex: https://nebula-dream.com).");
  }

  const normalized =
    configured.startsWith("http://") || configured.startsWith("https://")
      ? configured
      : `https://${configured}`;
  const parsed = new URL(normalized);

  if (process.env.NODE_ENV === "production" && isLocalhostHost(parsed.hostname)) {
    throw new Error("APP_URL invalide en production: localhost interdit pour les liens email.");
  }

  return sanitizeUrl(parsed.toString());
}

