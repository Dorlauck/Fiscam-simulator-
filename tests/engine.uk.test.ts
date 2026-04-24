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
// Employer NI : 1 135 ✓
// Corp Tax   : 17 865 ✓ (marginal relief 3/200)
// Dividende distribué : £63 700 (= 81 565 - 17 865)
//
// NOTE : l'exemple 3B dans 07_EXAMPLES.md contient une erreur arithmétique
// sur la tranche higher rate dividende : il écrit "Higher rate slice
// (50,270 to 63,700 total) = 13 430 × 35.75%" alors que le total income
// atteint £76 270 (salary + div), donc la higher slice vaut 26 000 et non
// 13 430. Le calcul HMRC correct donne :
//   Basic  : (37 700 - 500) × 10.75% =  3 999
//   Higher : 26 000 × 35.75%           =  9 295
//   Total dividend tax                 = 13 294 (et non 8 800)
// Total taxes GBP réel ≈ 32 294 (et non 27 800).
// Net director réel ≈ 62 976 (et non 67 470).
//
// On teste le calcul HMRC-correct. Les valeurs "doc" sont documentées
// mais pas utilisées comme référence.
// =====================================================================
describe("Exemple 3B — UK Ltd Co £413 000", () => {
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

  it("Corporation Tax ≈ £17 865 (marginal relief 3/200)", () => {
    expectWithin(r.corporateTax, 17_865, 0.02);
  });

  it("IR sur salaire = 0 (dans personal allowance £12 570)", () => {
    expect(r.incomeTax).toBe(0);
  });

  it("Dividend tax HMRC-correct ≈ £13 294 (basic 3 999 + higher 9 295)", () => {
    expectWithin(r.dividendTax, 13_294, 0.01);
  });

  it("total taxes ≈ £32 294 (HMRC-correct)", () => {
    expectWithin(r.totalTax, 32_294, 0.02);
  });

  it("net director ≈ £62 976 (salary 12 570 + dividende net 50 406)", () => {
    expectWithin(r.netInHand, 62_976, 0.02);
  });
});
