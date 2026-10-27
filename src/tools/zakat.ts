// Nisab thresholds in grams (classical standards).
export const NISAB_GOLD_G = 87.48;
export const NISAB_SILVER_G = 612.36;
export const ZAKAT_RATE = 0.025;

export type ZakatInput = {
  cash: number;
  goldGrams: number;
  silverGrams: number;
  goodsValue: number;
  receivables: number;
  debts: number;
  goldPrice: number; // per gram
  silverPrice: number; // per gram
};

export type NisabBasis = 'silver' | 'gold';

export type ZakatResult = {
  gross: number;
  net: number;
  nisab: number;
  due: number;
  eligible: boolean;
};

export function calcZakat(i: ZakatInput, basis: NisabBasis): ZakatResult {
  const gross =
    i.cash +
    i.goldGrams * i.goldPrice +
    i.silverGrams * i.silverPrice +
    i.goodsValue +
    i.receivables;
  const net = Math.max(0, gross - i.debts);
  const nisab = basis === 'gold' ? NISAB_GOLD_G * i.goldPrice : NISAB_SILVER_G * i.silverPrice;
  const eligible = nisab > 0 && net >= nisab;
  return {gross, net, nisab, due: eligible ? net * ZAKAT_RATE : 0, eligible};
}
