import nodemailer from "nodemailer";
import { getPublicAppUrl } from "@/lib/public-url";

function getSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM?.trim() || `Nebula Dream <${user}>`;
  const secure = (process.env.SMTP_SECURE ?? "false").toLowerCase() === "true";
  const rejectUnauthorized =
    (process.env.SMTP_TLS_REJECT_UNAUTHORIZED ?? "true").toLowerCase() !== "false";

  if (!host || !Number.isFinite(port) || !user || !pass || !from) {
    return null;
  }

  return { host, port, user, pass, from, secure, rejectUnauthorized };
}

function getTransporter() {
  const config = getSmtpConfig();
  if (!config) {
    return null;
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    tls: {
      rejectUnauthorized: config.rejectUnauthorized,
    },
  });

  return { transporter, from: config.from };
}

function renderEmailShell(title: string, intro: string, bodyHtml: string) {
  const appUrl = getPublicAppUrl();
  const bannerUrl = `${appUrl}/assets/banner-top.png`;

  return `
    <div style="margin:0;padding:18px;background:#060d19;font-family:Arial,sans-serif;color:#eef4ff;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;border-collapse:collapse;">
        <tr>
          <td style="border:1px solid rgba(255,255,255,0.14);border-radius:16px;overflow:hidden;background:#0d1627;">
            <img src="${bannerUrl}" alt="Nebula Dream" style="display:block;width:100%;height:auto;max-height:190px;object-fit:cover;" />
            <div style="padding:20px 18px;">
              <h1 style="margin:0 0 10px;font-size:24px;line-height:1.2;">${title}</h1>
              <p style="margin:0 0 14px;color:#d4deef;">${intro}</p>
              ${bodyHtml}
              <p style="margin:18px 0 0;color:#9db0ca;font-size:12px;">
                Nebula Dream · Musiques relaxantes
              </p>
            </div>
          </td>
        </tr>
      </table>
    </div>
  `;
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const mail = getTransporter();
  if (!mail) {
    return { sent: false as const, reason: "smtp_not_configured" as const };
  }

  try {
    await mail.transporter.sendMail({
      from: mail.from,
      to,
      subject: "Nebula Dream - Reinitialisation du mot de passe",
      text: `Pour reinitialiser ton mot de passe, ouvre ce lien:\n${resetUrl}\n\nSi tu n'es pas a l'origine de cette demande, ignore cet email.`,
      html: renderEmailShell(
        "Reinitialisation du mot de passe",
        "Nous avons recu une demande de reinitialisation pour ton compte.",
        `
          <p style="margin:0 0 10px;">Clique sur ce bouton pour choisir un nouveau mot de passe :</p>
          <p style="margin:0 0 14px;">
            <a href="${resetUrl}" style="display:inline-block;background:#89e8ff;color:#042033;text-decoration:none;padding:10px 14px;border-radius:10px;font-weight:700;">
              Reinitialiser mon mot de passe
            </a>
          </p>
          <p style="margin:0;color:#c7d7ee;font-size:13px;">Si tu n'es pas a l'origine de cette demande, ignore cet email.</p>
        `,
      ),
    });
  } catch {
    return { sent: false as const, reason: "smtp_send_failed" as const };
  }

  return { sent: true as const };
}

type InvoiceLine = {
  slug: string;
  title: string;
  unitPriceCents: number;
};

type PurchaseConfirmationInput = {
  to: string;
  orderId: string;
  totalCents: number;
  currency: string;
  items: InvoiceLine[];
  purchasedAt: Date;
};

type ProductAccessInput = {
  to: string;
  orderId: string;
  items: InvoiceLine[];
};

function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export async function sendAccountCreatedEmail(to: string) {
  const mail = getTransporter();
  if (!mail) {
    return { sent: false as const, reason: "smtp_not_configured" as const };
  }

  const appUrl = getPublicAppUrl();
  await mail.transporter.sendMail({
    from: mail.from,
    to,
    subject: "Nebula Dream - Compte cree",
    text: `Bienvenue sur Nebula Dream.\nTon compte est pret.\nAccede a ton espace: ${appUrl}/compte`,
    html: renderEmailShell(
      "Bienvenue sur Nebula Dream",
      "Ton compte vient d'etre cree avec succes.",
      `
        <p style="margin:0 0 10px;">Tu peux maintenant ecouter, acheter et telecharger tes musiques relaxantes.</p>
        <p style="margin:0;">
          <a href="${appUrl}/compte" style="display:inline-block;background:#89e8ff;color:#042033;text-decoration:none;padding:10px 14px;border-radius:10px;font-weight:700;">
            Acceder a mon compte
          </a>
        </p>
      `,
    ),
  });

  return { sent: true as const };
}

