import { prisma } from "@/lib/prisma";

export async function getPurchasedTrackSlugs(userId: string): Promise<string[]> {
  const items = await prisma.orderItem.findMany({
    where: {
      order: {
        userId,
        status: "paid",
      },
    },
    select: { trackSlug: true },
    distinct: ["trackSlug"],
  });

  return items.map((item) => item.trackSlug);
}

export async function hasUserPurchasedTrack(userId: string, trackSlug: string): Promise<boolean> {
  const item = await prisma.orderItem.findFirst({
    where: {
      trackSlug,
      order: {
        userId,
        status: "paid",
      },
    },
    select: { id: true },
  });

  return Boolean(item);
}
