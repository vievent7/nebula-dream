import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_: Request, { params }: Params) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });

  if (!order || order.userId !== user.id) {
    return NextResponse.json({ error: "Commande introuvable." }, { status: 404 });
  }

  await prisma.order.delete({ where: { id: order.id } });
  return NextResponse.json({ ok: true });
}
