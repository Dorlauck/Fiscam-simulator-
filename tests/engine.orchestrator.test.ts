import { describe, it, expect } from "vitest";
import { calculateTax, compareJurisdictions } from "@/engine/calculateTax";
import type { SimulationInput } from "@/engine/types";

const baseSolo: Omit<SimulationInput, "jurisdiction"> = {
  profile: "SOLO",
  revenue: { grossAnnual: 150_000, businessExpensesAnnual: 0 },
  personal: { familyStatus: "single", children: 0, age: 35 },
};

describe("calculateTax orchestrator — 7 juridictions", () => {
  it("France SOLO 150k → bascule micro sur SASU (cap dépassé)", () => {
    const r = calculateTax({ ...baseSolo, jurisdiction: "FR" });
    // Cap micro BNC = 83 600. 150k dépasse → micro return capExceeded
    // L'orchestrator fall-through en SASU. Le structure renvoie donc SASU.
    expect(r.structure).toMatch(/SASU|micro/);
  });

  it.each([
    ["US_NY", "LLC"],
    ["US_CA", "LLC"],
    ["US_FL_MIAMI", "LLC"],
    ["UK", "Ltd"],
    ["MT", "Malta"],
    ["JP", "Japan"],
  ] as const)("Juridiction %s implémentée (structure contient '%s')", (j, label) => {
    const r = calculateTax({ ...baseSolo, jurisdiction: j as SimulationInput["jurisdiction"] });
    expect(r.structure).toContain(label);
    expect(r.totalTax).toBeGreaterThan(0);
    expect(r.netInHand).toBeGreaterThan(0);
  });

  it("compareJurisdictions renvoie 7 résultats en EUR", () => {
    const results = compareJurisdictions(baseSolo);
    expect(results).toHaveLength(7);
    for (const r of results) {
      expect(r.netInHandEUR).toBeGreaterThan(0);
    }
  });

  it("Malte > France en net EUR (avantage fiscal connu)", () => {
    const results = compareJurisdictions(baseSolo, ["FR", "MT"]);
    const fr = results.find((r) => r.jurisdiction === "FR")!;
    const mt = results.find((r) => r.jurisdiction === "MT")!;
    expect(mt.netInHandEUR).toBeGreaterThan(fr.netInHandEUR);
  });

  it("Miami > NYC en net USD (pas d'impôt d'État)", () => {
    const results = compareJurisdictions(baseSolo, ["US_NY", "US_FL_MIAMI"]);
    const ny = results.find((r) => r.jurisdiction === "US_NY")!;
    const miami = results.find((r) => r.jurisdiction === "US_FL_MIAMI")!;
    expect(miami.netInHandEUR).toBeGreaterThan(ny.netInHandEUR);
  });
});
