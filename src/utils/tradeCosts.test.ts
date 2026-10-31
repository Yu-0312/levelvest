import { describe, expect, it } from 'vitest';
import { brokerFee, buyCost, isEtf, sellProceeds, sellTax } from './tradeCosts';

describe('台股交易成本', () => {
  it('手續費 0.1425% 無條件捨去，最低 20 元', () => {
    expect(brokerFee(1_080_000)).toBe(1539); // 1 張台積電 @1080
    expect(brokerFee(10_000)).toBe(20); // 14.25 → 最低 20
    expect(brokerFee(0)).toBe(0);
    expect(brokerFee(Number.NaN)).toBe(0);
  });

  it('證交稅只在賣出收：股票 0.3%、ETF 0.1%', () => {
    expect(isEtf('0050')).toBe(true);
    expect(isEtf('00679B')).toBe(true);
    expect(isEtf('2330')).toBe(false);
    expect(sellTax(1_080_000, '2330')).toBe(3240);
    expect(sellTax(182_000, '0050')).toBe(182);
  });

  it('買進實付 = 成交金額 + 手續費；賣出實收 = 成交金額 − 手續費 − 證交稅', () => {
    expect(buyCost(1_080_000)).toEqual({ fee: 1539, total: 1_081_539 });
    expect(sellProceeds(1_080_000, '2330')).toEqual({ fee: 1539, tax: 3240, net: 1_075_221 });
  });

  it('同價買進再賣出必定小賠（交易成本），不會憑空獲利', () => {
    const amount = 205_000;
    const roundTrip = sellProceeds(amount, '2603').net - buyCost(amount).total;
    expect(roundTrip).toBeLessThan(0);
    expect(roundTrip).toBe(-(292 + 615 + 292));
  });
});
