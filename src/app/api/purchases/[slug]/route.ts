import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = {
  params: Promise<{ slug: string }>;
};

export async function DELETE(_: Request, { params }: Params) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }

  const { slug } = await params;
  if (!slug) {
    return NextResponse.json({ error: "Track invalide." }, { status: 400 });
  }

  const userOrders = await prisma.order.findMany({
    where: { userId: user.id, status: "paid" },
    select: { id: true },
  });
  const orderIds = userOrders.map((order) => order.id);
  if (orderIds.length === 0) {
    return NextResponse.json({ ok: true });
  }

  await prisma.orderItem.deleteMany({
    where: {
      trackSlug: slug,
      orderId: { in: orderIds },
    },
  });

  const ordersWithCounts = await prisma.order.findMany({
    where: { id: { in: orderIds } },
    select: { id: true, _count: { select: { items: true } } },
  });
  const emptyOrderIds = ordersWithCounts
    .filter((order) => order._count.items === 0)
    .map((order) => order.id);

  if (emptyOrderIds.length > 0) {
    await prisma.order.deleteMany({
      where: { id: { in: emptyOrderIds } },
    });
  }

  return NextResponse.json({ ok: true });
}
