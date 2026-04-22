import Stripe from "stripe";
import { sendProductAccessEmail, sendPurchaseConfirmationEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import { getTracks } from "@/lib/tracks";

export async function upsertPaidOrderFromCheckoutSession(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const rawTrackSlugs = session.metadata?.trackSlugs;

  if (
    !userId ||
    !rawTrackSlugs ||
    !session.id ||
    session.payment_status !== "paid" ||
    !session.amount_total
  ) {
    return;
  }

  let parsed: string[] = [];
  try {
    parsed = JSON.parse(rawTrackSlugs) as string[];
  } catch {
    return;
  }

  const uniqueSlugs = [...new Set(parsed)];
  const existing = await prisma.order.findUnique({
    where: { stripeSessionId: session.id },
    select: { id: true },
  });
  if (existing) {
    return;
  }

  const tracks = await getTracks();
  const trackMap = new Map(tracks.map((track) => [track.slug, track]));

  const createdOrder = await prisma.order.create({
    data: {
      userId,
      stripeSessionId: session.id,
      totalCents: session.amount_total,
      currency: session.currency ?? "cad",
      status: "paid",
      items: {
        create: uniqueSlugs.map((slug) => ({
          trackSlug: slug,
          trackTitle: trackMap.get(slug)?.title ?? slug,
          unitPriceCents: 199,
        })),
      },
    },
    include: { items: true, user: { select: { email: true } } },
  });

  const emailItems = createdOrder.items.map((item) => ({
    slug: item.trackSlug,
    title: item.trackTitle,
    unitPriceCents: item.unitPriceCents,
  }));

  try {
    await sendPurchaseConfirmationEmail({
      to: createdOrder.user.email,
      orderId: createdOrder.id,
      totalCents: createdOrder.totalCents,
      currency: createdOrder.currency,
      purchasedAt: createdOrder.createdAt,
      items: emailItems,
    });

    await sendProductAccessEmail({
      to: createdOrder.user.email,
      orderId: createdOrder.id,
      items: emailItems,
    });
  } catch {
    // L'achat ne doit jamais echouer a cause d'un incident email.
  }
}

export async function syncRecentPaidSessionsForUser(userId: string) {
  try {
    const sessions = await getStripe().checkout.sessions.list({ limit: 30 });
    const paidForUser = sessions.data.filter(
      (session) => session.metadata?.userId === userId && session.payment_status === "paid",
    );

    for (const session of paidForUser) {
      await upsertPaidOrderFromCheckoutSession(session);
    }
  } catch {
    // ignore sync issues so account page remains available
  }
}
