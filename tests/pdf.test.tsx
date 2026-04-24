import { describe, it, expect } from "vitest";
import { renderToString } from "@react-pdf/renderer";
import { SimulationPdf } from "@/ui/pdf/SimulationPdf";
import type { JurisdictionResult, FormState } from "@/ui/hooks/useSimulation";
import { calculateTax } from "@/engine/calculateTax";
import { calculateCostOfLiving } from "@/costOfLiving/calculate";
import { getQualityOfLife } from "@/scoring/qolIndex";
import { buildVerdict } from "@/scoring/composite";
import { generateProsCons } from "@/scoring/prosCons";
import { flowToEUR } from "@/engine/flow";
import type { Jurisdiction } from "@/engine/types";

const form: FormState = {
  profile: "SOLO",
  grossAnnual: 150_000,
  businessExpenses: 0,
  familyStatus: "single",
  children: 0,
  age: 35,
  lifestyle: {
    housingType: "t2",
    location: "center",
    carOwnership: false,
    privateHealthcare: true,
    diningOutFrequency: "medium",
  },
  jurisdictions: ["FR", "US_FL_MIAMI", "UK"],
  maltaAcknowledged: false,
};

function mkResult(j: Jurisdiction): JurisdictionResult {
  const result = calculateTax({
    profile: form.profile,
    revenue: { grossAnnual: form.grossAnnual, businessExpensesAnnual: 0 },
    personal: { familyStatus: "single", children: 0, age: 35 },
    jurisdiction: j,
  });
  const col = calculateCostOfLiving({ jurisdiction: j, lifestyle: form.lifestyle, age: 35 });
  const qol = getQualityOfLife(j);
  const flowEUR = flowToEUR(result.flow);
  const netInHandEUR = flowEUR.netTakeHome;
  const verdict = buildVerdict({ result, col, qol, revenueGrossEUR: form.grossAnnual, netInHandEUR });
  const prosCons = generateProsCons({ result, col, qol, revenueGrossEUR: form.grossAnnual });
  const netAfterColAnnualEUR = netInHandEUR - col.totalAnnual;
  return {
    jurisdiction: j,
    result,
    flowEUR,
    col,
    qol,
    verdict,
    prosCons,
    netAfterColAnnualEUR,
    netAfterColMonthlyEUR: netAfterColAnnualEUR / 12,
    netInHandEUR,
  };
}

describe("SimulationPdf — génération PDF FR + EN", () => {
  const results = form.jurisdictions
    .map(mkResult)
    .sort((a, b) => b.netAfterColMonthlyEUR - a.netAfterColMonthlyEUR);

  it("génère un PDF valide en français (header + EOF)", async () => {
    const output = await renderToString(
      <SimulationPdf results={results} form={form} locale="fr" generatedAt={new Date("2026-04-24")} />
    );
    expect(output).toMatch(/^%PDF-/);
    expect(output).toContain("%%EOF");
    expect(output.length).toBeGreaterThan(1000);
  });

  it("génère un PDF valide en anglais", async () => {
    const output = await renderToString(
      <SimulationPdf results={results} form={form} locale="en" generatedAt={new Date("2026-04-24")} />
    );
    expect(output).toMatch(/^%PDF-/);
    expect(output).toContain("%%EOF");
  });

  it("ne crash pas avec une seule juridiction", async () => {
    const oneResult = [results[0]];
    const output = await renderToString(
      <SimulationPdf results={oneResult} form={form} locale="fr" generatedAt={new Date("2026-04-24")} />
    );
    expect(output).toMatch(/^%PDF-/);
  });
});
