import { describe, it, expect } from "vitest";
import franceData from "@/data/france-2026.json";
import { applyProgressiveBrackets } from "@/engine/progressiveBrackets";
import { calculateMicroEntreprise } from "@/engine/structures/micro-entreprise";
import { calculateSASU } from "@/engine/structures/sasu";
import { calculateEURL_TNS } from "@/engine/structures/eurl-tns";

/**
 * Tolérance : ±1% sur les montants finaux (CLAUDE.md).
 * Les arrondis de cotisations sociales peuvent dériver jusqu'à ±2% (autorisé par le doc).
 */
const withinTolerance = (actual: number, expected: number, tolerancePct: number) => {
  const delta = Math.abs(actual - expected);
  return delta <= Math.abs(expected) * tolerancePct;
};

const expectWithin = (actual: number, expected: number, tolerancePct = 0.01) => {
  const ok = withinTolerance(actual, expected, tolerancePct);
  if (!ok) {
    throw new Error(
      `Expected ${actual} to be within ${tolerancePct * 100}% of ${expected} (delta = ${Math.abs(actual - expected).toFixed(2)})`
    );
  }
  expect(ok).toBe(true);
};

// Sanity-check : le barème IR 2026 doit retourner les valeurs exactes des exemples.
describe("applyProgressiveBrackets — IR France 2026", () => {
  it("52 800 € imposable → 9 005 € IR (Exemple 1B)", () => {
    const ir = applyProgressiveBrackets(52_800, franceData.incomeTaxBrackets);
    expectWithin(ir, 9_005, 0.001); // quasi-exact
  });

  it("42 120 € imposable → 5 802 € IR (Exemple 2A)", () => {
    const ir = applyProgressiveBrackets(42_120, franceData.incomeTaxBrackets);
    expectWithin(ir, 5_802, 0.001);
  });
});

// =====================================================================
// EXEMPLE 1A — Micro BNC CA 100k€ : dépassement du plafond 83 600€
// =====================================================================
describe("Exemple 1A — Micro-entreprise BNC CA 100 000€", () => {
  const r = calculateMicroEntreprise(
    {
      revenueGross: 100_000,
      activity: "liberal_BNC_nonCipav",
      familyStatus: "single",
      children: 0,
    },
    franceData
  );

  it("doit détecter le dépassement du plafond BNC (83 600€)", () => {
    expect(r.capExceeded).toBe(true);
  });

  it("doit suggérer un basculement SASU/EURL", () => {
    expect(r.suggestedStructure).toBe("SASU");
  });

  it("doit émettre un warning explicite", () => {
    expect(r.warnings.join(" ")).toMatch(/plafond|SASU|EURL/i);
  });
});

// =====================================================================
// EXEMPLE 1B — Micro BNC CA 80 000€ sous plafond, célibataire, pas d'ACRE
// Cotisations sociales: 80 000 × 25.6% = 20 480 €
// CFP: 80 000 × 0.2% = 160 €
// IR: sur (80 000 - 34% abattement) = 52 800 € → 9 005 €
// TOTAL: 29 645 € | NET: 50 355 €
// =====================================================================
describe("Exemple 1B — Micro-entreprise BNC CA 80 000€", () => {
  const r = calculateMicroEntreprise(
    {
      revenueGross: 80_000,
      activity: "liberal_BNC_nonCipav",
      familyStatus: "single",
      children: 0,
      applyACRE: false,
    },
    franceData
  );

  it("cotisations sociales ≈ 20 480 €", () => {
    expectWithin(r.socialContributions, 20_480, 0.02);
  });

  it("CFP (autres taxes) ≈ 160 €", () => {
    expectWithin(r.otherTaxes, 160, 0.01);
  });

  it("impôt sur le revenu ≈ 9 005 €", () => {
    expectWithin(r.incomeTax, 9_005, 0.01);
  });

  it("total prélèvements ≈ 29 645 €", () => {
    expectWithin(r.totalTax, 29_645, 0.01);
  });

  it("net annuel ≈ 50 355 €", () => {
    expectWithin(r.netInHand, 50_355, 0.01);
  });

  it("taux effectif ≈ 37.1%", () => {
    expectWithin(r.effectiveRate, 0.371, 0.02);
  });

  it("breakdown cotisations somme aux cotisations totales (±2%)", () => {
    const { effectivelyValuable, nominallyValuable, pureCost } = r.socialContributionsBreakdown;
    const sum = effectivelyValuable + nominallyValuable + pureCost;
    expectWithin(sum, r.socialContributions, 0.02);
  });

  it("pas de dépassement du plafond", () => {
    expect(r.capExceeded).toBeFalsy();
  });
});

