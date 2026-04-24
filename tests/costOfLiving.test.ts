import { describe, it, expect } from "vitest";
import { calculateCostOfLiving } from "@/costOfLiving/calculate";

const baseLifestyle = {
  housingType: "t2" as const,
  location: "center" as const,
  carOwnership: false,
  privateHealthcare: false,
  diningOutFrequency: "medium" as const,
};

describe("calculateCostOfLiving — conversion EUR & sélection loyer", () => {
  it("Paris t2 centre — tout en EUR, pas de conversion", () => {
    const r = calculateCostOfLiving({
      jurisdiction: "FR",
      lifestyle: baseLifestyle,
      age: 35,
    });
    expect(r.localCurrency).toBe("EUR");
    expect(r.rent).toBe(1800); // rent_1br_center
    expect(r.totalMonthly).toBeGreaterThan(0);
    expect(r.totalAnnual).toBeCloseTo(r.totalMonthly * 12, 2);
  });

  it("NYC t2 centre — converti en EUR (÷1.09)", () => {
    const r = calculateCostOfLiving({
      jurisdiction: "US_NY",
      lifestyle: baseLifestyle,
      age: 35,
    });
    expect(r.localCurrency).toBe("USD");
    // rent_1br_center_monthly = 4200 USD → ~3853 EUR
    expect(r.rent).toBeGreaterThan(3800);
    expect(r.rent).toBeLessThan(3900);
  });

  it("Tokyo studio centre — converti en EUR (÷163)", () => {
    const r = calculateCostOfLiving({
      jurisdiction: "JP",
      lifestyle: { ...baseLifestyle, housingType: "studio" },
      age: 35,
    });
    expect(r.localCurrency).toBe("JPY");
    // rent_1R_1K_central_monthly = 140 000 JPY → ~859 EUR
    expect(r.rent).toBeGreaterThan(800);
    expect(r.rent).toBeLessThan(900);
  });

  it("Miami < 65 ans : assurance santé privée incluse automatiquement", () => {
    const r = calculateCostOfLiving({
      jurisdiction: "US_FL_MIAMI",
      lifestyle: { ...baseLifestyle, privateHealthcare: false },
      age: 35,
    });
    expect(r.healthcare).toBeGreaterThan(0); // 625 USD → ~573 EUR
  });

  it("France : santé publique = 0 (pas de privée si pas cochée)", () => {
    const r = calculateCostOfLiving({
      jurisdiction: "FR",
      lifestyle: { ...baseLifestyle, privateHealthcare: false },
      age: 35,
    });
    expect(r.healthcare).toBe(0);
  });

  it("Voiture remplace transport public quand carOwnership=true", () => {
    const withCar = calculateCostOfLiving({
      jurisdiction: "FR",
      lifestyle: { ...baseLifestyle, carOwnership: true },
      age: 35,
    });
    const withoutCar = calculateCostOfLiving({
      jurisdiction: "FR",
      lifestyle: { ...baseLifestyle, carOwnership: false },
      age: 35,
    });
    expect(withCar.transport).toBeGreaterThan(withoutCar.transport);
  });

  it("Classement logements : t2 < t3 < t4 (centre Paris)", () => {
    const mk = (h: "t2" | "t3" | "t4") =>
      calculateCostOfLiving({
        jurisdiction: "FR",
        lifestyle: { ...baseLifestyle, housingType: h },
        age: 35,
      }).rent;
    expect(mk("t2")).toBeLessThan(mk("t3"));
    expect(mk("t3")).toBeLessThan(mk("t4"));
  });

  it("Dining out fréquence impact le total", () => {
    const low = calculateCostOfLiving({
      jurisdiction: "FR",
      lifestyle: { ...baseLifestyle, diningOutFrequency: "low" },
      age: 35,
    });
    const high = calculateCostOfLiving({
      jurisdiction: "FR",
      lifestyle: { ...baseLifestyle, diningOutFrequency: "high" },
      age: 35,
    });
    expect(high.diningOut).toBeGreaterThan(low.diningOut);
    expect(high.totalMonthly).toBeGreaterThan(low.totalMonthly);
  });
});

describe("calculateCostOfLiving — invariants globaux", () => {
  it("toutes les juridictions retournent un totalMonthly > 0", () => {
    const jurisdictions = [
      "FR",
      "US_NY",
      "US_CA",
      "US_FL_MIAMI",
      "UK",
      "MT",
      "JP",
    ] as const;
    for (const j of jurisdictions) {
      const r = calculateCostOfLiving({
        jurisdiction: j,
        lifestyle: baseLifestyle,
        age: 35,
      });
      expect(r.totalMonthly).toBeGreaterThan(500);
      expect(r.totalMonthly).toBeLessThan(20_000);
    }
  });

  it("Malte est moins chère que Paris en t2 centre", () => {
    const mt = calculateCostOfLiving({ jurisdiction: "MT", lifestyle: baseLifestyle, age: 35 });
    const fr = calculateCostOfLiving({ jurisdiction: "FR", lifestyle: baseLifestyle, age: 35 });
    expect(mt.totalMonthly).toBeLessThan(fr.totalMonthly);
  });
});
