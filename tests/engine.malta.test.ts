import { describe, it, expect } from "vitest";
import maltaData from "@/data/malta-2026.json";
import { calculateMaltaNonDom, calculateMaltaLtd_6_7 } from "@/engine/structures/malta-nondom";

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
// EXEMPLE 1E — Malte non-dom, CA 100k€ via holding UAE, remit 35k€
// IR sur 35k€ (single) :
//   0-12k : 0
//   12-16k : 4000 × 15% = 600
//   16-35k : 19000 × 25% = 4 750
//   Total IR : 5 350 €
// Min non-dom (foreign > 35k) : 5 000 € déjà dépassé.
// Net : 100 000 - 5 350 = 94 650 €
// =====================================================================
describe("Exemple 1E — Malte non-dom, CA 100k€ remit 35k€", () => {
  const r = calculateMaltaNonDom(
    {
      foreignIncomeTotalEUR: 100_000,
      remittanceToMaltaEUR: 35_000,
      maltaSourceIncomeEUR: 0,
      familyStatus: "single",
      children: 0,
    },
    maltaData
  );

  it("IR ≈ 5 350 €", () => {
    expectWithin(r.incomeTax, 5_350, 0.01);
  });

  it("Net annuel ≈ 94 650 €", () => {
    expectWithin(r.netInHand, 94_650, 0.01);
  });

  it("taux effectif ≈ 5.35%", () => {
    expectWithin(r.effectiveRate, 0.0535, 0.02);
  });

  it("warning CFC / substance présent", () => {
    expect(r.warnings.length).toBeGreaterThan(0);
    expect(r.warnings[0]).toMatch(/CFC|substance|résid/i);
  });

  it("tout l'IR est classé pureCost (pas de contrepartie sociale directe)", () => {
    expect(r.socialContributionsBreakdown.pureCost).toBeCloseTo(r.incomeTax, 2);
    expect(r.socialContributionsBreakdown.effectivelyValuable).toBe(0);
  });
});

// =====================================================================
// Minimum tax non-dom — foreign income < 35k, pas de minimum imposé
// =====================================================================
describe("Malta non-dom — foreign income 20k (sous seuil), pas de minimum", () => {
  const r = calculateMaltaNonDom(
    {
      foreignIncomeTotalEUR: 20_000,
      remittanceToMaltaEUR: 15_000,
      maltaSourceIncomeEUR: 0,
      familyStatus: "single",
      children: 0,
    },
    maltaData
  );

  // IR sur 15k single :
  //   0-12k : 0
  //   12-15k : 3000 × 15% = 450
  it("IR ≈ 450 € (pas de minimum 5k car foreign < 35k)", () => {
    expectWithin(r.incomeTax, 450, 0.01);
  });
});

// =====================================================================
// EXEMPLE 1F — Malta Ltd + 6/7 refund
// Bénéfice 80 000 €, distribution 80k au shareholder.
// Corp Tax 35% = 28 000
// Net profit après tax = 52 000 (distribuable)
// Distribution = min(80k, 52k) = 52 000
// Refund = 28 000 × 6/7 = 24 000 (si 100% du netProfit distribué)
// Effective corp tax = 28 000 - 24 000 = 4 000 € (soit 5%)
// =====================================================================
describe("Exemple 1F — Malta Ltd avec 6/7 refund sur 80k bénéfice", () => {
  const r = calculateMaltaLtd_6_7(
    {
      profitBeforeTaxEUR: 80_000,
      distributedToShareholderEUR: 80_000, // plus que net profit, sera capé à 52k
    },
    maltaData
  );

  it("Corp Tax initial 35% = 28 000 €", () => {
    expectWithin(r.initialCorpTax, 28_000, 0.001);
  });

  it("Refund 6/7 ≈ 24 000 €", () => {
    expectWithin(r.refund, 24_000, 0.01);
  });

  it("Effective corp tax ≈ 4 000 € (taux effectif 5%)", () => {
    expectWithin(r.effectiveCorpTax, 4_000, 0.01);
    expectWithin(r.effectiveCorpRate, 0.05, 0.01);
  });
});

// =====================================================================
// EXEMPLE 2C — OpCo + Holdco (bénéfice 200k, rému 0, vit de dividendes)
// OpCo Corp Tax: 200k × 35% = 70 000
// Distribution 130k à Holdco → refund 6/7 × 70k = 60 000
// Effective Corp : 70 - 60 = 10 000 (5%)
// Fondateur remit 50k : IR = 9 100, Total = 19 100
// =====================================================================
describe("Exemple 2C — OpCo + Holdco 200k bénéfice, fondateur remit 50k", () => {
  const corpResult = calculateMaltaLtd_6_7(
    {
      profitBeforeTaxEUR: 200_000,
      distributedToShareholderEUR: 130_000, // vers Holdco
    },
    maltaData
  );

  const personalResult = calculateMaltaNonDom(
    {
      foreignIncomeTotalEUR: 130_000 + 60_000, // revenu "étranger" via Holdco MT
      remittanceToMaltaEUR: 50_000,
      maltaSourceIncomeEUR: 0,
      familyStatus: "single",
      children: 0,
    },
    maltaData
  );

  it("OpCo : Corp Tax effective ≈ 10 000 €", () => {
    expectWithin(corpResult.effectiveCorpTax, 10_000, 0.01);
  });

  it("Personne physique : IR sur remit 50k ≈ 9 100 €", () => {
    // 0-12k : 0
    // 12-16k : 600
    // 16-50k : 34000 × 25% = 8 500
    // Total : 9 100
    expectWithin(personalResult.incomeTax, 9_100, 0.01);
  });

  it("Total Malta (corp + perso) ≈ 19 100 €", () => {
    expectWithin(corpResult.effectiveCorpTax + personalResult.incomeTax, 19_100, 0.01);
  });
});
