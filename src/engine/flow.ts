import type { Currency, TaxFlow } from "./types";

/** TaxFlow vide (utile pour cas "cap dépassé" ou erreurs). */
export function emptyFlow(currency: Currency, revenue = 0): TaxFlow {
  return {
    currency,
    revenue,
    businessExpenses: 0,
    salaryCost: 0,
    profitBeforeCorpTax: 0,
    corporateTax: 0,
    profitAfterCorpTax: 0,
    dividendGross: 0,
    retainedInCompany: 0,
    salaryGross: 0,
    employerContrib: 0,
    employeeContrib: 0,
    salaryNet: 0,
    salaryIncomeTax: 0,
    salaryTakeHome: 0,
    dividendTax: 0,
    dividendNet: 0,
    selfEmploymentTax: 0,
    soleIncomeTax: 0,
    otherTaxes: 0,
    totalLevied: 0,
    netTakeHome: 0,
    retainedAmount: 0,
  };
}

/** Taux de change EUR ↔ devise locale (avril 2026). */
export const EXCHANGE_EUR = {
  EUR: 1,
  USD: 1 / 1.09,
  GBP: 1 / 0.83,
  JPY: 1 / 163,
} as const;

/** Convertit un flow de sa devise locale vers EUR. */
export function flowToEUR(flow: TaxFlow): TaxFlow {
  const factor = EXCHANGE_EUR[flow.currency];
  const out = { currency: "EUR" as const } as TaxFlow;
  const mutableOut = out as unknown as Record<string, unknown>;
  (Object.keys(flow) as Array<keyof TaxFlow>).forEach((key) => {
    if (key === "currency") return;
    const v = flow[key] as unknown as number;
    mutableOut[key] = v * factor;
  });
  return out;
}
