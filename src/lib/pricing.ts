export const TRACK_PRICE_CENTS = 199;
export const PACK_5_PRICE_CENTS = 799;
export const PACK_10_PRICE_CENTS = 999;

export type PricingBreakdown = {
  trackCount: number;
  packs10: number;
  packs5: number;
  singles: number;
  totalCents: number;
};

export function computeOptimizedPrice(trackCount: number): PricingBreakdown {
  const safeCount = Math.max(0, Math.floor(trackCount));
  const packs10 = Math.floor(safeCount / 10);
  const remainderAfter10 = safeCount % 10;
  const packs5 = Math.floor(remainderAfter10 / 5);
  const singles = remainderAfter10 % 5;

  const totalCents =
    packs10 * PACK_10_PRICE_CENTS +
    packs5 * PACK_5_PRICE_CENTS +
    singles * TRACK_PRICE_CENTS;

  return {
    trackCount: safeCount,
    packs10,
    packs5,
    singles,
    totalCents,
  };
}

export function formatCad(cents: number): string {
  const formatted = new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD",
  }).format(cents / 100);
  return `${formatted} CAD`;
}

export function formatUsd(cents: number): string {
  return formatCad(cents);
}
