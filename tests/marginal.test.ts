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

function marginalPer1k(j: Jurisdiction): number {
  // On assume distribution intégrale (dividende illimité) pour capturer le
  // vrai coût fiscal marginal d'un euro supplémentaire.
  const compensation = { salaryBrutAnnual: 45_000, dividendNetTarget: 1_000_000 };
  const r0 = calculateTax({ ...baseInput, compensation, jurisdiction: j });
  const r1 = calculateTax({
    ...baseInput,
    compensation,
    jurisdiction: j,
    revenue: { ...baseInput.revenue, grossAnnual: 151_000 },
  });
  const f0 = flowToEUR(r0.flow);
  const f1 = flowToEUR(r1.flow);
  return f1.netTakeHome - f0.netTakeHome;
}

describe("Net marginal pour +1 000 € de CA", () => {
  it("Malte non-dom : marginal ≈ 1 000 € (pas de prélèvement sur revenu non remitté)", () => {
    const m = marginalPer1k("MT");
    expect(m).toBeGreaterThan(900);
    expect(m).toBeLessThan(1_001);
  });

  it("Miami (FL) : marginal > France (pas de state tax)", () => {
    expect(marginalPer1k("US_FL_MIAMI")).toBeGreaterThan(marginalPer1k("FR"));
  });

  it("France SASU : marginal positif mais rogné (IS + IR)", () => {
    const m = marginalPer1k("FR");
    expect(m).toBeGreaterThan(0);
    expect(m).toBeLessThan(1_000);
  });

  it("Classement cohérent : MT > FL > NY > FR sur 150k", () => {
    const mt = marginalPer1k("MT");
    const fl = marginalPer1k("US_FL_MIAMI");
    const ny = marginalPer1k("US_NY");
    const fr = marginalPer1k("FR");
    expect(mt).toBeGreaterThan(fl);
    expect(fl).toBeGreaterThan(ny);
    expect(ny).toBeGreaterThan(fr);
  });
});