export async function sendSignupVerificationEmail(to: string, verifyUrl: string) {
  const mail = getTransporter();
  if (!mail) {
    return { sent: false as const, reason: "smtp_not_configured" as const };
  }

  try {
    await mail.transporter.sendMail({
      from: mail.from,
      to,
      subject: "Nebula Dream - Verifie ton email",
      text: `Pour activer ton inscription, ouvre ce lien:\n${verifyUrl}\n\nSi tu n'es pas a l'origine de cette demande, ignore cet email.`,
      html: renderEmailShell(
        "Confirme ton inscription",
        "Clique pour verifier ton adresse email avant d'activer ton compte.",
        `
          <p style="margin:0 0 10px;">Validation de ton email :</p>
          <p style="margin:0 0 14px;">
            <a href="${verifyUrl}" style="display:inline-block;background:#89e8ff;color:#042033;text-decoration:none;padding:10px 14px;border-radius:10px;font-weight:700;">
              Verifier mon email
            </a>
          </p>
          <p style="margin:0;color:#c7d7ee;font-size:13px;">Ce lien expire dans 1 heure.</p>
        `,
      ),
    });
  } catch {
    return { sent: false as const, reason: "smtp_send_failed" as const };
  }

  return { sent: true as const };
}

export async function sendPurchaseConfirmationEmail(input: PurchaseConfirmationInput) {
  const mail = getTransporter();
  if (!mail) {
    return { sent: false as const, reason: "smtp_not_configured" as const };
  }

  const appUrl = getPublicAppUrl();
  const rows = input.items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 10px;border-bottom:1px solid rgba(255,255,255,0.12);">${item.title}</td>
        <td style="padding:8px 10px;border-bottom:1px solid rgba(255,255,255,0.12);text-align:right;">${formatMoney(item.unitPriceCents, input.currency)}</td>
      </tr>`,
    )
    .join("");

  const purchasedAt = input.purchasedAt.toLocaleString("fr-CA");
  const total = formatMoney(input.totalCents, input.currency);

  await mail.transporter.sendMail({
    from: mail.from,
    to: input.to,
    subject: "Nebula Dream - Confirmation de commande",
    text: `Merci pour ton achat sur Nebula Dream.\nCommande: ${input.orderId}\nDate: ${purchasedAt}\nTotal: ${total}\n\nTes tracks sont disponibles dans ton compte.`,
    html: renderEmailShell(
      "Confirmation de commande",
      "Merci pour ton achat sur Nebula Dream.",
      `
        <p style="margin:0 0 2px;"><strong>Commande:</strong> ${input.orderId}</p>
        <p style="margin:0 0 12px;"><strong>Date:</strong> ${purchasedAt}</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:10px;background:rgba(255,255,255,0.03);">
          <thead>
            <tr>
              <th style="text-align:left;padding:8px 10px;border-bottom:1px solid rgba(255,255,255,0.2);">Track</th>
              <th style="text-align:right;padding:8px 10px;border-bottom:1px solid rgba(255,255,255,0.2);">Prix</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
        <p style="margin:0 0 12px;font-size:18px;"><strong>Total: ${total}</strong></p>
        <a href="${appUrl}/compte" style="display:inline-block;background:#89e8ff;color:#042033;text-decoration:none;padding:10px 14px;border-radius:10px;font-weight:700;">
          Voir mes achats
        </a>
      `,
    ),
  });

  return { sent: true as const };
}

export async function sendProductAccessEmail(input: ProductAccessInput) {
  const mail = getTransporter();
  if (!mail) {
    return { sent: false as const, reason: "smtp_not_configured" as const };
  }

  const appUrl = getPublicAppUrl();
  const list = input.items
    .map(
      (item) => `
        <li style="margin:0 0 8px;">
          <strong>${item.title}</strong>
        </li>
      `,
    )
    .join("");

  await mail.transporter.sendMail({
    from: mail.from,
    to: input.to,
    subject: "Nebula Dream - Acces a tes musiques",
    text: `Tes musiques sont disponibles.\nCommande: ${input.orderId}\nAcces: ${appUrl}/compte`,
    html: renderEmailShell(
      "Acces a tes musiques",
      "Tes tracks sont maintenant disponibles au telechargement.",
      `
        <p style="margin:0 0 10px;">Commande: <strong>${input.orderId}</strong></p>
        <p style="margin:0 0 10px;">Tracks disponibles :</p>
        <ul style="margin:0;padding-left:18px;">${list}</ul>
        <p style="margin:12px 0 0;">
          <a href="${appUrl}/compte" style="display:inline-block;background:#89e8ff;color:#042033;text-decoration:none;padding:10px 14px;border-radius:10px;font-weight:700;">
            Ouvrir mon espace de telechargement
          </a>
        </p>
      `,
    ),
  });

  return { sent: true as const };
}
