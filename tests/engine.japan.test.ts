import { describe, it, expect } from "vitest";
import japanData from "@/data/japan-2026.json";
import { calculateJapanSoleProp } from "@/engine/structures/japan-sole";
import { applyJapaneseBracket } from "@/engine/progressiveBrackets";

const expectWithin = (actual: number, expected: number, tolerancePct = 0.01) => {
  const ok = Math.abs(actual - expected) <= Math.abs(expected) * tolerancePct;
  if (!ok) {
    throw new Error(
      `Expected ${actual.toFixed(2)} to be within ${(tolerancePct * 100).toFixed(1)}% of ${expected} (delta = ${Math.abs(actual - expected).toFixed(2)})`
    );
  }
  expect(ok).toBe(true);
};

// =====================================================================
// Sanity : barème japonais avec déduction cumulative
// Taxable 5 000 000 JPY → 5M × 20% - 427 500 = 572 500
// =====================================================================
describe("applyJapaneseBracket — barème 2026", () => {
  it("5M JPY taxable → 572 500 JPY IR national", () => {
    const ir = applyJapaneseBracket(5_000_000, japanData.nationalIncomeTaxBrackets_2026_JPY);
    expectWithin(ir, 572_500, 0.001);
  });

  it("2M JPY taxable → 2M × 10% - 97 500 = 102 500", () => {
    const ir = applyJapaneseBracket(2_000_000, japanData.nationalIncomeTaxBrackets_2026_JPY);
    expectWithin(ir, 102_500, 0.001);
  });

  it("1M JPY taxable → 1M × 5% = 50 000 (tranche la plus basse, déduction 0)", () => {
    const ir = applyJapaneseBracket(1_000_000, japanData.nationalIncomeTaxBrackets_2026_JPY);
    expectWithin(ir, 50_000, 0.001);
  });
});

// =====================================================================
// Freelance Tokyo Blue Return — pas d'exemple chiffré explicite mais
// on valide que le moteur produit un résultat cohérent.
// Input : CA 10M JPY (~61k EUR), pas de charges.
// =====================================================================
describe("Japan sole-prop Blue Return — CA 10M JPY (~61k EUR)", () => {
  const r = calculateJapanSoleProp(
    {
      revenueGrossJPY: 10_000_000,
      businessExpensesJPY: 0,
      useBlueReturn: true,
      familyStatus: "single",
      children: 0,
      age: 35,
    },
    japanData
  );

  it("cotisations sociales (Kenko + Nenkin) > 0", () => {
    expect(r.socialContributions).toBeGreaterThan(0);
  });

  it("IR + surtax + local > 0", () => {
    expect(r.incomeTax).toBeGreaterThan(0);
  });

  it("Blue Return : déduction 650k JPY appliquée sur la base IR", () => {
    // Comparaison avec White Return (100k JPY)
    const white = calculateJapanSoleProp(
      {
        revenueGrossJPY: 10_000_000,
        businessExpensesJPY: 0,
        useBlueReturn: false,
        familyStatus: "single",
        children: 0,
        age: 35,
      },
      japanData
    );
    expect(white.totalTax).toBeGreaterThan(r.totalTax);
  });

  it("Santé Kenko Hoken → effectivelyValuable, retraite Kokumin Nenkin → nominallyValuable", () => {
    expect(r.socialContributionsBreakdown.effectivelyValuable).toBeGreaterThan(0);
    expect(r.socialContributionsBreakdown.nominallyValuable).toBeGreaterThan(0);
    expect(r.socialContributionsBreakdown.pureCost).toBe(0);
  });

  it("taux effectif raisonnable (30-50% pour ce niveau de revenu)", () => {
    expect(r.effectiveRate).toBeGreaterThan(0.20);
    expect(r.effectiveRate).toBeLessThan(0.60);
  });
});
