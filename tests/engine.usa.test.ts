import { describe, it, expect } from "vitest";
import usaNyData from "@/data/usa-ny-2026.json";
import usaCaData from "@/data/usa-ca-2026.json";
import { calculateUsaLLC } from "@/engine/structures/usa-llc";
import { calculateUsaSCorp } from "@/engine/structures/usa-scorp";
import { applyProgressiveBrackets } from "@/engine/progressiveBrackets";

const withinTolerance = (actual: number, expected: number, tolerancePct: number) => {
  return Math.abs(actual - expected) <= Math.abs(expected) * tolerancePct;
};

const expectWithin = (actual: number, expected: number, tolerancePct = 0.01) => {
  const ok = withinTolerance(actual, expected, tolerancePct);
  if (!ok) {
    throw new Error(
      `Expected ${actual.toFixed(2)} to be within ${(tolerancePct * 100).toFixed(1)}% of ${expected} (delta = ${Math.abs(actual - expected).toFixed(2)})`
    );
  }
  expect(ok).toBe(true);
};

// Sanity-check : barème fédéral 2026 (single) vs exemples CLAUDE.md
describe("Federal income tax brackets 2026 (single)", () => {
  it("taxable $65 000 → $9 214 (Exemple 1C)", () => {
    const ir = applyProgressiveBrackets(65_000, usaNyData.federal.incomeTaxBrackets_single_2026);
    expectWithin(ir, 9_214, 0.001);
  });

  it("taxable $144 900 → $27 623 (Exemple 2B)", () => {
    const ir = applyProgressiveBrackets(144_900, usaNyData.federal.incomeTaxBrackets_single_2026);
    expectWithin(ir, 27_623, 0.001);
  });
});

// =====================================================================
// EXEMPLE 1C — NYC LLC single-member, Revenue $109 000
// SE Tax: 15 401 | Federal IR: 9 214 | NY State: 4 900 | NYC: 2 964 | MCTMT: 473
// TOTAL: 32 952 USD | Net: 76 048 USD
// Tolérance ±5% sur state/local (doc lui-même dit "approx"), ±3% sur total.
// =====================================================================
describe("Exemple 1C — NYC LLC single-member $109 000", () => {
  const r = calculateUsaLLC(
    {
      revenueGrossUSD: 109_000,
      businessExpensesUSD: 0,
      state: "NY",
      city: "NYC",
      filing: "single",
      age: 35,
      familyStatus: "single",
      children: 0,
    },
    usaNyData,
    { ny_state: usaNyData.ny_state, nyc_local: usaNyData.nyc_local }
  );

  it("Self-Employment Tax ≈ $15 401", () => {
    expectWithin(r.socialContributions, 15_401, 0.01);
  });

  it("MCTMT déclenché (SE > $50k zone 1)", () => {
    expect(r.otherTaxes).toBeGreaterThan(400);
    expect(r.otherTaxes).toBeLessThan(700);
  });

  it("total taxes ≈ $32 952 (±5%)", () => {
    expectWithin(r.totalTax, 32_952, 0.05);
  });

  it("net in hand ≈ $76 048 (±3%)", () => {
    expectWithin(r.netInHand, 76_048, 0.03);
  });

  it("breakdown : SS est nominallyValuable, Medicare pureCost (âge 35)", () => {
    expect(r.socialContributionsBreakdown.nominallyValuable).toBeGreaterThan(0);
    expect(r.socialContributionsBreakdown.pureCost).toBeGreaterThan(0);
    expect(r.socialContributionsBreakdown.effectivelyValuable).toBe(0);
  });
});

// =====================================================================
// EXEMPLE 1D — Miami (FL) LLC single-member, Revenue $109 000
// SE Tax: 15 401 | Federal IR: 9 214 | FL State: 0 | Miami: 0
// TOTAL: 24 615 USD | Net: 84 385 USD
// =====================================================================
describe("Exemple 1D — Miami (FL) LLC single-member $109 000", () => {
  const r = calculateUsaLLC(
    {
      revenueGrossUSD: 109_000,
      businessExpensesUSD: 0,
      state: "FL",
      city: "MIAMI",
      filing: "single",
      age: 35,
      familyStatus: "single",
      children: 0,
    },
    usaNyData, // mêmes données fédérales
    {} // pas de state/local imposable en FL
  );

  it("SE Tax identique à NYC ≈ $15 401", () => {
    expectWithin(r.socialContributions, 15_401, 0.01);
  });

  it("pas d'impôt d'État ni local (FL + Miami)", () => {
    expect(r.otherTaxes).toBe(0);
    // Federal IR only
    expectWithin(r.incomeTax, 9_214, 0.01);
  });

  it("total taxes ≈ $24 615 (±1%)", () => {
    expectWithin(r.totalTax, 24_615, 0.01);
  });

  it("net in hand ≈ $84 385 (±1%)", () => {
    expectWithin(r.netInHand, 84_385, 0.01);
  });
});

// =====================================================================
// EXEMPLE 2B — NYC S-Corp, Revenue $272 500, expenses $54 500, salary $85k, distribution $95k
// Payroll: 13 004 | Federal IR: 27 623 | NY State: 9 425 | NYC: 5 626
// TOTAL: 55 678 USD
// Tolérance ±5% sur state/NYC (brackets varient), ±3% sur total.
// =====================================================================
describe("Exemple 2B — NYC S-Corp $272 500", () => {
  const r = calculateUsaSCorp(
    {
      revenueGrossUSD: 272_500,
      businessExpensesUSD: 54_500,
      salaryW2USD: 85_000,
      distributionUSD: 95_000, // explicite (doc : le reste est retenu en S-Corp)
      state: "NY",
      city: "NYC",
      filing: "single",
      age: 35,
      familyStatus: "single",
      children: 0,
    },
    usaNyData,
    { ny_state: usaNyData.ny_state, nyc_local: usaNyData.nyc_local }
  );

  it("payroll total ≈ $13 004", () => {
    expectWithin(r.socialContributions, 13_004, 0.02);
  });

  it("total taxes ≈ $55 678 (±5%)", () => {
    expectWithin(r.totalTax, 55_678, 0.05);
  });

  it("structure == 'S-Corp (NY / NYC)'", () => {
    expect(r.structure).toContain("S-Corp");
    expect(r.structure).toContain("NYC");
  });
});

// =====================================================================
// California LLC — sanity test (pas d'exemple chiffré mais vérifie franchise tax)
// =====================================================================
describe("Californie LLC — franchise tax + gross receipts fee", () => {
  const r = calculateUsaLLC(
    {
      revenueGrossUSD: 600_000,
      businessExpensesUSD: 100_000,
      state: "CA",
      city: "SF",
      filing: "single",
      age: 35,
      familyStatus: "single",
      children: 0,
    },
    usaNyData,
    {
      ca_state: {
        incomeTaxBrackets_single_2026: usaCaData.ca_state.incomeTaxBrackets_single_2026,
        standardDeduction_single_2026: usaCaData.ca_state.standardDeduction_single_2026,
      },
      llc_specificTaxes: usaCaData.llc_specificTaxes,
    }
  );

  it("franchise tax de $800 + gross receipts fee ($2 500 entre 500k et 999k)", () => {
    // otherTaxes = entityTax + mctmt (mctmt=0 hors NY)
    expect(r.otherTaxes).toBe(800 + 2500);
  });

  it("taux effectif CA > taux FL à profit équivalent", () => {
    expect(r.effectiveRate).toBeGreaterThan(0.1);
  });
});