// =====================================================================
// EXEMPLE 2A — SASU CA 250k€, salaire 60k + dividendes 80k
// Charges patronales 45% = 27 000, salariales 22% = 13 200
// IS = 24 000 (15% jusqu'à 42 500, 25% au-dessus)
// PFU dividendes 31.4% = 25 120
// IR sur salaire net 46 800 × 0.9 = 42 120 → 5 802
// TOTAL: 95 122 € | NET: 95 878 €
// =====================================================================
describe("Exemple 2A — SASU CA 250 000€ (salaire 60k + dividendes 80k)", () => {
  const r = calculateSASU(
    {
      revenueGross: 250_000,
      businessExpenses: 50_000,
      salaryBrutAnnual: 60_000,
      dividendTarget: 80_000,
      familyStatus: "single",
      children: 0,
    },
    franceData
  );

  it("charges sociales totales ≈ 40 200 €", () => {
    expectWithin(r.socialContributions, 40_200, 0.02);
  });

  it("IS ≈ 24 000 €", () => {
    expectWithin(r.corporateTax, 24_000, 0.01);
  });

  it("PFU dividendes ≈ 25 120 €", () => {
    expectWithin(r.dividendTax, 25_120, 0.01);
  });

  it("IR sur salaire ≈ 5 802 €", () => {
    expectWithin(r.incomeTax, 5_802, 0.01);
  });

  it("total prélèvements ≈ 95 122 €", () => {
    expectWithin(r.totalTax, 95_122, 0.01);
  });

  it("net disponible ≈ 95 878 €", () => {
    expectWithin(r.netInHand, 95_878, 0.01);
  });

  it("breakdown cotisations somme aux cotisations totales", () => {
    const { effectivelyValuable, nominallyValuable, pureCost } = r.socialContributionsBreakdown;
    const sum = effectivelyValuable + nominallyValuable + pureCost;
    expectWithin(sum, r.socialContributions, 0.02);
  });
});

// =====================================================================
// EXEMPLE 3A — EURL IS gérant TNS, CA 500k€ ECOM, marge 25%
// Achats 350k + charges 50k → marge brute 100k avant rému
// Rému 60k → cotisations TNS ~40% = 24k
// Bénéfice IS = 100 - 60 - 24 = 16k → IS 15% = 2 400
// IR sur rému (60k - 10% abat = 54k) ≈ 8-9k selon méthode
// Total ≈ 35 170 € | Net ≈ 40 830 € (avec retained earnings)
// Tolérance ±2% autorisée par le doc sur les arrondis de cotisations.
// =====================================================================
describe("Exemple 3A — EURL IS / gérant TNS, CA 500 000€ ECOM", () => {
  const r = calculateEURL_TNS(
    {
      revenueGross: 500_000,
      businessExpenses: 350_000 + 50_000, // achats + charges pro
      remunerationBrute: 60_000,
      familyStatus: "single",
      children: 0,
    },
    franceData
  );

  it("cotisations TNS ≈ 24 000 € (±2%)", () => {
    expectWithin(r.socialContributions, 24_000, 0.02);
  });

  it("IS ≈ 2 400 € (±1%)", () => {
    expectWithin(r.corporateTax, 2_400, 0.01);
  });

  it("total prélèvements ≈ 35 170 € (±2%)", () => {
    expectWithin(r.totalTax, 35_170, 0.02);
  });

  it("net annuel (y compris retained earnings) ≈ 40 830 € (±2%)", () => {
    expectWithin(r.netInHand, 40_830, 0.02);
  });

  it("taux effectif sur CA ≈ 7% (faible CA mais marges ECOM serrées)", () => {
    expect(r.effectiveRate).toBeGreaterThan(0.06);
    expect(r.effectiveRate).toBeLessThan(0.08);
  });
});
