import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { computeOptimizedPrice } from "@/lib/pricing";
import { getPublicAppUrl } from "@/lib/public-url";
import { getStripe } from "@/lib/stripe";
import { getTracks } from "@/lib/tracks";

const schema = z.object({
  trackSlugs: z.array(z.string().min(1)).min(1),
});

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }

  try {
    const { trackSlugs } = schema.parse(await request.json());
    const uniqueSlugs = [...new Set(trackSlugs)];
    const allTracks = await getTracks();
    const trackMap = new Map(allTracks.map((track) => [track.slug, track]));
    const selectedTracks = uniqueSlugs
      .map((slug) => trackMap.get(slug))
      .filter((track) => track !== undefined);

    if (selectedTracks.length === 0) {
      return NextResponse.json({ error: "Aucune track valide." }, { status: 400 });
    }

    const pricing = computeOptimizedPrice(selectedTracks.length);
    const stripe = getStripe();
    const appUrl = getPublicAppUrl();
    const automaticTaxEnabled = process.env.STRIPE_AUTOMATIC_TAX_ENABLED === "true";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/`,
      customer_email: user.email,
      billing_address_collection: "required",
      automatic_tax: { enabled: automaticTaxEnabled },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "cad",
            unit_amount: pricing.totalCents,
            product_data: {
              name: `Nebula Dream - ${selectedTracks.length} track(s)`,
              description: "Pack de tracks relaxantes numeriques",
            },
          },
        },
      ],
      metadata: {
        userId: user.id,
        trackSlugs: JSON.stringify(selectedTracks.map((track) => track.slug)),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[checkout] session creation failed", error);
    const message = error instanceof Error ? error.message : "";
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Requete checkout invalide." }, { status: 400 });
    }
    if (message.includes("STRIPE_SECRET_KEY")) {
      return NextResponse.json(
        { error: "Paiement indisponible: STRIPE_SECRET_KEY manquant." },
        { status: 500 },
      );
    }
    if (message.includes("APP_URL")) {
      return NextResponse.json(
        { error: "Paiement indisponible: APP_URL non configure." },
        { status: 500 },
      );
    }

    if (message) {
      return NextResponse.json({ error: `Paiement Stripe: ${message}` }, { status: 500 });
    }

    return NextResponse.json({ error: "Paiement indisponible (erreur interne)." }, { status: 500 });
  }
}
