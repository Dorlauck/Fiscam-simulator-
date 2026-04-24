import { describe, it, expect } from "vitest";
import { computeCompositeScore, buildVerdict } from "@/scoring/composite";
import { generateProsCons } from "@/scoring/prosCons";
import { getQualityOfLife } from "@/scoring/qolIndex";
import { calculateCostOfLiving } from "@/costOfLiving/calculate";
import { calculateTax } from "@/engine/calculateTax";
import type { SimulationInput } from "@/engine/types";

const baseInput: SimulationInput = {
  profile: "SOLO",
  revenue: { grossAnnual: 150_000, businessExpensesAnnual: 0 },
  personal: { familyStatus: "single", children: 0, age: 35 },
  lifestyle: {
    housingType: "t2",
    location: "center",
    carOwnership: false,
    privateHealthcare: false,
    diningOutFrequency: "medium",
  },
  jurisdiction: "FR",
};

const EXCHANGE = { EUR_USD: 1.09, EUR_GBP: 0.83, EUR_JPY: 163 };

function netInHandEUR(result: { netInHand: number; jurisdiction: string }): number {
  if (result.jurisdiction === "US_NY" || result.jurisdiction === "US_CA" || result.jurisdiction === "US_FL_MIAMI")
    return result.netInHand / EXCHANGE.EUR_USD;
  if (result.jurisdiction === "UK") return result.netInHand / EXCHANGE.EUR_GBP;
  if (result.jurisdiction === "JP") return result.netInHand / EXCHANGE.EUR_JPY;
  return result.netInHand;
}

describe("computeCompositeScore — invariants", () => {
  it("score borné [0 ; 100]", () => {
    for (const j of ["FR", "US_NY", "US_CA", "US_FL_MIAMI", "UK", "MT", "JP"] as const) {
      const result = calculateTax({ ...baseInput, jurisdiction: j });
      const col = calculateCostOfLiving({
        jurisdiction: j,
        lifestyle: baseInput.lifestyle!,
        age: baseInput.personal.age,
      });
      const qol = getQualityOfLife(j);
      const score = computeCompositeScore({
        result,
        col,
        qol,
        revenueGrossEUR: 150_000,
        netInHandEUR: netInHandEUR(result),
      });
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }
  });

  it("Malte obtient un score plus élevé que la France à CA 150k (fiscalité dominante)", () => {
    const scoreFor = (j: SimulationInput["jurisdiction"]) => {
      const result = calculateTax({ ...baseInput, jurisdiction: j });
      const col = calculateCostOfLiving({
        jurisdiction: j,
        lifestyle: baseInput.lifestyle!,
        age: baseInput.personal.age,
      });
      return computeCompositeScore({
        result,
        col,
        qol: getQualityOfLife(j),
        revenueGrossEUR: 150_000,
        netInHandEUR: netInHandEUR(result),
      });
    };
    expect(scoreFor("MT")).toBeGreaterThan(scoreFor("FR"));
  });

  it("Miami > San Francisco à CA 150k (coût de vie dominant)", () => {
    const scoreFor = (j: SimulationInput["jurisdiction"]) => {
      const result = calculateTax({ ...baseInput, jurisdiction: j });
      const col = calculateCostOfLiving({
        jurisdiction: j,
        lifestyle: baseInput.lifestyle!,
        age: baseInput.personal.age,
      });
      return computeCompositeScore({
        result,
        col,
        qol: getQualityOfLife(j),
        revenueGrossEUR: 150_000,
        netInHandEUR: netInHandEUR(result),
      });
    };
    expect(scoreFor("US_FL_MIAMI")).toBeGreaterThan(scoreFor("US_CA"));
  });
});

describe("buildVerdict — exit tax risk", () => {
  const mkVerdict = (j: SimulationInput["jurisdiction"]) => {
    const result = calculateTax({ ...baseInput, jurisdiction: j });
    const col = calculateCostOfLiving({
      jurisdiction: j,
      lifestyle: baseInput.lifestyle!,
      age: baseInput.personal.age,
    });
    return buildVerdict({
      result,
      col,
      qol: getQualityOfLife(j),
      revenueGrossEUR: 150_000,
      netInHandEUR: netInHandEUR(result),
    });
  };

  it("Malte = exit risk 'none'", () => {
    expect(mkVerdict("MT").exitTaxRisk).toBe("none");
  });

  it("France = exit risk 'high'", () => {
    expect(mkVerdict("FR").exitTaxRisk).toBe("high");
  });

  it("UK = exit risk 'low' (TNRR 5 ans mais pas d'exit tax)", () => {
    expect(mkVerdict("UK").exitTaxRisk).toBe("low");
  });
});

describe("generateProsCons — objectivité", () => {
  const mkProsCons = (j: SimulationInput["jurisdiction"]) => {
    const result = calculateTax({ ...baseInput, jurisdiction: j });
    const col = calculateCostOfLiving({
      jurisdiction: j,
      lifestyle: baseInput.lifestyle!,
      age: baseInput.personal.age,
    });
    return generateProsCons({
      result,
      col,
      qol: getQualityOfLife(j),
      revenueGrossEUR: 150_000,
    });
  };

  it("Malte : 'Aucune exit tax' dans les pros + warning CFC dans les cons", () => {
    const { pros, cons } = mkProsCons("MT");
    expect(pros.some((p) => /exit tax/i.test(p))).toBe(true);
    expect(cons.some((c) => /CFC|substance|résid/i.test(c))).toBe(true);
  });

  it("France : pression fiscale élevée + exit tax en cons", () => {
    const { cons } = mkProsCons("FR");
    expect(cons.some((c) => /pression fiscale/i.test(c))).toBe(true);
    expect(cons.some((c) => /exit tax/i.test(c))).toBe(true);
  });

  it("Japon : sécurité excellente + santé de qualité en pros", () => {
    const { pros } = mkProsCons("JP");
    expect(pros.some((p) => /sécurité/i.test(p))).toBe(true);
    expect(pros.some((p) => /santé/i.test(p))).toBe(true);
  });

  it("USA-NY : 'couverture santé limitée' dans cons (pureCost Medicare <65)", () => {
    const { cons } = mkProsCons("US_NY");
    expect(cons.some((c) => /santé limitée/i.test(c))).toBe(true);
  });
});
