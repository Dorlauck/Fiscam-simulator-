import { describe, it, expect } from "vitest";
import ukData from "@/data/uk-2026.json";
import { calculateUkLtd } from "@/engine/structures/uk-ltd";

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
// EXEMPLE 3B — UK Ltd Company, CA £413 000 (=500k€)
// COGS 289k, OpEx 41.3k → Profit before salary 82.7k
// Salary £12 570 (personal allowance), dividend target £70 130
//
// NOTE : l'exemple 3B dans 07_EXAMPLES.md contient DEUX erreurs arithmétiques
// qui brisent l'identité comptable (revenue = taxes + net + retenu + charges) :
//   1) Base Corp Tax : la doc calcule CT sur (revenue - expenses - employer_NI)
//      sans déduire le salary. HMRC : CT base = profit après déduction du salaire.
//      → CT correct ≈ £14 534 (au lieu de £17 865)
//   2) Higher-rate slice dividende : la doc écrit "13 430" alors que le total
//      income atteint £76 270, donc la tranche higher vaut 16 761 de dividende
//      taxable après remplissage de la tranche basique.
//      → Dividend tax ≈ £9 991 (au lieu de £8 800)
//
// Valeurs HMRC-correctes (avec identité comptable vérifiée) :
//   Employer NI     : £1 135
//   CT              : £14 534
//   Div tax         : £9 991
//   Total taxes     : £25 660
//   Net director    : £57 040
//   Dividende distribué : £54 461 (= profitAfterCT, < cible £70 130)
// =====================================================================
describe("Exemple 3B — UK Ltd Co £413 000 (HMRC-correct)", () => {
  const r = calculateUkLtd(
    {
      revenueGrossGBP: 413_000,
      businessExpensesGBP: 289_000 + 41_300,
      salaryBrutGBP: 12_570,
      dividendTargetGBP: 70_130,
      familyStatus: "single",
      children: 0,
    },
    ukData
  );

  it("Employer NI ≈ £1 135", () => {
    expectWithin(r.socialContributions, 1_135, 0.02);
  });

  it("Corporation Tax HMRC-correct ≈ £14 534 (CT base inclut salaire déduit)", () => {
    expectWithin(r.corporateTax, 14_534, 0.02);
  });

  it("IR sur salaire = 0 (dans personal allowance £12 570)", () => {
    expect(r.incomeTax).toBe(0);
  });

  it("Dividend tax HMRC-correct ≈ £9 991", () => {
    expectWithin(r.dividendTax, 9_991, 0.02);
  });

  it("total taxes ≈ £25 660 (HMRC-correct)", () => {
    expectWithin(r.totalTax, 25_660, 0.02);
  });

  it("net director ≈ £57 040", () => {
    expectWithin(r.netInHand, 57_040, 0.02);
  });

  it("identité comptable : revenue = expenses + totalLevied + netTakeHome + retained", () => {
    const f = r.flow;
    const sum = f.businessExpenses + f.totalLevied + f.netTakeHome + f.retainedAmount;
    expect(Math.abs(sum - f.revenue) / f.revenue).toBeLessThan(0.005);
  });
});
