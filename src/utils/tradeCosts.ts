/**
 * 台股整股交易成本（模擬交易用）。
 * - 券商手續費：成交金額 × 0.1425%，無條件捨去，整股單筆最低 NT$20
 * - 證券交易稅：只在賣出時收，股票 0.3%、ETF 0.1%，無條件捨去
 * 課程有教這兩項費用，模擬交易也要算進去，報酬才不會比實際好看。
 */
export const BROKER_FEE_RATE = 0.001425;
export const MIN_BROKER_FEE = 20;
export const STOCK_TAX_RATE = 0.003;
export const ETF_TAX_RATE = 0.001;

/** 台股 ETF 代號以 00 開頭（如 0050、00878、00679B） */
export function isEtf(code: string): boolean {
  return /^00\d{2,4}[A-Z]?$/.test(code);
}

export function brokerFee(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  return Math.max(MIN_BROKER_FEE, Math.floor(amount * BROKER_FEE_RATE));
}

export function sellTax(amount: number, code: string): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  return Math.floor(amount * (isEtf(code) ? ETF_TAX_RATE : STOCK_TAX_RATE));
}

export interface BuyCost {
  fee: number;
  /** 實際付出的現金 = 成交金額 + 手續費 */
  total: number;
}

export interface SellProceeds {
  fee: number;
  tax: number;
  /** 實際入帳的現金 = 成交金額 − 手續費 − 證交稅 */
  net: number;
}

export function buyCost(amount: number): BuyCost {
  const fee = brokerFee(amount);
  return { fee, total: amount + fee };
}

export function sellProceeds(amount: number, code: string): SellProceeds {
  const fee = brokerFee(amount);
  const tax = sellTax(amount, code);
  return { fee, tax, net: amount - fee - tax };
}
