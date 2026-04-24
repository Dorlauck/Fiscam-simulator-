import { describe, it, expect } from "vitest";
import { calculateTax } from "@/engine/calculateTax";
import { flowToEUR } from "@/engine/flow";
import type { Jurisdiction, SimulationInput } from "@/engine/types";

const baseInput: SimulationInput = {
  profile: "SOLO",
  revenue: { grossAnnual: 150_000, businessExpensesAnnual: 10_000 },
  personal: { familyStatus: "single", children: 0, age: 35 },
  jurisdiction: "FR",
};

const JURISDICTIONS: Jurisdiction[] = [
  "FR",
  "US_NY",
  "US_CA",
  "US_FL_MIAMI",
  "UK",
  "MT",
  "JP",
];

describe("TaxFlow — cohérence d'identité", () => {
  it.each(JURISDICTIONS)(
    "%s : revenue = expenses + totalLevied + netTakeHome + retainedAmount (± 2%)",
    (j) => {
      const r = calculateTax({ ...baseInput, jurisdiction: j });
      const f = r.flow;
      const sum = f.totalLevied + f.netTakeHome + f.retainedAmount + f.businessExpenses;
      const delta = Math.abs(sum - f.revenue);
      const pct = delta / f.revenue;
      expect(pct, `${j}: sum=${sum.toFixed(0)}, revenue=${f.revenue.toFixed(0)}`).toBeLessThan(
        0.02
      );
    }
  );

  it.each(JURISDICTIONS)("%s : currency marker cohérent", (j) => {
    const r = calculateTax({ ...baseInput, jurisdiction: j });
    const expected =
      j === "FR" || j === "MT"
        ? "EUR"
        : j === "UK"
          ? "GBP"
          : j === "JP"
            ? "JPY"
            : "USD";
    expect(r.flow.currency).toBe(expected);
  });
});

describe("flowToEUR — conversions correctes", () => {
  it("Japon : 10M JPY ≈ 61 350 EUR (taux 163)", () => {
    const r = calculateTax({ ...baseInput, jurisdiction: "JP" });
    const flowJpy = r.flow;
    const flowEur = flowToEUR(flowJpy);
    expect(flowEur.currency).toBe("EUR");
    // revenue 150k EUR × 163 = 24.45M JPY → reconverti = 150k EUR
    expect(flowEur.revenue).toBeCloseTo(150_000, 0);
    // netTakeHome en EUR doit être dans un ordre de grandeur raisonnable
    expect(flowEur.netTakeHome).toBeGreaterThan(50_000);
    expect(flowEur.netTakeHome).toBeLessThan(120_000);
  });

  it("UK : conversion ÷ 0.83", () => {
    const r = calculateTax({ ...baseInput, jurisdiction: "UK" });
    const flowEur = flowToEUR(r.flow);
    expect(flowEur.revenue).toBeCloseTo(150_000, 0);
    expect(flowEur.corporateTax).toBeGreaterThan(0);
    // Valeur corporate tax UK en EUR raisonnable (pas en GBP affiché en EUR)
    expect(flowEur.corporateTax).toBeLessThan(50_000);
  });

  it("USA : conversion ÷ 1.09", () => {
    const r = calculateTax({ ...baseInput, jurisdiction: "US_NY" });
    const flowEur = flowToEUR(r.flow);
    expect(flowEur.revenue).toBeCloseTo(150_000, 0);
    expect(flowEur.selfEmploymentTax).toBeGreaterThan(15_000);
    expect(flowEur.selfEmploymentTax).toBeLessThan(25_000);
  });

  it("France reste identique (pas de conversion)", () => {
    const r = calculateTax({ ...baseInput, jurisdiction: "FR" });
    const flowEur = flowToEUR(r.flow);
    expect(flowEur).toEqual({ ...r.flow, currency: "EUR" });
  });
});

describe("TaxFlow — le trajet raconte une histoire cohérente", () => {
  it("SASU France : IS > 0 quand profit > 0", () => {
    const r = calculateTax({ ...baseInput, jurisdiction: "FR" });
    expect(r.structure).toContain("SASU");
    expect(r.flow.profitBeforeCorpTax).toBeGreaterThan(0);
    expect(r.flow.corporateTax).toBeGreaterThan(0); // AVANT l'audit, IS invisible. Plus maintenant.
    expect(r.flow.salaryGross).toBe(60_000); // default salary
    expect(r.flow.employerContrib).toBeGreaterThan(0);
  });

  it("UK Ltd : distinction salaire / dividende", () => {
    const r = calculateTax({ ...baseInput, jurisdiction: "UK" });
    expect(r.flow.salaryGross).toBeGreaterThan(0);
    expect(r.flow.dividendGross).toBeGreaterThan(0);
    expect(r.flow.dividendTax).toBeGreaterThan(0);
    expect(r.flow.corporateTax).toBeGreaterThan(0);
  });

  it("Malta non-dom : pas de société, pas de cotisations sociales", () => {
    const r = calculateTax({ ...baseInput, jurisdiction: "MT" });
    expect(r.flow.corporateTax).toBe(0);
    expect(r.flow.salaryGross).toBe(0);
    expect(r.flow.selfEmploymentTax).toBe(0);
    expect(r.flow.soleIncomeTax).toBeGreaterThan(0);
  });

  it("USA NYC LLC : SE tax + federal/state/local IR, pas de corp tax", () => {
    const r = calculateTax({ ...baseInput, jurisdiction: "US_NY" });
    expect(r.flow.corporateTax).toBe(0);
    expect(r.flow.selfEmploymentTax).toBeGreaterThan(0);
    expect(r.flow.soleIncomeTax).toBeGreaterThan(0);
    expect(r.flow.otherTaxes).toBeGreaterThan(0); // MCTMT
  });

  it("Japon sole Blue : cotisations + IR national + local", () => {
    const r = calculateTax({ ...baseInput, jurisdiction: "JP" });
    expect(r.flow.selfEmploymentTax).toBeGreaterThan(0); // Kenko + Kokumin
    expect(r.flow.soleIncomeTax).toBeGreaterThan(0); // national + surtax + local
  });
});
